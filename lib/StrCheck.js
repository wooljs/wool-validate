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

class StrCheck extends ParamCheck {
  static build(k) {
    return new StrCheck(k)
  }
  async validate(store, param) {
    let str = this.extractParam(param)
    return typeof str === 'string'
  }
  asDate() {
    return new DateDecorator(this.k, this)
  }
  regex(rx) {
    return new RegexDecorator(this.k, this, rx)
  }
  crypto(algo) {
    if (typeof algo === 'function') return new CryptoDecorator(this.k, this, algo, async(hash, value)=>(hash === await algo(value)))
    let { hash, match } = algo
    return new CryptoDecorator(this.k, this, hash, match)
  }
}

class RegexDecorator extends StrCheck {
  constructor(k, d, rx) {
    super(k)
    this.d = d
    this.rx = rx
  }
  async validate(store, param) {
    if(await this.d.validate(store, param)) {
      let str = this.extractParam(param)
      return this.rx.test(str)
    }
  }
}

class DateDecorator extends RegexDecorator {
  constructor(k, d) {
    super(k, d, /^(?:\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:(?:\d{2}(?:.\d{3}Z)?)?)?$/i)
  }
  async validate(store, param) {
    if(await super.validate(store, param)) {
      let str = this.extractParam(param)
      switch(str.length) {
      case 10: // YYYY-MM-DD
        str += 'T00:00:00.000Z'
        break
      case 16: // YYYY-MM-DDThh:mm
        str += ':00.000Z'
        break
      case 19: // YYYY-MM-DDThh:mm:ss
        str += '.000Z'
        break
      }
      let d = new Date(str)
      this.saveToParam(param, d)
      return true
    }
  }
}

class CryptoDecorator extends StrCheck {
  constructor(k, d, h, m) {
    super(k)
    this.d = d
    this.h = h // hash function
    this.m = m // match function
  }
  async validate(store, param) {
    if(await this.d.validate(store, param)) {
      let str = this.extractParam(param)
      this.saveToParam(param, await this.h(str))
      return true
    }
  }
  async match(hash, value) {
    return await this.m(hash, value)
  }
  check(gethash) {
    return new CheckHashDecorator(this.k, this, gethash)
  }
}

class CheckHashDecorator extends StrCheck {
  constructor(k, d, gh) {
    super(k)
    this.d = d
    this.gh = gh // gethash function
  }
  async validate(store, param) {
    if(await this.d.d.validate(store, param)) {
      let hash = await this.gh(store, param)
        , value = this.extractParam(param)
      return await this.d.match(hash, value)
    }
  }
}

module.exports = StrCheck
