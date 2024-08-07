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

import ParamCheck from './ParamCheck.js'
import InvalidRuleError from './InvalidRuleError.js'

export default class ListCheck extends ParamCheck {
  constructor (k, chk) {
    if (k instanceof ParamCheck) {
      chk = k
      k = undefined
    }
    super(k)
    this.chk = chk
  }

  copy_instance (k) {
    return new this.constructor(k, this.chk)
  }

  static build (k, chk) {
    return new ListCheck(k, chk)
  }

  async _check (store, param, t) {
    const val = this.extractParam(param)
    if (val instanceof Array) {
      const k = this.chk.k
      await Promise.all(val.map(async (v, i) => {
        try {
          await this.chk._check(store, { [k]: v }, t)
        } catch (e) {
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

  toString_child_list () {
    return [this.chk.toFullString()]
  }
}
