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
  async _check(store, param) {
    let str = this.extractParam(param)
    if (typeof str !== 'string') throw this.buildError('param.invalid.str', str)
  }
  asDate() {
    return new DateCheck(this.k, this)
  }
  regex(rx) {
    return new RegexCheck(this.k, this, rx)
  }
  predicate(f) {
    return new PredicateStrCheck(this.k, this, f)
  }
  parse(f) {
    return new ParseStrCheck(this.k, this, f)
  }
  crypto(algo) {
    if (typeof algo === 'function') return new CryptoCheck(this.k, this, algo, async(hash, value)=>(hash === await algo(value)))
    let { hash, match } = algo
    return new CryptoCheck(this.k, this, hash, match)
  }
}

class PredicateStrCheck extends StrCheck {
  constructor(k, d, f) {
    super(k)
    this.d = d
    this.f = f
  }
  async _check(store, param) {
    if('undefined' === typeof await this.d._check(store, param)) {
      let str = this.extractParam(param)
      if (! this.f(str)) throw this.buildError('param.invalid.str.predicate', JSON.stringify(str), this.printPredicate())
    }
  }
  printPredicate() {
    return String(this.f)
  }
}

class RegexCheck extends PredicateStrCheck {
  constructor(k, d, rx) {
    super(k, d, s => this.rx.test(s))
    this.rx = rx
  }
  printPredicate() {
    return String(this.rx)
  }
}

class ParseStrCheck extends StrCheck {
  constructor(k, d, f) {
    super(k)
    this.d = d
    this.f = f
  }
  async _check(store, param) {
    if('undefined' === typeof await super._check(store, param)) {
      this.saveToParam(param, this.f(this.extractParam(param)))
    }
  }
}

class DateCheck extends RegexCheck {
  constructor(k, d) {
    super(k, d, /^(?:\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}:(?:\d{2}(?:.\d{3}Z)?)?)?$/i)
  }
  async _check(store, param) {
    if('undefined' === typeof await super._check(store, param)) {
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
    }
  }
}

class CryptoCheck extends StrCheck {
  constructor(k, d, h, m) {
    super(k)
    this.d = d
    this.h = h // hash function
    this.m = m // match function
  }
  async _check(store, param) {
    if('undefined' === typeof await this.d._check(store, param)) {
      let str = this.extractParam(param)
      this.saveToParam(param, await this.h(str))
    }
  }
  async match(hash, value) {
    return await this.m(hash, value)
  }
  check(gethash) {
    return new CryptoHashCheck(this.k, this, gethash)
  }
}

class CryptoHashCheck extends StrCheck {
  constructor(k, d, gh) {
    super(k)
    this.d = d
    this.gh = gh // gethash function
  }
  async _check(store, param) {
    if('undefined' === typeof await this.d.d._check(store, param)) {
      let hash = await this.gh(store, param)
        , value = this.extractParam(param)
      if (! await this.d.match(hash, value)) {
        throw this.buildError('param.invalid.str.crypto.hash')
      }
    }
  }
}

StrCheck.PredicateStrCheck = PredicateStrCheck
StrCheck.RegexCheck = RegexCheck
StrCheck.ParseStrCheck = ParseStrCheck
StrCheck.DateCheck = DateCheck
StrCheck.CryptoCheck = CryptoCheck
StrCheck.CryptoHashCheck = CryptoHashCheck

module.exports = StrCheck
