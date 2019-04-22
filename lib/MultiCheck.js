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

module.exports = class MultiCheck extends ParamCheck {
  constructor(p) {
    super()
    p.forEach(e => { if (!(e instanceof ParamCheck)) throw this.buildError('param.multi.not.instanceof.ParamCheck' ,'['+ p.map(x => String(x)).join(',')+']' ) })
    this.p = p
  }
  static build(p = []) {
    return new MultiCheck(p)
  }
  keptParam() {
    return this.p.filter(v => v.keep)
  }
  async validate(store, param, t) {
    await Promise.all(this.p.map(p => p.validate(store, param, t)))
  }
  toDTO() {
    return this.p.map(p => p.toDTO()).reduce((p, c) => {
      let k = c.k
      p[k] = c.p
      return p
    },{})
  }
}