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

test('Checks.Multi Error on param, toDTO, keptParam, drop,...', async function (t) {
  t.throws(() => Checks.Multi(['plop']), /^InvalidRuleError/)
  let check

  check = Checks.Multi()
  t.deepEqual(check.toDTO(), {})

  check = Checks.Multi([])
  t.deepEqual(check.toDTO(), {})

  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey')
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }, { k: 'strkey', keep: true, presence: 1 }])

  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey').drop()
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }])

  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey').drop().undrop()
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }, { k: 'strkey', keep: true, presence: 1 }])

  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey').absent()
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: false })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }, { k: 'strkey', keep: true, presence: 0, _force_check: false }])

  t.plan(11)
  t.end()
})

test('Checks.Multi', async function (t) {
  let check = Checks.Multi([
      Checks.Num('Numkey'),
      Checks.Str('strkey')
    ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }))
  t.ok('undefined' === typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }))

  await testAsyncException(t, check.validate(store, {}), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  t.plan(8)
  t.end()
})

test('Checks.Multi optional', async function (t) {
  let check = Checks.Multi([
      Checks.Num('Numkey'),
      Checks.Str('strkey'),
      Checks.Str('foo').optional()
    ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }))
  t.ok('undefined' === typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }))

  await testAsyncException(t, check.validate(store, {}), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42, strkey: 'toto', foo: false }), 'InvalidRuleError: param.invalid.str(StrCheck[k:foo], false)')

  await testAsyncException(t, check.validate(store, { Numkey: 42, strkey: 'toto', foo: undefined }), 'InvalidRuleError: param.invalid.str(StrCheck[k:foo], )')

  t.plan(12)
  t.end()
})

test('Checks.Multi absent', async function (t) {
  let check = Checks.Multi([
      Checks.Id('knownId'),
      Checks.Id('createdId').asNew(),
      Checks.Num('Numkey'),
      Checks.Str('strkey'),
      Checks.Str('foo').absent()
    ])
    , store = new Store()

  await store.set('xxx', {})

  t.ok('undefined' === typeof await check.validate(store, { knownId: 'xxx', Numkey: 42, strkey: 'toto' }))
  t.ok('undefined' === typeof await check.validate(store, { knownId: 'xxx', Numkey: 42, strkey: 'toto', key: false }))

  await testAsyncException(t, check.validate(store, {}), 'InvalidRuleError: param.should.be.present(ValidId[k:knownId])')

  await testAsyncException(t, check.validate(store, { knownId: 'xxx' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { knownId: 'abc' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { knownId: 'xxx', Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { knownId: 'xxx', strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { knownId: 'xxx', Numkey: 42, strkey: 'toto', foo: false }), 'InvalidRuleError: param.should.be.absent(StrCheck[k:foo])')

  await testAsyncException(t, check.validate(store, { knownId: 'xxx', Numkey: 42, strkey: 'toto', createdId: 'QSDF' }), 'InvalidRuleError: param.should.be.absent(NotExistsId[k:createdId])')

  t.plan(16)
  t.end()
})