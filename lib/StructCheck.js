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

module.exports = class StructCheck extends ParamCheck {
  constructor(k, struct) {
    super(k)
    struct.forEach(x => x.parent = this)
    this.struct = struct
  }
  static build(k, struct) {
    return new StructCheck(k, struct)
  }
  async _check(store, param, t) {
    let val = this.extractParam(param)
    if (typeof val === 'object') {
      await Promise.all(this.struct.map(async p => {
        try {
          await p.validate(store, val, t)
        } catch(e) {
          if (e instanceof InvalidRuleError) {
            throw this.buildError('param.invalid.struct.item', p, e.message)
          } else {
            throw e
          }
        }
      }))
    } else {
      throw this.buildError('param.invalid.struct', JSON.stringify(val))
    }
  }
}
