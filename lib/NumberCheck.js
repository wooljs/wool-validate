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

class NumberCheck extends ParamCheck {
  static build(k) {
    return new NumberCheck(k)
  }
  async _check(store, param) {
    let val = this.extractParam(param)
    if (typeof val !== 'number') throw this.buildError('param.invalid.num', JSON.stringify(val))
  }
  transform(f) {
    let T = ParamCheck.TransformCheck(NumberCheck)
    return new T(this.k, this, f)
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
  asDate() {
    return new TimestampCheck(this.k, this.asInt())
  }
}

class PredicateNumberCheck extends ParamCheck.PredicateCheck(NumberCheck) {
  constructor(k, d, f) {
    super(k,d,f)
  }
}

class IntegerCheck extends PredicateNumberCheck {
  constructor(k, d) {
    super(k, d, Number.isInteger)
  }
  printPredicate() {
    return 'Number.isInteger()'
  }
}

class MinCheck extends PredicateNumberCheck {
  constructor(k, d, v) {
    super(k, d, x => x >= v)
    this.v = v
  }
  printPredicate() {
    return 'x >= '+this.v
  }
}

class MaxCheck extends PredicateNumberCheck {
  constructor(k, d, v) {
    super(k, d, x => x <= v)
    this.v = v
  }
  printPredicate() {
    return 'x <= '+this.v
  }
}

class TimestampCheck extends ParamCheck.TransformCheck(NumberCheck) {
  constructor(k, d) {
    super(k, d, x => new Date(x))
  }
}

NumberCheck.PredicateNumberCheck = PredicateNumberCheck
NumberCheck.IntegerCheck = IntegerCheck
NumberCheck.MinCheck = MinCheck
NumberCheck.MaxCheck = MaxCheck
NumberCheck.TimestampCheck = TimestampCheck

module.exports = NumberCheck