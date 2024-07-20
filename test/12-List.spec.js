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
import { List, Num, Str } from '../index.js'
import { Store } from 'wool-store'
import { testAsyncException } from './common.js'

test('Checks List Str.regex', async function (t) {
  const check = List('key', Str().regex(/^[a-z]+$/))
  const store = new Store()
  const optionalCheck = check.optional()
  const absentCheck = check.absent()

  t.deepEqual(check.toFullString(), 'ListCheck[k:key]{ RegexCheck[](?:/^[a-z]+$/) }')
  t.deepEqual(optionalCheck.toFullString(), 'ListCheck[k:key(*)]{ RegexCheck[](?:/^[a-z]+$/) }')
  t.deepEqual(absentCheck.toFullString(), 'ListCheck[k:key(!)]{ RegexCheck[](?:/^[a-z]+$/) }')

  t.ok(typeof await check.validate(store, { key: [] }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { key: [] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: ['foo'] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: ['foo', 'bar'] }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { key: ['foo', 'bar'] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: ['another', 'foo', 'bar'] }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { }) === 'undefined')
  t.ok(typeof await absentCheck.validate(store, { }) === 'undefined')
  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(ListCheck[k:key])')
  await testAsyncException(t, absentCheck.validate(store, { key: ['foo', 'bar'] }), 'InvalidRuleError: param.should.be.absent(ListCheck[k:key])')
  await testAsyncException(t, check.validate(store, { key: ['##yo"'] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.predicate(StrCheck[], "##yo\\"", /^[a-z]+$/))')
  await testAsyncException(t, optionalCheck.validate(store, { key: ['##yaya"'] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.predicate(StrCheck[], "##yaya\\"", /^[a-z]+$/))')
  await testAsyncException(t, check.validate(store, { key: [42] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.str(42))')
  await testAsyncException(t, check.validate(store, { key: [42, 666] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.str(42))')
  await testAsyncException(t, check.validate(store, { key: ['plop', 42] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 1, param.invalid.str(42))')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S' } }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: 'plop' }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], "plop")')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(ListCheck[k:key])')

  t.plan(35)
  t.end()
})

test('Checks List Num', async function (t) {
  const check = List('key', Num().asInt())
  const store = new Store()

  t.ok(typeof await check.validate(store, { key: [] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: [42] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: [42, 666] }) === 'undefined')
  await testAsyncException(t, check.validate(store, { key: [42, 666, 3.14159] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 2, param.invalid.predicate(NumberCheck[], 3.14159, Number.isInteger()))')
  await testAsyncException(t, check.validate(store, { key: [42, true, undefined] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 1, param.invalid.num(true))')
  await testAsyncException(t, check.validate(store, { key: ['foo'] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.num("foo"))')
  await testAsyncException(t, check.validate(store, { key: [{}, 'bar'] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.num({}))')
  await testAsyncException(t, check.validate(store, { key: ['another', 'foo', 'bar'] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.num("another"))')
  await testAsyncException(t, check.validate(store, { key: [42, 'plop'] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 1, param.invalid.num("plop"))')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S' } }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: 'plop' }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], "plop")')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(ListCheck[k:key])')

  t.plan(25)
  t.end()
})

test('Checks List Num predicate', async function (t) {
  const check = List('key', Num().asInt().predicate(x => {
    if (x === 0) { throw new Error('zero') } return x
  })).predicate(l => l.reduce((a, b) => (a + b), 0) < 10)
  const store = new Store()

  t.ok(typeof await check.validate(store, { key: [9] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: [1, 2, 3] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: [4, 4] }) === 'undefined')
  t.ok(typeof await check.validate(store, { key: [1, 1, 1, 1, 1, 1, 1, 1, 1] }) === 'undefined')

  await testAsyncException(t, check.validate(store, { key: [0] }), /^InvalidRuleError: param\.validation\.error\(ListCheck\[k:key\], zero, Error: zero/, false)

  await testAsyncException(t, check.validate(store, { key: [42, 666, 3.14159] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 2, param.invalid.predicate(NumberCheck[], 3.14159, Number.isInteger()))')
  await testAsyncException(t, check.validate(store, { key: [42] }), 'InvalidRuleError: param.invalid.predicate(ListCheck[k:key], [42], l => l.reduce((a, b) => (a + b), 0) < 10)')

  t.plan(9)
  t.end()
})
