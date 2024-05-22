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

const InvalidRuleError = require('../lib/InvalidRuleError.js')

const test = require('tape')
  , Checks = require(__dirname + '/../index.js')
  , { Store } = require('wool-store')
  , { testAsyncException } = require('./common.js')

test('Checks.Has', async function(t) {
  const check = Checks.Has('key')
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

test('Checks.Has, present, optional, absent', async function(t) {
  const check = Checks.Has('key')
    , presentCheck = check.present()
    , optionalCheck = check.optional()
    , absentNoCheck = check.absent()
    , absentWithCheck = check.absent(true)
    , defaultCheck = check.default(42)
    , aliasCheck = check.alias('plop')
    , aliasOptionalCheck = check.alias('plep').optional()
    , optionalAliasCheck = check.optional().alias('plip')
    , aliasOptionalTransformPredicateCheck = check.alias('plep').optional().transform(x=>x*2).predicate(x=>x===42)
    , store = new Store()

  t.deepEqual(check.toFullString(), 'ParamCheck[k:key]')
  t.deepEqual(presentCheck.toFullString(), 'ParamCheck[k:key]')
  t.deepEqual(optionalCheck.toFullString(), 'ParamCheck[k:key(*)]')
  t.deepEqual(absentNoCheck.toFullString(), 'ParamCheck[k:key(!)]')
  t.deepEqual(absentWithCheck.toFullString(), 'ParamCheck[k:key(!!)]')
  t.deepEqual(defaultCheck.toFullString(), 'ParamCheck[k:key(=42)]')

  t.deepEqual(aliasCheck.toFullString(), 'ParamCheck[k:plop]')
  t.deepEqual(aliasOptionalCheck.toFullString(), 'ParamCheck[k:plep(*)]')
  t.deepEqual(optionalAliasCheck.toFullString(), 'ParamCheck[k:plip(*)]')
  t.deepEqual(aliasOptionalTransformPredicateCheck.toFullString(), 'ParamCheck[k:plep(*)](*:x=>x*2)(?:x=>x===42)')

  t.doesNotEqual(check, presentCheck)
  t.doesNotEqual(check, optionalCheck)
  t.doesNotEqual(presentCheck, optionalCheck)
  t.doesNotEqual(check, absentNoCheck)
  t.doesNotEqual(check, absentWithCheck)
  t.doesNotEqual(absentNoCheck, absentWithCheck)
  t.doesNotEqual(check, defaultCheck)
  t.doesNotEqual(check, aliasCheck)

  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await presentCheck.validate(store, { key: true }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: true }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, {}))

  t.ok('undefined' === typeof await aliasOptionalCheck.validate(store, { plep: true }))
  t.ok('undefined' === typeof await aliasOptionalCheck.validate(store, {}))

  t.ok('undefined' === typeof await optionalAliasCheck.validate(store, { plip: true }))
  t.ok('undefined' === typeof await optionalAliasCheck.validate(store, {}))

  t.ok('undefined' === typeof await aliasOptionalTransformPredicateCheck.validate(store, { plep: 21 }))
  t.ok('undefined' === typeof await aliasOptionalTransformPredicateCheck.validate(store, {}))

  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await presentCheck.validate(store, { key: false }))
  t.ok('undefined' === typeof await absentNoCheck.validate(store, {}))

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await aliasCheck.validate(store, { plop: 'foo' }))
  t.ok('undefined' === typeof await presentCheck.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await absentWithCheck.validate(store, { }))

  let o = { key: true}
  t.ok('undefined' === typeof await defaultCheck.validate(store, o))
  t.deepEqual(o, { key: true })
  o = {}
  t.ok('undefined' === typeof await defaultCheck.validate(store, o))
  t.deepEqual(o, { key: 42 })

  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  t.ok('undefined' === typeof await presentCheck.validate(store, { key: true, bar: 42, foo: 'bar' }))

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')
  await testAsyncException(t, check.validate(store, { foo: 42 }), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')
  await testAsyncException(t, check.validate(store, { bar: true, foo: 'bar'}), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')

  check.presence = 42
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.value.presence(ParamCheck[k:key], 42)')

  await testAsyncException(t, aliasOptionalTransformPredicateCheck.validate(store, { plep: 12 }), 'InvalidRuleError: param.invalid.predicate(ParamCheck[k:plep], 24, x=>x===42)')

  try{
    throw new InvalidRuleError('plop', { key: 42 })
  } catch(e) {
    t.deepEqual(e.toString(), 'InvalidRuleError: plop({"key":42})')
  }
  try{
    throw new InvalidRuleError({ key: 42 })
  } catch(e) {
    t.deepEqual(e.toString(), 'InvalidRuleError: [object Object]')
  }
  try{
    throw new InvalidRuleError(Checks.Has('key'))
  } catch(e) {
    t.deepEqual(e.toString(), 'InvalidRuleError: ParamCheck[k:key]')
  }

  t.plan(54)
  t.end()
})

test('Checks.None', async function(t) {
  const store = new Store()
    , check = Checks.None()

  t.deepEqual(check.toFullString(), 'NoCheck[]')

  t.ok('undefined' === typeof await check.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { foo: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  t.plan(7)
  t.end()
})

test('Checks.Any', async function(t) {
  const store = new Store()
    , check = Checks.Any()

  t.deepEqual(check.toFullString(), 'NoCheck[]')

  t.ok('undefined' === typeof await check.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { foo: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  t.plan(7)
  t.end()
})

test('Checks.Enum', async function(t) {
  const store = new Store()
    , check = Checks.Enum('key', [ 'foo', 'bar', 'another' ])
    , absentCheck = check.absent()
    , optionalCheck = check.optional()
    , defaultCheck = check.default('foo')
    , defaultCheckFail = check.default('plop')

  t.deepEqual(check.toFullString(), 'EnumCheck[k:key]')

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'another' }))

  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await defaultCheck.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await defaultCheckFail.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, {  }))
  t.ok('undefined' === typeof await absentCheck.validate(store, {  }))

  let p = {}
  t.ok('undefined' === typeof await defaultCheck.validate(store, p))
  t.deepEqual(p, { key: 'foo' })

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(EnumCheck[k:key])')
  await testAsyncException(t, absentCheck.validate(store, { key: 42 }), 'InvalidRuleError: param.should.be.absent(EnumCheck[k:key])')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.enum(EnumCheck[k:key], 42)')
  await testAsyncException(t, optionalCheck.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.enum(EnumCheck[k:key], 42)')
  await testAsyncException(t, defaultCheck.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.enum(EnumCheck[k:key], 42)')

  await testAsyncException(t, defaultCheckFail.validate(store, { }), 'InvalidRuleError: param.invalid.enum(EnumCheck[k:key], "plop")')

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

  t.plan(28)
  t.end()
})
