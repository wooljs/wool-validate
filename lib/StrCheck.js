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

class StrCheck extends ParamCheck {
  static build (k) {
    return new StrCheck(k)
  }

  async _check (store, param) {
    const str = this.extractParam(param)
    if (typeof str !== 'string') throw this.buildError('param.invalid.str', str)
  }

  asDate () {
    return new DateCheck(this.k, this)
  }

  asNum () {
    return new NumberStrCheck(this.k, this)
  }

  regex (rx) {
    return new RegexCheck(this.k, this, rx)
  }

  predicate (f) {
    return new PredicateStrCheck(this.k, this, f)
  }

  crypto (algo) {
    if (typeof algo === 'function') return new CryptoCheck(this.k, this, algo, async (hash, value) => (hash === await algo(value)))
    const { hash, match } = algo
    return new CryptoCheck(this.k, this, hash, match)
  }
}

class PredicateStrCheck extends ParamCheck.PredicateCheck(StrCheck) {}

class NumberStrCheck extends PredicateStrCheck {
  constructor (k, d) {
    super(k, d, x => NumberStrCheck.isNumber(x))
  }

  static isNumber (x) {
    return !isNaN(x) && !isNaN(parseFloat(x)) && isFinite(x)
  }

  asInt () {
    return new IntegerStrCheck(this.k, this)
  }

  min (v) {
    return new MinStrCheck(this.k, this, v)
  }

  max (v) {
    return new MaxStrCheck(this.k, this, v)
  }

  printPredicate () {
    return 'NumberStrCheck.isNumber()'
  }
}

class IntegerStrCheck extends NumberStrCheck {
  constructor (k, d) {
    super(k, d)
    this.f = x => Number.isInteger(parseFloat(x))
  }

  printPredicate () {
    return 'Number.isInteger()'
  }
}

class MinStrCheck extends NumberStrCheck {
  constructor (k, d, v) {
    super(k, d)
    this.f = x => parseFloat(x) >= v
    this.v = v
  }

  printPredicate () {
    return 'parseFloat(x) >= ' + this.v
  }
}

class MaxStrCheck extends NumberStrCheck {
  constructor (k, d, v) {
    super(k, d)
    this.f = x => parseFloat(x) <= v
    this.v = v
  }

  printPredicate () {
    return 'parseFloat(x) <= ' + this.v
  }
}

class RegexCheck extends PredicateStrCheck {
  constructor (k, d, rx) {
    super(k, d, s => this.rx.test(s))
    this.rx = rx
  }

  printPredicate () {
    return String(this.rx)
  }
}

class DateCheck extends RegexCheck {
  constructor (k, d) {
    super(k, d, /^(?:\d{4}-\d{2}-\d{2})(?:T\d{2}(?::\d{2}(?::\d{2}(?:.\d{3}Z)?)?)?)?$/i)
  }

  async _check (store, param) {
    // will throw is check fail
    await super._check(store, param)

    let str = this.extractParam(param)
    switch (str.length) {
      case 10: // YYYY-MM-DD
        str += 'T00:00:00.000Z'
        break
      case 13: // YYYY-MM-DDThh
        str += ':00:00.000Z'
        break
      case 16: // YYYY-MM-DDThh:mm
        str += ':00.000Z'
        break
      case 19: // YYYY-MM-DDThh:mm:ss
        str += '.000Z'
        break
    }
    const d = new Date(str)
    this.saveToParam(param, d)
  }

  printPredicate () {
    return 'isISODate()'
  }
}

/**
 * Encrypt a value and store as Hash
 */
class CryptoCheck extends StrCheck {
  constructor (k, d, h, m) {
    super(k)
    this.keep = d.keep
    this.d = d
    this.h = h // hash function
    this.m = m // match function
  }

  copy_instance (k) {
    return new this.constructor(k, this.d.alias(k), this.h, this.m)
  }

  async _check (store, param) {
    // will throw is check fail
    await this.d._check(store, param)

    const str = this.extractParam(param)
    this.saveToParam(param, await this.h(str))
  }

  async match (hash, value) {
    return await this.m(hash, value)
  }

  getHashFromStore (gh) {
    return new CryptoHashCheck(this.k, this, gh)
  }
}

/**
 * Compare a Hashed a value from param to Stored Hash in DB
 */
class CryptoHashCheck extends StrCheck {
  constructor (k, d, gh) {
    super(k)
    this.keep = d.keep
    this.d = d
    this.gh = gh // function to retrieve Hash in DB for match
  }

  copy_instance (k) {
    return new this.constructor(k, this.d.alias(k), this.gh)
  }

  async _check (store, param) {
    // will throw is check fail
    await this.d.d._check(store, param)

    const hash = await this.gh(store, param)
    const value = this.extractParam(param)
    if (!await this.d.match(hash, value)) {
      throw this.buildError('param.invalid.str.crypto.hash')
    }
  }
}

StrCheck.PredicateStrCheck = PredicateStrCheck
StrCheck.RegexCheck = RegexCheck

StrCheck.NumberStrCheck = NumberStrCheck
StrCheck.IntegerStrCheck = IntegerStrCheck
StrCheck.MinStrCheck = MinStrCheck
StrCheck.MaxStrCheck = MaxStrCheck

StrCheck.DateCheck = DateCheck
StrCheck.CryptoCheck = CryptoCheck
StrCheck.CryptoHashCheck = CryptoHashCheck

export default StrCheck
