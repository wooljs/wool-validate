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

module.exports = class TupleCheck extends ParamCheck {
  constructor(k, ld) {
    if (k instanceof Array) {
      ld = k
      k = undefined
    }
    super(k)
    if (ld !== ParamCheck.UNDEF) { // no second param in predicate and transform constructors (see ParamCheck)
      this.ld = ld
      if (this.ld.length < 1) throw this.buildError('param.invalid.tuple.build.no.definitions')
    }
  }
  copy_instance(k) {
    return new this.constructor(k, this.ld)
  }
  static build(k, ld) {
    return new TupleCheck(k, ld)
  }
  async _check(store, param, t) {
    let val = this.extractParam(param)
    if (val instanceof Array) {
      if (val.length === this.ld.length) {
        await Promise.all(val.map(async(v, i) => {
          let d = this.ld[i]
          try {
            await d._check(store, { [d.k]: v }, t)
          } catch(e) {
            if (e instanceof InvalidRuleError) {
              throw this.buildError('param.invalid.tuple.item.at', i, e.message)
            } else {
              throw e
            }
          }
        }))
      } else {
        throw this.buildError('param.invalid.tuple.wrong.length.expected.actual', this.ld.length, val.length, JSON.stringify(val))
      }
    } else {
      throw this.buildError('param.invalid.tuple', JSON.stringify(val))
    }
  }
  toString_child_list() {
    return this.ld.map(x => x.toFullString())
  }
}
