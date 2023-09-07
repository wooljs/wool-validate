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

const InvalidRuleError = require('../lib/InvalidRuleError.js')

const test = require('tape')
  , Checks = require(__dirname + '/../index.js')
  , { Store } = require('wool-store')
  , { testAsyncException } = require('./common.js')

test('Checks.Str', async function (t) {
  const store = new Store()
    , check = Checks.Str('key')

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StrCheck[k:key])')

  t.plan(5)
  t.end()
})

test('Checks.Str.asDate', async function (t) {
  const store = new Store()
    , check = Checks.Str('key').asDate()
  let p

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19' }))
  t.deepEqual(p, { key: new Date(1526688000000) })

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19T06' }))
  t.deepEqual(p, { key: new Date(1526709600000) })

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19T06:04' }))
  t.deepEqual(p, { key: new Date(1526709840000) })

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19T06:04:29' }))
  t.deepEqual(p, { key: new Date(1526709869000) })

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19T06:04:29.945Z' }))
  t.deepEqual(p, { key: new Date(1526709869945) })

  await testAsyncException(t, check.validate(store, { key: 1526688000000 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 1526688000000)') // we check it is a string so this is invalid
  await testAsyncException(t, check.validate(store, { key: '1526709869945' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "1526709869945", isISODate())')
  await testAsyncException(t, check.validate(store, { key: 'plop' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "plop", isISODate())')

  t.plan(16)
  t.end()
})

test('Checks.Str.predicate', async function (t) {
  const store = new Store()
    , check = Checks.Str('key').predicate(s => s.indexOf('f') === 0)

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  await testAsyncException(t, check.validate(store, { key: 'bar' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "bar", s => s.indexOf(\'f\') === 0)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", s => s.indexOf(\'f\') === 0)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StrCheck[k:key])')

  t.plan(9)
  t.end()
})

test('Checks.Str.transform', async function (t) {
  const store = new Store()
    , check = Checks.Str('key').transform(s => s.trim()).transform(s => s.toUpperCase()).regex(/^[A-Z]+$/)
  let p

  t.ok('undefined' === typeof await check.validate(store, p = { key: 'foo' }))
  t.deepEqual(p, { key: 'FOO' })

  t.ok('undefined' === typeof await check.validate(store, p = { key: 'bar' }))
  t.deepEqual(p, { key: 'BAR' })

  t.ok('undefined' === typeof await check.validate(store, p = { key: 'bar  ' }))
  t.deepEqual(p, { key: 'BAR' })

  t.ok('undefined' === typeof await check.validate(store, p = { key: '   bar' }))
  t.deepEqual(p, { key: 'BAR' })

  t.ok('undefined' === typeof await check.validate(store, p = { key: ' bar  ' }))
  t.deepEqual(p, { key: 'BAR' })

  await testAsyncException(t, check.validate(store, { key: 'foo1' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "FOO1", /^[A-Z]+$/)')

  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StrCheck[k:key])')

  t.plan(16)
  t.end()
})

test('Checks.Str.regex', async function (t) {
  const store = new Store()
    , check = Checks.Str('key').regex(/^f/)

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  await testAsyncException(t, check.validate(store, { key: 'bar' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "bar", /^f/)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^f/)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StrCheck[k:key])')
  t.plan(9)
  t.end()
})

test('Checks.Str.regex.crypto', async function (t) {
  const store = new Store()
    , check = Checks.Str('key')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,}$/)
      .crypto(x => x.split('').reverse().join(''))

  let checked = { key: 'FooBar42' }
  t.ok('undefined' === typeof await check.validate(store, checked))
  t.deepEqual(checked, { key: '24raBooF' })

  checked = { key: 'xD5Ae8f4ysFG9luB' }
  t.ok('undefined' === typeof await check.validate(store, checked))
  t.deepEqual(checked, { key: 'Bul9GFsy4f8eA5Dx' })

  await testAsyncException(t, check.validate(store, { key: 'bar' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "bar", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(CryptoCheck[k:key])')

  t.plan(12)
  t.end()
})

test('Checks.Str.regex.crypto(hash,match)', async function (t) {
  const store = new Store()
    , check = Checks.Str('key')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,}$/)
      .crypto({ hash: (x => x.split('').reverse().join('')), match: (x => x) })

  const pl1 = { key: 'FooBar42' }
  t.ok('undefined' === typeof await check.validate(store, pl1))
  t.deepEquals(pl1.key, '24raBooF')

  const pl2 = { key: 'xD5Ae8f4ysFG9luB' }
  t.ok('undefined' === typeof await check.validate(store, pl2))
  t.deepEquals(pl2.key, 'Bul9GFsy4f8eA5Dx')

  await testAsyncException(t, check.validate(store, { key: 'bar' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "bar", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(CryptoCheck[k:key])')

  t.plan(12)
  t.end()
})

test('Checks.Str.regex.crypto.check', async function (t) {
  const store = new Store()
    , check = Checks.Str('key')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,}$/)
      .crypto(x => x)
      .getHashFromStore(async (store, param) => {
        let { userId } = param
          , user = await store.get(userId)
        if (!user) throw new InvalidRuleError('user.does.not.exist')
        return user.password
      })

  store.set('foo', { password: 'FooBar42' })
  store.set('bar', { password: 'xD5Ae8f4ysFG9luB' })

  t.ok('undefined' === typeof await check.validate(store, { userId: 'foo', key: 'FooBar42' }))
  t.ok('undefined' === typeof await check.validate(store, { userId: 'bar', key: 'xD5Ae8f4ysFG9luB' }))

  await testAsyncException(t, check.validate(store, { userId: 'foo' }), 'InvalidRuleError: param.should.be.present(CryptoHashCheck[k:key])')
  await testAsyncException(t, check.validate(store, { userId: 'bar' }), 'InvalidRuleError: param.should.be.present(CryptoHashCheck[k:key])')

  await testAsyncException(t, check.validate(store, { userId: 'bar', key: 'Another666' }), 'InvalidRuleError: param.invalid.str.crypto.hash(CryptoHashCheck[k:key])')
  await testAsyncException(t, check.validate(store, { userId: 'foo', key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { userId: 'bar', key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(CryptoHashCheck[k:key])')

  t.plan(18)
  t.end()
})
