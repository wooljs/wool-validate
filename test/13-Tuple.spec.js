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
import { Bool, Enum, InvalidRuleError, Num, Str, Tuple } from '../index.js'
import { Store } from 'wool-store'
import { testAsyncException } from './common.js'

test('Checks Tuple Str Num', async function (t) {
  const store = new Store()
  const check = Tuple('key', [
    Str().regex(/^[a-z]+$/),
    Num().asInt()
  ])
  const optionalCheck = check.optional()
  const absentCheck = check.absent()

  t.deepEqual(check.toFullString(), 'TupleCheck[k:key]{ RegexCheck[](?:/^[a-z]+$/), IntegerCheck[](?:Number.isInteger()) }')
  t.deepEqual(optionalCheck.toFullString(), 'TupleCheck[k:key(*)]{ RegexCheck[](?:/^[a-z]+$/), IntegerCheck[](?:Number.isInteger()) }')
  t.deepEqual(absentCheck.toFullString(), 'TupleCheck[k:key(!)]{ RegexCheck[](?:/^[a-z]+$/), IntegerCheck[](?:Number.isInteger()) }')

  t.ok(typeof await check.validate(store, { key: ['plop', 42] }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { key: ['plop', 42] }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { }) === 'undefined')
  t.ok(typeof await absentCheck.validate(store, { }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: ['bar', -1e10] }) === 'undefined')
  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(TupleCheck[k:key])')
  await testAsyncException(t, absentCheck.validate(store, { key: ['plop', 42] }), 'InvalidRuleError: param.should.be.absent(TupleCheck[k:key])')
  await testAsyncException(t, check.validate(store, { key: ['foo', 3.14159] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.predicate(NumberCheck[], 3.14159, Number.isInteger()))')
  await testAsyncException(t, check.validate(store, { key: ['bar', -1e10, true] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["bar",-10000000000,true])')
  await testAsyncException(t, optionalCheck.validate(store, { key: ['bar', -1e10, true] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["bar",-10000000000,true])')
  await testAsyncException(t, check.validate(store, { key: [] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 0, [])')
  await testAsyncException(t, check.validate(store, { key: [42] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 1, [42])')
  await testAsyncException(t, check.validate(store, { key: [42, 666, 3.14159] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, [42,666,3.14159])')
  await testAsyncException(t, check.validate(store, { key: ['foo'] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 1, ["foo"])')
  await testAsyncException(t, check.validate(store, { key: ['foo', 'bar'] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.num("bar"))')
  await testAsyncException(t, check.validate(store, { key: ['another', 'foo', 'bar'] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["another","foo","bar"])')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S' } }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(TupleCheck[k:key])')

  t.plan(38)
  t.end()
})

test('Checks Tuple Str Num predicate', async function (t) {
  const store = new Store()
  const check = Tuple('key', [
    Str().regex(/^[a-z]+$/),
    Num().asInt()
      .transform(x => { const r = Math.sqrt(x); if (isNaN(r)) { throw new Error('NaN') } else return r })
  ]).predicate(([a, b]) => a.length === b)

  t.ok(typeof await check.validate(store, { key: ['plop', 4] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: ['bar', 3] }) === 'undefined')
  await testAsyncException(t, check.validate(store, { key: ['foo', -1] }), /^InvalidRuleError: param\.validation\.error\(TupleCheck\[k:key\], NaN, Error: NaN/, false)
  await testAsyncException(t, check.validate(store, { key: ['foo', 0] }), 'InvalidRuleError: param.invalid.predicate(TupleCheck[k:key], ["foo",0], ([a, b]) => a.length === b)')
  await testAsyncException(t, check.validate(store, { key: ['foo', 3.14159] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.predicate(NumberCheck[], 3.14159, Number.isInteger()))')
  await testAsyncException(t, check.validate(store, { key: ['bar', -1e10, true] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["bar",-10000000000,true])')
  await testAsyncException(t, check.validate(store, { key: [] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 0, [])')
  await testAsyncException(t, check.validate(store, { key: [42] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 1, [42])')
  await testAsyncException(t, check.validate(store, { key: [42, 666, 3.14159] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, [42,666,3.14159])')
  await testAsyncException(t, check.validate(store, { key: ['foo'] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 1, ["foo"])')
  await testAsyncException(t, check.validate(store, { key: ['foo', 'bar'] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.num("bar"))')
  await testAsyncException(t, check.validate(store, { key: ['another', 'foo', 'bar'] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["another","foo","bar"])')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S' } }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(TupleCheck[k:key])')

  t.plan(29)
  t.end()
})

test('Checks Tuple Enum Num Bool', async function (t) {
  const store = new Store()
  const check = Tuple('key', [
    Enum('', ['foo', 'bar']),
    Num().min(0), Bool()
  ])

  t.ok(typeof await check.validate(store, { key: ['bar', 0, true] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: ['foo', 3.14159, false] }) === 'undefined')
  await testAsyncException(t, check.validate(store, { key: ['bar', -1e10, true] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.predicate(NumberCheck[], -10000000000, x >= 0))')
  await testAsyncException(t, check.validate(store, { key: ['bar', -1e10, true, undefined] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 4, ["bar",-10000000000,true,null])')
  await testAsyncException(t, check.validate(store, { key: ['plop', 42, false] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 0, param.invalid.enum("plop"))')
  await testAsyncException(t, check.validate(store, { key: ['foo', 3.14159, undefined] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 2, param.invalid.bool())')
  await testAsyncException(t, check.validate(store, { key: [] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 0, [])')
  await testAsyncException(t, check.validate(store, { key: [42] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 1, [42])')
  await testAsyncException(t, check.validate(store, { key: [42, 666, 3.14159] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 0, param.invalid.enum(42))')
  await testAsyncException(t, check.validate(store, { key: ['foo'] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 1, ["foo"])')
  await testAsyncException(t, check.validate(store, { key: ['foo', 'bar'] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 2, ["foo","bar"])')
  await testAsyncException(t, check.validate(store, { key: ['another', 'foo', 'bar'] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 0, param.invalid.enum("another"))')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S' } }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(TupleCheck[k:key])')

  t.plan(30)
  t.end()
})

test('Checks Tuple bad def', async function (t) {
  try {
    Tuple('key', [])
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.invalid.tuple.build.no.definitions(TupleCheck[k:key])')
  }

  t.plan(2)
  t.end()
})
