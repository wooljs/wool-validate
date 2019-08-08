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

'use strict'

const test = require('tape-async')
  , Checks = require(__dirname + '/../index.js')
  , { Store } = require('wool-store')
  , { testAsyncException } = require('./common.js')

test('Checks.Has', async function(t) {
  let check = Checks.Has('key')
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')
  await testAsyncException(t, check.validate(store, { foo: 42 }), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')
  await testAsyncException(t, check.validate(store, { bar: true, foo: 'bar'}), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')

  check.presence = 42
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.value.presence(ParamCheck[k:key], 42)')

  t.plan(12)
  t.end()
})

test('Checks.None', async function(t) {
  let check = Checks.None()
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { foo: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  t.plan(6)
  t.end()
})

test('Checks.Any', async function(t) {
  let check = Checks.Any()
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { foo: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  t.plan(6)
  t.end()
})

test('Checks.Enum', async function(t) {
  let check = Checks.Enum('key', [ 'foo', 'bar', 'another' ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'another' }))
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.enum(EnumCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(EnumCheck[k:key])')

  try{
    Checks.Enum('k', [])
    t.fail('should not be here')
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.invalid.enum.build.not.enough.alternatives(EnumCheck[k:k])')
  }

  try{
    Checks.Enum('k', [ 'alone' ])
    t.fail('should not be here')
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.invalid.enum.build.not.enough.alternatives(EnumCheck[k:k])')
  }

  t.plan(10)
  t.end()
})
