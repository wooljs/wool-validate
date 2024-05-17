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

test('Checks.Bool', async function(t) {
  const store = new Store()
    , check = Checks.Bool('key')
    , optionalCheck = check.optional()
    , absentCheck = check.absent()
    , defaultCheck = check.default(true)

  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))

  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: true }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: false }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { }))

  t.ok('undefined' === typeof await absentCheck.validate(store, { }))

  t.ok('undefined' === typeof await defaultCheck.validate(store, { key: true }))
  t.ok('undefined' === typeof await defaultCheck.validate(store, { key: false }))

  let o = { }
  t.ok('undefined' === typeof await defaultCheck.validate(store, o))
  t.deepEqual(o, { key: true })

  await testAsyncException(t, absentCheck.validate(store, { key: true }), 'InvalidRuleError: param.should.be.absent(BoolCheck[k:key])')

  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.bool(BoolCheck[k:key], foo)')
  await testAsyncException(t, optionalCheck.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.bool(BoolCheck[k:key], foo)')
  await testAsyncException(t, defaultCheck.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.bool(BoolCheck[k:key], foo)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(BoolCheck[k:key])')

  t.plan(20)
  t.end()
})

test('Checks.Bool.predicate', async function(t) {
  let check = Checks.Bool('key').predicate(async(x, store) => x && await store.has('key'))
    , store = new Store()

  await store.set('key', 'plop')

  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  await testAsyncException(t, check.validate(store, { key: false }), 'InvalidRuleError: param.invalid.predicate(BoolCheck[k:key], false, async(x, store) => x && await store.has(\'key\'))')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.bool(BoolCheck[k:key], foo)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(BoolCheck[k:key])')

  t.plan(7)
  t.end()
})
