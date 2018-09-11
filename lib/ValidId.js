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
  , newId = () => (Date.now().toString(16))

class ValidId extends ParamCheck {
  constructor(k, opt) {
    super(k)
    opt = opt || {}
    this.prefix = 'prefix' in opt ? opt.prefix : ''
    this.prefixMatch = this.prefix.length === 0 ? (()=>true) : RegExp.prototype.test.bind(new RegExp('^'+this.prefix))
    this.algo = 'algo' in opt ? opt.algo : newId
  }
  static build(k, opt) {
    return new ValidId(k, opt)
  }
  async validate(store, param) {
    let id = this.extractParam(param)
    if (! (await store.has(this.as(id)))) throw new InvalidRuleError('invalid ID '+this.k+' '+id)
    return true
  }
  asNew() {
    return new NotExistsId(this.k, this)
  }
  as(id) {
    return this.prefix + id
  }
  isOne(id) {
    return this.prefixMatch(id)
  }
}

class NotExistsId extends ValidId {
  async validate(store, param) {
    if (this.containParam(param)) throw new InvalidRuleError('invalid param '+this.k)
    let id = await this.algo()
    this.saveToParam(param, id)
    if (await store.has(this.as(id))) {
      throw new InvalidRuleError('should not be in store '+this.k+' '+id)
    }
    return true
  }
  isMandatory() {
    return false
  }
}

module.exports = ValidId
