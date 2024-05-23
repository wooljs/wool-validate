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

module.exports = class EitherCheck extends ParamCheck {
  constructor(k, alt) {
    if (k instanceof Array) {
      alt = k
      k = undefined
    }
    super(k)
    if (alt !== ParamCheck.UNDEF) { // no second param in predicate and transform constructors (see ParamCheck)
      this.alt = alt
      if (!this.k) this.setAbsent(true)
      if (this.alt.length < 2) throw this.buildError('param.invalid.alt.build.not.enough.alternatives')
    }
  }
  static build(k, alt) {
    return new EitherCheck(k, alt)
  }
  copy_instance(k) {
    return new this.constructor(k, this.alt)
  }
  async _check(store, param, t) {
    let count = this.alt.length
      , f = p => {
        if (this.k) p = p.alias(this.k)
        return p._check(store, param, t).catch((/*/e/**/) => { /*/console.log(p.toFullString(),param,e);/**/ count-=1 })
      }
    await Promise.all(this.alt.map(f))
    if (count > 1) {
      throw this.buildError('param.invalid.either.too.many.candidates')
    }
    else if (count === 0) {
      if (this.k) throw this.buildError('param.invalid.either.item.no.candidate', JSON.stringify(this.extractParam(param)))
      else throw this.buildError('param.invalid.either.item.no.candidate')
    }
  }
}
