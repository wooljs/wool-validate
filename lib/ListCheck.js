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

module.exports = class ListCheck extends ParamCheck {
  constructor(k, chk) {
    if (k instanceof ParamCheck) {
      chk = k
      k = undefined
    }
    super(k)
    this.chk = chk
  }
  clone() {
    return new this.constructor(this.k, this.chk)
  }
  static build(k, chk) {
    return new ListCheck(k, chk)
  }
  async _check(store, param, t) {
    let val = this.extractParam(param)
    if (val instanceof Array) {
      let k = this.chk.k
      await Promise.all(val.map(async (v,i) => {
        try {
          await this.chk._check(store, {[k]: v}, t)
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
}