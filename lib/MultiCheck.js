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
// import InvalidRuleError from './InvalidRuleError.js'

export default class MultiCheck extends ParamCheck {
  constructor (p) {
    super()
    p.forEach(e => { if (!(e instanceof ParamCheck)) throw this.buildError('param.multi.not.instanceof.ParamCheck', '[' + p.map(x => String(x)).join(',') + ']') })
    this.p = p
  }

  clone (f = x => x) {
    return new this.constructor(this.p.map(f))
  }

  absent () {
    throw this.buildError('param.multi.cannot.be.absent(MultiCheck[])')
  }

  present () {
    throw this.buildError('param.multi.already.present(MultiCheck[])')
  }

  optional () {
    throw this.buildError('param.multi.cannot.be.optional(MultiCheck[])')
  }

  default () {
    throw this.buildError('param.multi.cannot.have.default(MultiCheck[])')
  }

  static build (p = []) {
    return new MultiCheck(p)
  }

  keptParam () {
    return this.p.filter(v => v.keep)
  }

  createdParam () {
    return this.p.filter(x => x.presence !== ParamCheck.Presence.present) // we keep the absent and optional (they did not existed in original command)
  }

  extractCreatedParam (param) {
    return this.createdParam().reduce((p, c) => {
      p[c.k] = c.extractParam(param)
      return p
    }, {})
  }

  async validate (store, param, t) {
    // try {
    await Promise.all(this.p.map(p => p.validate(store, param, t)))
    /* } catch(e) {
      if (e instanceof InvalidRuleError) {
        throw this.buildError('param.invalid.multi.item', e.message)
      } else {
        throw e
      }
    } */
  }

  toDTO () {
    return this.p.map(p => p.toDTO()).reduce((p, c) => {
      const k = c.k
      p[k] = c.p
      return p
    }, {})
  }
}
