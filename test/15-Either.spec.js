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

import test from 'tape'
import { Dict, Either, Enum, InvalidRuleError, List, Num, Str, Struct, Tuple } from '../index.js'
import { Store } from 'wool-store'
import { testAsyncException } from './common.js'

test('Checks Either bad def', async function (t) {
  try {
    Either('key', [])
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.invalid.alt.build.not.enough.alternatives(EitherCheck[k:key])')
  }
  try {
    Either('key', [Str()])
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.invalid.alt.build.not.enough.alternatives(EitherCheck[k:key])')
  }
  t.plan(4)
  t.end()
})

test('Checks Either same key', async function (t) {
  const store = new Store()
  const check = Either('key', [Str(), Num()])
  const optionalCheck = check.optional()
  const absentCheck = check.absent()
  const defaultCheck = check.default(42)

  t.deepEqual(check.toFullString(), 'EitherCheck[k:key]')
  t.deepEqual(optionalCheck.toFullString(), 'EitherCheck[k:key(*)]')
  t.deepEqual(absentCheck.toFullString(), 'EitherCheck[k:key(!)]')
  t.deepEqual(defaultCheck.toFullString(), 'EitherCheck[k:key(=42)]')

  t.ok(typeof await check.validate(store, { key: 'foo' }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { key: 'foo' }) === 'undefined')
  t.ok(typeof await absentCheck.validate(store, { }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: 'another' }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: 42 }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { key: 42 }) === 'undefined')

  const p = { }
  t.ok(typeof await defaultCheck.validate(store, p) === 'undefined')
  t.deepEqual(p, { key: 42 })

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(EitherCheck[k:key])')
  await testAsyncException(t, absentCheck.validate(store, { key: 666 }), 'InvalidRuleError: param.should.be.absent(EitherCheck[k:key])')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], true)')
  await testAsyncException(t, check.validate(store, { key: null }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], null)')
  await testAsyncException(t, optionalCheck.validate(store, { key: null }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], null)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(EitherCheck[k:key])')

  t.plan(24)
  t.end()
})

test('Checks Either different key', async function (t) {
  const check = Either([Str('foo'), Num('bar')])
  const store = new Store()

  t.ok(typeof await check.validate(store, { foo: 'some' }) === 'undefined')
  t.ok(typeof await check.validate(store, { foo: 'another' }) === 'undefined')
  t.ok(typeof await check.validate(store, { bar: 42 }) === 'undefined')

  await testAsyncException(t, check.validate(store, { foo: 'some', bar: 42 }), 'InvalidRuleError: param.invalid.either.too.many.candidates')

  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.either.item.no.candidate')

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.invalid.either.item.no.candidate')

  t.plan(9)
  t.end()
})

test('Checks Either same key complex', async function (t) {
  const check = Either('key', [Struct([Str('foo'), Num('bar')]), List(Num().asInt()), Dict(Str(), Num()), Enum(['A', 'B', 'C']), Tuple([Num().asInt(), Num().asInt(), Str()])])
  const store = new Store()

  t.ok(typeof await check.validate(store, { key: { foo: 'some', bar: 42 } }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: [12] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: { plic: 12, ploc: 1.5, u: -1e10 } }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: 'B' }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: [1, 2, 'three'] }) === 'undefined')

  t.plan(5)
  t.end()
})

test('Checks Either same key .predicate', async function (t) {
  const store = new Store()
  const check = Either('key', [Str().asNum().transform(x => { /* console.log('HERE', x); */ return x }), Num()])
    .predicate(x => ((+x) % 2) === 0)

  t.deepEqual(check.toFullString(), 'P<EitherCheck>[k:key](?:x => ((+x) % 2) === 0)')

  t.ok(typeof await check.validate(store, { key: 42 }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: 19456 }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: '42' }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: '666' }) === 'undefined')

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(EitherCheck[k:key])')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], "foo")')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], true)')
  await testAsyncException(t, check.validate(store, { key: null }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], null)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(EitherCheck[k:key])')

  t.plan(15)
  t.end()
})

test('Checks Either same key .predicate', async function (t) {
  const store = new Store()
  const check = Either('key', [Str().asNum().transform(x => { /* console.log('HERE', x); */ return x }), Num()])
    .predicate(x => ((+x) % 2) === 0)
    .transform(x => +x / 2)
  let p

  t.deepEqual(check.toDeepString(), 'T<P<EitherCheck>>[k:key]->P<EitherCheck>[k:key]->EitherCheck[k:key]')
  t.deepEqual(check.toFullString(), 'T<P<EitherCheck>>[k:key](?:x => ((+x) % 2) === 0)(*:x => +x / 2)')

  t.ok(typeof await check.validate(store, p = { key: 42 }) === 'undefined')
  t.deepEqual(p, { key: 21 })

  t.ok(typeof await check.validate(store, p = { key: 19456 }) === 'undefined')
  t.deepEqual(p, { key: 9728 })

  t.ok(typeof await check.validate(store, p = { key: '42' }) === 'undefined')
  t.deepEqual(p, { key: 21 })

  t.ok(typeof await check.validate(store, p = { key: '666' }) === 'undefined')
  t.deepEqual(p, { key: 333 })

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(T<P<EitherCheck>>[k:key])')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], "foo")')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], true)')
  await testAsyncException(t, check.validate(store, { key: null }), 'InvalidRuleError: param.invalid.either.item.no.candidate(EitherCheck[k:key], null)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(T<P<EitherCheck>>[k:key])')

  t.plan(20)
  t.end()
})
