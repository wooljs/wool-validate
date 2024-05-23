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

module.exports = class EnumCheck extends ParamCheck {
  constructor(k, values) {
    if (k instanceof Array) {
      values = k
      k = undefined
    }
    super(k)
    if (values !== ParamCheck.UNDEF) { // no second param in predicate and transform constructors (see ParamCheck)
      this.values = values
      if (this.values.length < 2) throw this.buildError('param.invalid.enum.build.not.enough.alternatives')
    }
  }
  static build(k, values) {
    return new EnumCheck(k, values)
  }
  copy_instance(k) {
    return new this.constructor(k, this.values)
  }
  async _check(store, param) {
    let str = this.extractParam(param)
    if (this.values.indexOf(str) === -1) throw this.buildError('param.invalid.enum', JSON.stringify(str))
  }
}
