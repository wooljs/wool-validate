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

const ParamCheck = require('./ParamCheck')
  , InvalidRuleError = require('./InvalidRuleError')

class TupleCheck extends ParamCheck {
  constructor(k, ld) {
    super(k)
    this.ld = ld
  }
  static build(k, ld) {
    return new TupleCheck(k, ld)
  }
  async _check(store, param, t) {
    let val = this.extractParam(param)
    if (val instanceof Array && val.length === this.ld.length) {
      await Promise.all(val.map((v, i) => { let d = this.ld[i]; return d._check(store, { [d.k]: v }, t) }))
    } else {
      throw new InvalidRuleError('param.check.tuple.invalid', val)
    }
  }
  predicate(f) {
    return new PredicateTupleCheck(this.k, this, f)
  }
}

class PredicateTupleCheck extends TupleCheck {
  constructor(k, d, f) {
    super(k)
    this.d = d
    this.f = f
  }
  async _check(store, param, t) {
    if("undefined" === typeof await this.d._check(store, param, t)) {
      let tpl = this.extractParam(param)
      if (! this.f(tpl)) throw new InvalidRuleError('param.check.tuple.invalid.predicate', v, this.f)
    }
  }
}

module.exports = TupleCheck