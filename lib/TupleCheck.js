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
      let res = true
        , i = 0
        , l = val.length
      for (; i <l ; i++) {
        let d = this.ld[i]
          , v = val[i]
        res = res && await d._check(store, { [d.k]: v }, t)
      }
      return res
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
    if(await this.d._check(store, param, t)) {
      let tpl = this.extractParam(param)
      return this.f(tpl)
    }
  }
}

module.exports = TupleCheck