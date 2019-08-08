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

const test = require('tape-async')
  , Checks = require(__dirname + '/../index.js')
  , { Store } = require('wool-store')
  , { testAsyncException } = require('./common.js')

test('Checks.Dict Str Num', async function(t) {
  let check = Checks.Dict('key', Checks.Str().regex(/^[a-z]+$/), Checks.Num().asInt())
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: { } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 12 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { bar: 1654123 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 42, bar: 666, plop: 1e10, another: 0, last: -12 } }))
  await testAsyncException(t, check.validate(store, { key: { A1: 42 } }), 'InvalidRuleError: param.invalid.dict.key(DictCheck[k:key], param.invalid.predicate(StrCheck[], "A1", /^[a-z]+$/))')
  await testAsyncException(t, check.validate(store, { key: { foo: 42, bar: 666, plop: 1e10, another: 0, '$bad': -12 } }), 'InvalidRuleError: param.invalid.dict.key(DictCheck[k:key], param.invalid.predicate(StrCheck[], "$bad", /^[a-z]+$/))')
  await testAsyncException(t, check.validate(store, { key: { foo: 42, bar: 3.14159 } }), 'InvalidRuleError: param.invalid.dict.val(DictCheck[k:key], param.invalid.predicate(NumberCheck[], 3.14159, function isInteger() { [native code] }))')
  await testAsyncException(t, check.validate(store, { key: { foo: 'plop', bar: 3 } }), 'InvalidRuleError: param.invalid.dict.val(DictCheck[k:key], param.invalid.num("plop"))')
  await testAsyncException(t, check.validate(store, { key: [ ] }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], [])')
  await testAsyncException(t, check.validate(store, { key: [ 'plop' ] }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], ["plop"])')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], true)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(DictCheck[k:key])')
  t.plan(22)
  t.end()
})

test('Checks.Dict Enum Num', async function(t) {
  let check = Checks.Dict('key',
      Checks.Enum(['foo', 'bar'])
      .transform(async (x, store) => { if (await store.get(x) === 666) { throw new Error('! 666 !') } return x } ),
      Checks.Num()
      .transform(x => { let r = Math.sqrt(x); if (isNaN(r)) { throw new Error('NaN') } else return r })
      .min(1)
    )
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: { } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 12 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { bar: 1.654123 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 42, bar: 3.14159 } }))

  await store.set('foo', 666)
  await testAsyncException(t, check.validate(store, { key: { foo: 666 } }), 'Error: ! 666 !', false)
  await store.del('foo')

  await testAsyncException(t, check.validate(store, { key: { foo: 42, bar: -1 } }), 'Error: NaN', false)

  await testAsyncException(t, check.validate(store, { key: { foo: 42, bar: 0 } }), 'InvalidRuleError: param.invalid.dict.val(DictCheck[k:key], param.invalid.predicate(NumberCheck[], 0, x >= 1))')
  await testAsyncException(t, check.validate(store, { key: { foobar: 'plop', bar: 3.14159 } }), 'InvalidRuleError: param.invalid.dict.key(DictCheck[k:key], param.invalid.enum("foobar"))')
  await testAsyncException(t, check.validate(store, { key: { foo: 'plop', bar: -1 } }), 'InvalidRuleError: param.invalid.dict.val(DictCheck[k:key], param.invalid.num("plop"))')
  await testAsyncException(t, check.validate(store, { key: [ ] }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], [])')
  await testAsyncException(t, check.validate(store, { key: [ 'plop' ] }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], ["plop"])')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], true)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(DictCheck[k:key])')
  t.plan(22)
  t.end()
})
