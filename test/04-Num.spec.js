/*
 * Copyright 2019 Nicolas Lochet Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

'use strict'

const test = require('tape')
  , Checks = require(__dirname + '/../index.js')
  , { Store } = require('wool-store')
  , { testAsyncException } = require('./common.js')

test('Checks.Num', async function(t) {
  const store = new Store()
    , check = Checks.Num('key')

  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 3.14159 }))
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(6)
  t.end()
})

test('Checks.Num.predicate', async function(t) {
  const store = new Store()
    , check = Checks.Num('key').predicate(x => Number.isInteger(Math.sqrt(x)))
    , optionalCheck = check.optional()
    , absentCheck = check.absent()
    , defaultCheck = check.default(64)
    , defaultCheckFail = check.default(42)

  t.deepEqual(check.toFullString(), 'PredicateNumberCheck[k:key](?:x => Number.isInteger(Math.sqrt(x)))')
  t.deepEqual(absentCheck.toFullString(), 'PredicateNumberCheck[k:key(!)](?:x => Number.isInteger(Math.sqrt(x)))')
  t.deepEqual(optionalCheck.toFullString(), 'PredicateNumberCheck[k:key(*)](?:x => Number.isInteger(Math.sqrt(x)))')
  t.deepEqual(defaultCheck.toFullString(), 'PredicateNumberCheck[k:key(=64)](?:x => Number.isInteger(Math.sqrt(x)))')

  t.ok('undefined' === typeof await check.validate(store, { key: 1 }))

  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: 16 }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { }))
  t.ok('undefined' === typeof await absentCheck.validate(store, { }))
  t.ok('undefined' === typeof await defaultCheck.validate(store, { key: 256 }))
  t.ok('undefined' === typeof await defaultCheckFail.validate(store, { key: 1024 }))

  let p = {}
  t.ok('undefined' === typeof await defaultCheck.validate(store, p))
  t.deepEqual(p.key, 64)

  t.ok('undefined' === typeof await check.validate(store, { key: 4 }))

  t.ok('undefined' === typeof await check.validate(store, { key: 9 }))

  await testAsyncException(t, check.validate(store, { key: 7 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 7, x => Number.isInteger(Math.sqrt(x)))')

  await testAsyncException(t, optionalCheck.validate(store, { key: 47 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 47, x => Number.isInteger(Math.sqrt(x)))')

  await testAsyncException(t, absentCheck.validate(store, { key: 31 }), 'InvalidRuleError: param.should.be.absent(NumberCheck[k:key])')

  await testAsyncException(t, defaultCheck.validate(store, { key: 77 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 77, x => Number.isInteger(Math.sqrt(x)))')
  await testAsyncException(t, defaultCheckFail.validate(store, { key: 12 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 12, x => Number.isInteger(Math.sqrt(x)))')
  await testAsyncException(t, defaultCheckFail.validate(store, { }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 42, x => Number.isInteger(Math.sqrt(x)))')

  await testAsyncException(t, check.validate(store, { key: [] }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], [])')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(34)
  t.end()
})

test('Checks.Num.asInt', async function(t) {
  const store = new Store()
    , check = Checks.Num('key').asInt()

  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  await testAsyncException(t, check.validate(store, { key: 3.14159 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 3.14159, Number.isInteger())')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(7)
  t.end()
})

test('Checks.Num.asDate', async function(t) {
  const store = new Store()
    , check = Checks.Num('key').asDate()

    , optionalCheck = check.optional()
    , absentCheck = check.absent()

    , now = Date.now()
    , defaultCheck = check.default(now)

    , defaultCheckFail = check.default(421.567)

  let p

  t.ok('undefined' === typeof await check.validate(store, p = { key: 42 }))
  t.deepEqual(p.key.toISOString(), '1970-01-01T00:00:00.042Z')

  t.ok('undefined' === typeof await optionalCheck.validate(store, p = { key: 65536 }))
  t.deepEqual(p.key.toISOString(), '1970-01-01T00:01:05.536Z')

  t.ok('undefined' === typeof await optionalCheck.validate(store, { }))

  t.ok('undefined' === typeof await absentCheck.validate(store, { }))

  t.ok('undefined' === typeof await defaultCheck.validate(store, p = { key: 16777216 }))
  t.deepEqual(p.key.toISOString(), '1970-01-01T04:39:37.216Z')

  t.ok('undefined' === typeof await defaultCheckFail.validate(store, p = { key: 4294967296 }))
  t.deepEqual(p.key.toISOString(), '1970-02-19T17:02:47.296Z')

  t.ok('undefined' === typeof await defaultCheck.validate(store, p = { }))
  t.deepEqual(p.key, new Date(now))


  t.ok('undefined' === typeof await check.validate(store, p = { key: 1565192858493 }))
  t.deepEqual(p.key.toISOString(), '2019-08-07T15:47:38.493Z')

  await testAsyncException(t, check.validate(store, { key: 3.14159 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 3.14159, Number.isInteger())')
  await testAsyncException(t, optionalCheck.validate(store, { key: .3423532637 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 0.3423532637, Number.isInteger())')
  await testAsyncException(t, defaultCheck.validate(store, { key: 9321765.5 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 9321765.5, Number.isInteger())')
  await testAsyncException(t, defaultCheckFail.validate(store, { }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 421.567, Number.isInteger())')

  await testAsyncException(t, absentCheck.validate(store, { key: 314159 }), 'InvalidRuleError: param.should.be.absent(TimestampCheck[k:key])')

  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(TimestampCheck[k:key])')

  t.plan(28)
  t.end()
})

test('Checks.Num.min', async function(t) {
  const store = new Store()
    , check = Checks.Num('key').min(-1.5)

    , optionalCheck = check.optional()
    , absentCheck = check.absent()

  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: 42 }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { }))
  t.ok('undefined' === typeof await absentCheck.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: 0 }))
  t.ok('undefined' === typeof await check.validate(store, { key: -1 }))
  t.ok('undefined' === typeof await check.validate(store, { key: -1.5 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 3.14159 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 142e12 }))
  await testAsyncException(t, check.validate(store, { key: -1.6 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], -1.6, x >= -1.5)')
  await testAsyncException(t, optionalCheck.validate(store, { key: -1.6 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], -1.6, x >= -1.5)')
  await testAsyncException(t, check.validate(store, { key: -666 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], -666, x >= -1.5)')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(19)
  t.end()
})

test('Checks.Num.max', async function(t) {
  let check = Checks.Num('key').max(42)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 17 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 0 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 3.14159 }))
  t.ok('undefined' === typeof await check.validate(store, { key: -66 }))
  await testAsyncException(t, check.validate(store, { key: 42.1 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 42.1, x <= 42)')
  await testAsyncException(t, check.validate(store, { key: 142 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 142, x <= 42)')
  await testAsyncException(t, check.validate(store, { key: 142e12 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 142000000000000, x <= 42)')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(15)
  t.end()
})

test('Checks.Num.asInt.min.max', async function(t) {
  let check = Checks.Num('key').asInt().min(0).max(4.5)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 4 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 3 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 2 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 1 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 0 }))
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 42, x <= 4.5)')
  await testAsyncException(t, check.validate(store, { key: 3.14159 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 3.14159, Number.isInteger())')
  await testAsyncException(t, check.validate(store, { key: 4.00001 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 4.00001, Number.isInteger())')
  await testAsyncException(t, check.validate(store, { key: 4+1e-15 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 4.000000000000001, Number.isInteger())')
  await testAsyncException(t, check.validate(store, { key: 4.5 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 4.5, Number.isInteger())')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(19)
  t.end()
})
