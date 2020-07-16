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
    present: 1,
    absent: 0,
    optional: -1
  }

class ParamCheck {
  constructor(k) {
    this.k = k
    this.keep = true
    this.present()
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
  absent(force_check=false) {
    this.presence = Presence.absent
    this._force_check = force_check
    return this
  }
  present() {
    this.presence = Presence.present
    return this
  }
  optional() {
    this.presence = Presence.optional
    return this
  }
  async validate(store, param, t) {
    switch (this.presence) {
    case Presence.present:
      if (! this.containParam(param)) throw this.buildError('param.should.be.present')
      return await this._check(store, param, t)
    case Presence.absent:
      if (this.containParam(param)) throw this.buildError('param.should.be.absent')
      /// in the absent case we only check the param if asked by implementation
      return this._force_check ? await this._check(store, param, t) : true
    case Presence.optional:
      /// in the optional case we only check the param when it exists, assume it's valid otherwise
      if (this.containParam(param)) return await this._check(store, param, t)
      return true
    default:
      throw this.buildError('param.invalid.value.presence', this.presence)
    }
  }
  async _check(/*store, param, t*/) {}
  buildError(m, ...params) {
    if (this.k) return new InvalidRuleError(m, this, ...params)
    else return new InvalidRuleError(m, ...params)
  }
  drop() {
    this.keep = false
    return this
  }
  undrop() {
    this.keep = true
    return this
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
    this.d = d
    this.f = f
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
    if (! await this.f(p, store)) throw this.buildError('param.invalid.predicate', JSON.stringify(p), this.printPredicate())
  }
  printPredicate() {
    return String(this.f)
  }
}

const TransformCheck = (superclass) => class extends superclass {
  constructor(k, d, f) {
    super(k)
    this.d = d
    this.f = f
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
