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
import EnumCheck from './EnumCheck.js'
import StrCheck from './StrCheck.js'
import ValidId from './ValidId.js'
import InvalidRuleError from './InvalidRuleError.js'

export default class DictCheck extends ParamCheck {
  constructor (k, kchk, vchk) {
    if (k instanceof ParamCheck) {
      vchk = kchk
      kchk = k
      k = undefined
    }
    super(k)
    if (kchk !== ParamCheck.UNDEF) { // no second param in predicate and transform constructors (see ParamCheck)
      if (![EnumCheck, StrCheck, ValidId].some(x => kchk instanceof x)) throw this.buildError('param.constructor.key', kchk)
      this.kchk = kchk
      this.vchk = vchk
    }
  }

  static build (k, kchk, vchk) {
    return new DictCheck(k, kchk, vchk)
  }

  copy_instance (k) {
    return new this.constructor(k, this.kchk, this.vchk)
  }

  async _check (store, param, t) {
    const val = this.extractParam(param)
    if (typeof val === 'object' && !(val instanceof Array)) {
      try {
        await Promise.all(Object.keys(val).map(k => this.kchk._check(store, { [this.kchk.k]: k }, t)))
      } catch (e) {
        if (e instanceof InvalidRuleError) {
          throw this.buildError('param.invalid.dict.key', e.message)
        } else {
          throw e
        }
      }
      try {
        await Promise.all(Object.values(val).map(async v => this.vchk._check(store, { [this.vchk.k]: v }, t)))
      } catch (e) {
        if (e instanceof InvalidRuleError) {
          throw this.buildError('param.invalid.dict.val', e.message)
        } else {
          throw e
        }
      }
    } else {
      throw this.buildError('param.invalid.dict', JSON.stringify(val))
    }
  }

  toString_child () {
    return `{[${this.kchk.toFullString()}]: ${this.vchk.toFullString()}}`
  }
}
