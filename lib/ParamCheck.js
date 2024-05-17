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

const InvalidRuleError = require('./InvalidRuleError')
  , Presence = {
    default: 2,
    present: 1,
    absent: 0,
    optional: -1
  }

class ParamCheck {
  constructor(k, keep = true,presence = Presence.present) {
    this.k = k
    this.keep = keep
    this.presence = presence
  }
  static build(k) {
    return new ParamCheck(k)
  }
  containParam(param) {
    return this.k in param
  }
  extractParam(param) {
    return param[this.k]
  }
  saveToParam(param, v) {
    param[this.k] = v
  }
  clone() {
    return new this.constructor(this.k, this.keep, this.presence)
  }
  absent(force_check = false) {
    const r = this.clone()
    r.setAbsent(force_check)
    return r
  }
  setAbsent(force_check = false) {
    this.presence = Presence.absent
    this._force_check = force_check
  }
  present() {
    const r = this.clone()
    r.presence = Presence.present
    return r
  }
  optional() {
    const r = this.clone()
    r.presence = Presence.optional
    return r
  }
  default(val) {
    const r = this.clone()
    r.presence = Presence.default
    r.defaultValue = val
    return r
  }
  async validate(store, param, t) {
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
  async _check(/*store, param, t*/) { }
  buildError(m, ...params) {
    if (this.k) return new InvalidRuleError(m, this, ...params)
    else return new InvalidRuleError(m, ...params)
  }
  drop() {
    const o = new this.constructor(this.k, this)
    Object.assign(o, this, { keep: false })
    return o
  }
  toString() {
    if (this.k) return `${this.constructor.name}[k:${this.k}]`
    else return `${this.constructor.name}[]`
  }
  toDTO() {
    return { k: this.k, p: this.presence !== Presence.absent }
  }
  predicate(f) {
    let P = PredicateCheck(ParamCheck)
    return new P(this.k, this, f)
  }
  transform(f) {
    let T = TransformCheck(ParamCheck)
    return new T(this.k, this, f)
  }
}

const PredicateCheck = (superclass) => class extends superclass {
  constructor(k, d, f) {
    super(k)
    this.keep = d.keep
    this.d = d
    this.f = f
  }
  clone() {
    return new this.constructor(this.k, this.d, this.f)
  }
  root() {
    if ('d' in this.d) return this.d.root()
    else return this.d
  }
  buildError(m, ...params) {
    return new InvalidRuleError(m, this.root(), ...params)
  }
  async _check(store, param, t) {
    // will throw is check fail
    await this.d._check(store, param, t)

    let p = this.extractParam(param)
    if (! await this.f(p, store, t)) throw this.buildError('param.invalid.predicate', JSON.stringify(p), this.printPredicate())
  }
  printPredicate() {
    return String(this.f)
  }
}

const TransformCheck = (superclass) => class extends superclass {
  constructor(k, d, f) {
    super(k)
    this.keep = d.keep
    this.d = d
    this.f = f
  }
  clone() {
    return new this.constructor(this.k, this.d, this.f)
  }
  root() {
    if ('d' in this.d) return this.d.root()
    else return this.d
  }
  async _check(store, param) {
    // will throw is check fail
    await this.d._check(store, param)

    this.saveToParam(param, await this.f(this.extractParam(param), store))
  }
}

ParamCheck.Presence = Presence
ParamCheck.PredicateCheck = PredicateCheck
ParamCheck.TransformCheck = TransformCheck

module.exports = ParamCheck
