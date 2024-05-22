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

test('Checks.Either bad def', async function(t) {
  try {
    Checks.Either('key', [ ])
    t.fail('should have failed')
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.invalid.alt.build.not.enough.alternatives(EitherCheck[k:key])')
  }
  try {
    Checks.Either('key', [ Checks.Str() ])
    t.fail('should have failed')
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.invalid.alt.build.not.enough.alternatives(EitherCheck[k:key])')
  }
  t.plan(4)
  t.end()
})

test('Checks.Either same key', async function(t) {
  const store = new Store()
    , check = Checks.Either('key', [ Checks.Str(), Checks.Num() ])
    , optionalCheck = check.optional()
    , absentCheck = check.absent()

  t.deepEqual(check.toFullString(), 'EitherCheck[k:key]')
  t.deepEqual(optionalCheck.toFullString(), 'EitherCheck[k:key(*)]')
  t.deepEqual(absentCheck.toFullString(), 'EitherCheck[k:key(!)]')

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await absentCheck.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'another' }))
  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: 42 }))

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(EitherCheck[k:key])')
  await testAsyncException(t, absentCheck.validate(store, { key: 666 }), 'InvalidRuleError: param.should.be.absent(EitherCheck[k:key])')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], true)')
  await testAsyncException(t, check.validate(store, { key: null }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], null)')
  await testAsyncException(t, optionalCheck.validate(store, { key: null }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], null)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(EitherCheck[k:key])')

  t.plan(21)
  t.end()
})

test('Checks.Either different key', async function(t) {
  let check = Checks.Either([ Checks.Str('foo'), Checks.Num('bar') ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { foo: 'some' }))
  t.ok('undefined' === typeof await check.validate(store, { foo: 'another' }))
  t.ok('undefined' === typeof await check.validate(store, { bar: 42 }))

  await testAsyncException(t, check.validate(store, { foo: 'some', bar: 42 }), 'InvalidRuleError: param.invalid.either.too.many.candidates')

  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.either.item.no.candidate')

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.invalid.either.item.no.candidate')

  t.plan(9)
  t.end()
})

test('Checks.Either same key complex', async function(t) {
  let check = Checks.Either('key', [ Checks.Struct([Checks.Str('foo'), Checks.Num('bar')]), Checks.List(Checks.Num().asInt()), Checks.Dict(Checks.Str(), Checks.Num()), Checks.Enum(['A', 'B', 'C']), Checks.Tuple([Checks.Num().asInt(), Checks.Num().asInt(), Checks.Str()]) ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 'some', bar: 42 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 12 ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: { plic: 12, ploc: 1.5, u: -1e10} }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'B' }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 1, 2, 'three' ] }))

  t.plan(5)
  t.end()
})