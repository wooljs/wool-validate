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

class NumberCheck extends ParamCheck {
  static build(k) {
    return new NumberCheck(k)
  }
  async _check(store, param) {
    let val = this.extractParam(param)
    if (typeof val !== 'number') throw new InvalidRuleError('param.check.num.invalid', val)
  }
  predicate(f) {
    return new PredicateNumberCheck(this.k, this, f)
  }
  asInt() {
    return new IntegerCheck(this.k, this)
  }
  min(v) {
    return new MinCheck(this.k, this, v)
  }
  max(v) {
    return new MaxCheck(this.k, this, v)
  }
}

class PredicateNumberCheck extends NumberCheck {
  constructor(k, d, f) {
    super(k)
    this.d = d
    this.f = f
  }
  async _check(store, param) {
    if('undefined' === typeof await this.d.validate(store, param)) {
      let v = this.extractParam(param)
      if (! this.f(v)) throw new InvalidRuleError('param.check.num.invalid.predicate', v, this.f)
    }
  }
}

class IntegerCheck extends PredicateNumberCheck {
  constructor(k, d) {
    super(k, d, Number.isInteger)
  }
}

class MinCheck extends PredicateNumberCheck {
  constructor(k, d, v) {
    super(k, d, x => x >= v)
  }
}

class MaxCheck extends PredicateNumberCheck {
  constructor(k, d, v) {
    super(k, d, x => x <= v)
  }
}

NumberCheck.PredicateNumberCheck = PredicateNumberCheck
NumberCheck.IntegerCheck = IntegerCheck
NumberCheck.MinCheck = MinCheck
NumberCheck.MaxCheck = MaxCheck

module.exports = NumberCheck