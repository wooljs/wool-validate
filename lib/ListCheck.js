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

module.exports = class ListCheck extends ParamCheck {
  constructor(d) {
    super(d.k)
    this.d = d
  }
  static build(k, d) {
    return new ListCheck(k, d)
  }
  async validate(store, param) {
    let val = this.extractParam(param)
    if (val instanceof Array) {
      let res = true
      for (let v of val) {
        res = res && await this.d.validate(store, { [this.k]: v })
      }
      return res
    }
  }
}
