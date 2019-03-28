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

module.exports = class DictCheck extends ParamCheck {
  constructor(k, kvd) {
    super(k)
    this.kvd = kvd
  }
  static build(k, kvd) {
    return new DictCheck(k, kvd)
  }
  async _check(store, param, t) {
    let val = this.extractParam(param)
    if (typeof val === 'object' && !(val instanceof Array)) {
      let res = true
        , k = this.kvd.k
      for (let v of Object.entries(val)) {
        res = res && await this.kvd._check(store, { [k]: v }, t)
      }
      return res
    }
  }
}
