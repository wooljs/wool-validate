/*
 * Copyright 2018 Nicolas Lochet Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

import InvalidRuleError from './InvalidRuleError.js'

const Presence = {
  default: 2,
  present: 1,
  absent: 0,
  optional: -1
}

class ParamCheck {
  constructor (k) {
    this.k = k
    this.keep = true
    this.presence = Presence.present
  }

  static build (k) {
    return new ParamCheck(k)
  }

  containParam (param) {
    return this.k in param
  }

  extractParam (param) {
    return param[this.k]
  }

  saveToParam (param, v) {
    param[this.k] = v
  }

  alias (k) {
    return this.clone_props(this.copy_instance(k), this)
  }

  copy_instance (k) {
    return new this.constructor(k)
  }

  clone_props (target, source) {
    const o = { ...source }
    delete o.k // we want all props but not k
    delete o.d // we want all props but not d (for transform & predicate)
    delete o.f // we want all props but not f (for transform & predicate)
    return Object.assign(target, o)
  }

  clone_essential_props (target, source) {
    const { keep, presence } = source
    return Object.assign(target, { keep, presence })
  }

  clone () {
    return this.alias(this.k)
  }

  absent (forceCheck = false) {
    const r = this.clone()
    r.setAbsent(forceCheck)
    return r
  }

  setAbsent (forceCheck = false) {
    this.presence = Presence.absent
    this._force_check = forceCheck
  }

  present () {
    const r = this.clone()
    r.presence = Presence.present
    return r
  }

  optional () {
    const r = this.clone()
    r.presence = Presence.optional
    return r
  }

  default (val) {
    const r = this.clone()
    r.presence = Presence.default
    r.defaultValue = val
    return r
  }

  async validate (store, param, t) {
    try {
      switch (this.presence) {
        case Presence.present:
          if (!this.containParam(param)) throw this.buildError('param.should.be.present')
          return await this._check(store, param, t)
        case Presence.default:
          if (!this.containParam(param)) this.saveToParam(param, this.defaultValue)
          return await this._check(store, param, t)
        case Presence.absent:
          if (this.containParam(param)) throw this.buildError('param.should.be.absent')
          /// in the absent case we only check the param if asked by implementation
          return this._force_check ? await this._check(store, param, t) : undefined // undefined when ok
        case Presence.optional:
        /// in the optional case we only check the param when it exists, assume it's valid otherwise
          if (this.containParam(param)) return await this._check(store, param, t)
          return // undefined when ok
        default:
          throw this.buildError('param.invalid.value.presence', this.presence)
      }
    } catch (e) {
      if (e instanceof InvalidRuleError) throw e
      else throw this.buildError('param.validation.error', e.message, e.stack)
    }
  }

  async _check (/* store, param, t */) { }
  buildError (m, ...params) {
    if (this.k) return new InvalidRuleError(m, this, ...params)
    else return new InvalidRuleError(m, ...params)
  }

  drop () {
    const o = this.clone()
    o.keep = false
    return o
  }

  predicate (f) {
    const P = PredicateCheck(this.constructor)
    return new P(this.k, this, f)
  }

  transform (f) {
    const T = TransformCheck(this.constructor)
    return new T(this.k, this, f)
  }

  toDTO () {
    return { k: this.k, p: this.presence !== Presence.absent }
  }

  toString () {
    return `${this.toString_name()}[${this.toString_key()}]`
  }

  toString_key () {
    return this.k ? `k:${this.k}` : ''
  }

  toFullString () {
    return `${this.toString_name()}[${this.toString_key()}${this.toString_presence()}]${this.toString_child()}${this.toString_fun()}`
  }

  toString_name () {
    return this.constructor.name
  }

  toString_presence () {
    switch (this.presence) {
      case Presence.absent:
        if (this._force_check) return '(!!)'
        else return '(!)'
      case Presence.optional:
        return '(*)'
      case Presence.default:
        return `(=${this.defaultValue})`
      case Presence.present:
      default:
        return ''
    }
  }

  toString_child () {
    const list = this.toString_child_list()
    return list.length ? '{ ' + list.join(', ') + ' }' : ''
  }

  toString_child_list () {
    return []
  }

  toString_fun () {
    return ''
  }

  toDeepString () {
    return this.toString()
  }
}

const PredicateCheck = (superclass) => class extends superclass {
  constructor (k, d, f) {
    super(k, ParamCheck.UNDEF)
    this.clone_essential_props(this, d)
    this.d = d
    this.f = f
  }

  copy_instance (k) {
    return new this.constructor(k, this.d.alias(k), this.f)
  }

  root () {
    if ('d' in this.d) return this.d.root()
    else return this.d
  }

  buildError (m, ...params) {
    return new InvalidRuleError(m, this.root(), ...params)
  }

  async _check (store, param, t) {
    // will throw is check fail
    await this.d._check(store, param, t)

    const p = this.extractParam(param)
    if (!await this.f(p, store, t)) throw this.buildError('param.invalid.predicate', JSON.stringify(p), this.printPredicate())
  }

  predicate (f) {
    const P = PredicateCheck(superclass)
    return new P(this.k, this, f)
  }

  transform (f) {
    const T = TransformCheck(superclass)
    return new T(this.k, this, f)
  }

  printPredicate () {
    return String(this.f)
  }

  toString_name () {
    return this.constructor.name || `P<${this.d.toString_name()}>`
  }

  toString_fun () {
    return `${this.d.toString_fun()}(?:${this.printPredicate()})`
  }

  toDeepString () {
    return this.toString() + '->' + this.d.toDeepString()
  }
}

const TransformCheck = (superclass) => class extends superclass {
  constructor (k, d, f) {
    super(k, ParamCheck.UNDEF)
    this.clone_essential_props(this, d)
    this.d = d
    this.f = f
  }

  copy_instance (k) {
    return new this.constructor(k, this.d.alias(k), this.f)
  }

  root () {
    if ('d' in this.d) return this.d.root()
    else return this.d
  }

  async _check (store, param) {
    // will throw is check fail
    await this.d._check(store, param)

    this.saveToParam(param, await this.f(this.extractParam(param), store))
  }

  predicate (f) {
    const P = PredicateCheck(superclass)
    return new P(this.k, this, f)
  }

  transform (f) {
    const T = TransformCheck(superclass)
    return new T(this.k, this, f)
  }

  toString_name () {
    return this.constructor.name || `T<${this.d.toString_name()}>`
  }

  toString_fun () {
    return `${this.d.toString_fun()}(*:${this.f})`
  }

  toDeepString () {
    return this.toString() + '->' + this.d.toDeepString()
  }
}

ParamCheck.Presence = Presence
ParamCheck.PredicateCheck = PredicateCheck
ParamCheck.TransformCheck = TransformCheck
ParamCheck.UNDEF = []

export default ParamCheck
