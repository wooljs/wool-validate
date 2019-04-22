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
    this.presence = Presence.present
  }
  fullKey() {
    return !('parent' in this) ? this.k  : this.parent.fullKey() + '.' + this.k
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
  absent() {
    this.presence = Presence.absent
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
      /// in the absent case we only check the param when absent, use at your own risk
      return await this._check(store, param, t)
    case Presence.optional:
      /// in the optional case we only check the param when it exists, assume it's valid otherwise
      if (this.containParam(param)) return await this._check(store, param, t)
      return true
    default:
      throw this.buildError('param.invalid.value.presence', this.presence)
    }
  }
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
    return `${this.constructor.name}[k:${this.fullKey()}]`
  }
  toDTO() {
    return { k: this.k, p: this.present !== Presence.absent }
  }
}

ParamCheck.Presence = Presence

module.exports = ParamCheck
