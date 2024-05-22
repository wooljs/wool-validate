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

class IdAlgo {
  constructor() {
    this.l = 0
    this.c = 0
  }
  static build() {
    const ia = new IdAlgo()
    return (t) => ia.newId(t)
  }
  newId(t) {
    t = t instanceof Date ? t.getTime() : Date.now()
    // machinery to avoid conflict because of same ms for given t/Date.now(), at least up 4 hex digit
    if (this.l !== t) {
      this.l = t
      this.c = 0
    } else {
      this.c += 1
    }
    return (t.toString(16).padStart(12, '0') + this.c.toString(16).padStart(4, '0'))
  }
}

class ValidId extends ParamCheck {
  constructor(k, opt) {
    super(k)
    opt = opt || {}
    if ('keep' in opt) this.keep = opt.keep
    this.prefix = 'prefix' in opt ? opt.prefix : ''
    this.prefixMatch = this.prefix.length === 0 ? (() => true) : RegExp.prototype.test.bind(new RegExp('^' + this.prefix))
    this.algo = 'algo' in opt ? opt.algo : IdAlgo.build()
  }
  static build(k, opt) {
    return new ValidId(k, opt)
  }
  async _check(store, param) {
    let id = this.extractParam(param)
    if (!(await store.has(this.as(id)))) throw this.buildError('param.should.exists.in.store', id)
  }
  absent(force_check = false) {
    if (force_check) throw this.buildError('param.cannot.be.absent.and.in.store')
    return super.absent(false)
  }
  default() {
    throw this.buildError('param.cannot.have.default')
  }
  asNew() {
    return new NotExistsId(this.k, this)
  }
  notInStore() {
    return new NotInStoreId(this.k, this)
  }
  noCheck() {
    return new NoCheckId(this.k, this)
  }
  as(id) {
    return this.prefix + id
  }
  isOne(id) {
    if (typeof id === 'undefined') return (x => this.prefixMatch(x))
    return this.prefixMatch(id)
  }
}
class NotExistsId extends ValidId {
  constructor(k, opt) {
    super(k, opt)
    this.setAbsent(true)
  }
  absent() {
    throw this.buildError('param.is.already.absent')
  }
  present() {
    throw this.buildError('param.cannot.be.present')
  }
  optional() {
    throw this.buildError('param.cannot.be.optional')
  }
  async _check(store, param, t) {
    let id = await this.algo(t)
    if (await store.has(this.as(id))) throw this.buildError('param.should.not.be.in.store', id)
    this.saveToParam(param, id)
  }
  toString_presence() {
    return ''
  }
}
class NotInStoreId extends ValidId {
  constructor(k, opt) {
    super(k, opt)
  }
  absent(force_check = false) {
    if (force_check) throw this.buildError('param.cannot.be.absent.and.not.in.store')
    return super.absent(false)
  }
  async _check(store, param) {
    let id = this.extractParam(param)
    if (await store.has(this.as(id))) throw this.buildError('param.should.not.be.in.store', id)
  }
}
class NoCheckId extends ValidId {
  constructor(k, opt) {
    super(k, opt)
  }
  absent(force_check = false) {
    return ParamCheck.prototype.absent.call(this, force_check)
  }
  async _check(/*store, param*/) { /* Do nothing on purpose */ }
}

ValidId.newId = IdAlgo.build

module.exports = ValidId
