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
    if (k instanceof Array) {
      struct = k
      k = undefined
    }
    super(k)
    if (struct !== ParamCheck.UNDEF) { // no second param in predicate and transform constructors (see ParamCheck)
      this.struct = struct
      if (this.struct.length < 1) throw this.buildError('param.invalid.struct.build.no.definitions')
    }
  }
  copy_instance(k) {
    return new this.constructor(k, this.struct)
  }
  static build(k, struct) {
    return new StructCheck(k, struct)
  }
  async _check(store, param, t) {
    let val = this.extractParam(param)
    if (val === null) throw this.buildError('param.invalid.struct.is.null')
    else if (typeof val === 'object') {
      try {
        await Promise.all(this.struct.map(p => p.validate(store, val, t)))
      } catch(e) {
        if (e instanceof InvalidRuleError) {
          throw this.buildError('param.invalid.struct.item', e.message)
        } else {
          throw e
        }
      }
    } else {
      throw this.buildError('param.invalid.struct', JSON.stringify(val))
    }
  }
  toString_child_list() {
    return this.struct.map(x => x.toFullString())
  }
}
