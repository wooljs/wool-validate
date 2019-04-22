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

class ListCheck extends ParamCheck {
  constructor(k, d) {
    super(k)
    this.d = d
  }
  static build(k, d) {
    return new ListCheck(k, d)
  }
  async _check(store, param, t) {
    let val = this.extractParam(param)
    if (val instanceof Array) {
      let k = this.d.k
      await Promise.all(val.map(async (v,i) => {
        try {
          await this.d._check(store, {[k]: v}, t)
        } catch(e) {
          if (e instanceof InvalidRuleError) {
            throw this.buildError('param.invalid.list.item.at', i, e.message)
          } else {
            throw e
          }
        }
      }))
    } else {
      throw this.buildError('param.invalid.list', JSON.stringify(val))
    }
  }
  predicate(f) {
    return new PredicateListCheck(this.k, this, f)
  }
}

class PredicateListCheck extends ListCheck {
  constructor(k, d, f) {
    super(k)
    this.d = d
    this.f = f
  }
  async _check(store, param, t) {
    if('undefined' === typeof await this.d._check(store, param, t)) {
      let l = this.extractParam(param)
      if (! this.f(l)) throw this.buildError('param.invalid.list.predicate', JSON.stringify(l), this.f)
    }
  }
}

module.exports = ListCheck