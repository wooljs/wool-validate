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

const ParamCheck = require('../lib/ParamCheck.js')

const test = require('tape')
  , Checks = require(__dirname + '/../index.js')
  , { Store } = require('wool-store')
  , { testAsyncException } = require('./common.js')

test('Checks.Struct', async function (t) {
  const store = new Store()
    , check = Checks.Struct('key', [Checks.Num('int'), Checks.Str('str'), Checks.Enum('rank', ['S', 'A', 'B'])])
    , optionalCheck = check.optional()
    , absentCheck = check.absent()

  t.deepEqual(check.toFullString(), 'StructCheck[k:key]{ NumberCheck[k:int], StrCheck[k:str], EnumCheck[k:rank] }')
  t.deepEqual(optionalCheck.toFullString(), 'StructCheck[k:key(*)]{ NumberCheck[k:int], StrCheck[k:str], EnumCheck[k:rank] }')
  t.deepEqual(absentCheck.toFullString(), 'StructCheck[k:key(!)]{ NumberCheck[k:int], StrCheck[k:str], EnumCheck[k:rank] }')

  t.ok('undefined' === typeof await check.validate(store, { key: { int: 42, str: 'plop', rank: 'S' } }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { key: { int: 42, str: 'plop', rank: 'S' } }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { }))
  t.ok('undefined' === typeof await absentCheck.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: { int: 666, str: 'foobar', rank: 'B' } }))

  await testAsyncException(t, check.validate(store, {  }), 'InvalidRuleError: param.should.be.present(StructCheck[k:key])')
  await testAsyncException(t, absentCheck.validate(store, { key: { int: 42, str: 'plop', rank: 'S' } }), 'InvalidRuleError: param.should.be.absent(StructCheck[k:key])')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 'plop', rank: 'K' } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.enum(EnumCheck[k:rank], "K"))')
  await testAsyncException(t, optionalCheck.validate(store, { key: { int: 42, str: 'plop', rank: 'K' } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.enum(EnumCheck[k:rank], "K"))')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S' } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.str(StrCheck[k:str], 666))')
  await testAsyncException(t, check.validate(store, { key: { int: 'yo', str: 'plop', rank: 'S' } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.num(NumberCheck[k:int], "yo"))')

  await testAsyncException(t, check.validate(store, { key: { str: 'plop', rank: 'S' } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.should.be.present(NumberCheck[k:int]))')

  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.struct(StructCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.struct(StructCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StructCheck[k:key])')

  await testAsyncException(t, check.validate(store, { key: null }), 'InvalidRuleError: param.invalid.struct.is.null(StructCheck[k:key])')

  t.plan(30)
  t.end()
})

test('Checks.Struct + Struct', async function (t) {
  const store = new Store()
    , check = Checks.Struct('key', [Checks.Str('str'), Checks.Struct('sub', [Checks.Num('int').asInt()
      .transform(x => { let r = Math.sqrt(x); if (isNaN(r)) { throw new Error('NaN') } else return r }), Checks.Enum('rank', ['S', 'A', 'B'])])])

  t.ok('undefined' === typeof await check.validate(store, { key: { str: 'plop', sub: { int: 42, rank: 'S' } } }))

  await testAsyncException(t, check.validate(store, { key: { str: 'plop', sub: { int: -1, rank: 'S' } } }), /^InvalidRuleError: param\.invalid\.struct\.item\(StructCheck\[k:key\], param\.invalid\.struct\.item\(StructCheck\[k:sub\], param\.validation\.error\(NumberCheck\[k:int\], NaN, Error: NaN/, false)

  await testAsyncException(t, check.validate(store, { key: { str: 'plop', sub: { int: 16, rank: 10 } } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.struct.item(StructCheck[k:sub], param.invalid.enum(EnumCheck[k:rank], 10)))')

  await testAsyncException(t, check.validate(store, { key: { str: 'plop' } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.should.be.present(StructCheck[k:sub]))')
  await testAsyncException(t, check.validate(store, { key: { str: 'plop', sub: { int: 42 } } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.struct.item(StructCheck[k:sub], param.should.be.present(EnumCheck[k:rank])))')

  t.plan(8)
  t.end()
})

test('Checks.Struct + Unknow Error', async function (t) {
  class UnknowErrorCheck extends ParamCheck {
    validate() { throw new Error('Unknown Error') }
  }

  const store = new Store()
    , check = Checks.Struct('key', [Checks.Str('str'), new UnknowErrorCheck('foo') ])

  await testAsyncException(t, check.validate(store, { key: { str: 'plop', foo: 'plop' }}), /InvalidRuleError: param.validation.error\(StructCheck\[k:key\], Unknown Error, Error: Unknown Error/, false)

  t.plan(1)
  t.end()
})

test('Checks.Struct + deep Struct optional/absent', async function (t) {
  const store = new Store()
    , str = Checks.Str('str')
    , check = Checks.Struct('key', [str, Checks.Struct('opt', [str.optional(), Checks.Num('int').asInt()]), Checks.Struct('abs', [str.absent(), Checks.Num('int').asInt()])])

  t.deepEqual(check.toFullString(), 'StructCheck[k:key]{ StrCheck[k:str], StructCheck[k:opt]{ StrCheck[k:str(*)], IntegerCheck[k:int](?:Number.isInteger()) }, StructCheck[k:abs]{ StrCheck[k:str(!)], IntegerCheck[k:int](?:Number.isInteger()) } }')

  t.ok('undefined' === typeof await check.validate(store, { key: { str: 'plop', opt: { str: 'xx', int: 42 }, abs: { int: 666} }}))
  t.ok('undefined' === typeof await check.validate(store, { key: { str: 'plop', opt: { int: 42 }, abs: { int: 666} }}))

  await testAsyncException(t, check.validate(store, { key: { str: 'plop', opt: { str: 'foo', int: 17 }, abs: { str: 'bar', int: 9536 }  } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.struct.item(StructCheck[k:abs], param.should.be.absent(StrCheck[k:str])))')

  t.plan(5)
  t.end()
})

test('Checks.Struct bad def', async function (t) {
  try {
    Checks.Struct('key', [])
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.invalid.struct.build.no.definitions(StructCheck[k:key])')
  }

  t.plan(2)
  t.end()
})