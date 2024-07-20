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
import { Id, InvalidRuleError, Multi, Num, Str } from '../index.js'
import { Store } from 'wool-store'
import { testAsyncException } from './common.js'

test('Checks Multi Error on param, toDTO, keptParam, drop,...', async function (t) {
  t.throws(() => Multi(['plop']), /^InvalidRuleError/)
  let check

  check = Multi()
  t.deepEqual(check.toDTO(), {})

  check = Multi([])
  t.deepEqual(check.toDTO(), {})

  const CheckStrKey = Str('strkey')
  check = Multi([
    Num('Numkey'),
    CheckStrKey
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }, { k: 'strkey', keep: true, presence: 1 }])

  // Try to drop before
  check = Multi([
    Num('Numkey'),
    CheckStrKey.drop().transform(x => x)
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }])

  // Try to drop after
  check = Multi([
    Num('Numkey'),
    CheckStrKey.transform(x => x).drop()
  ])

  // Try to drop before
  check = Multi([
    Num('Numkey'),
    CheckStrKey.drop().optional()
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }])

  // Try to drop after
  check = Multi([
    Num('Numkey'),
    CheckStrKey.optional().drop()
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }])

  // check again to see if drop had modified original CheckStrKey
  check = Multi([
    Num('Numkey'),
    CheckStrKey
  ])

  // Try to drop before
  check = Multi([
    Num('Numkey'),
    CheckStrKey.drop().crypto(x => x)
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }])

  // Try to drop after
  check = Multi([
    Num('Numkey'),
    CheckStrKey.crypto(x => x).drop()
  ])

  // check again to see if drop had modified original CheckStrKey
  check = Multi([
    Num('Numkey'),
    CheckStrKey
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: true })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }, { k: 'strkey', keep: true, presence: 1 }])

  check = Multi([
    Num('Numkey'),
    Str('strkey').absent()
  ])

  t.deepEqual(check.toDTO(), { Numkey: true, strkey: false })
  t.deepEqual(check.keptParam().map(x => Object.assign({}, x)), [{ k: 'Numkey', keep: true, presence: 1 }, { k: 'strkey', keep: true, presence: 0, _force_check: false }])

  t.plan(17)
  t.end()
})

test('Checks Multi', async function (t) {
  const store = new Store()
  const check = Multi([
    Num('Numkey'),
    Str('strkey')
  ])

  try {
    check.absent()
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.multi.cannot.be.absent(MultiCheck[])')
  }

  try {
    check.present()
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.multi.already.present(MultiCheck[])')
  }

  try {
    check.optional()
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.multi.cannot.be.optional(MultiCheck[])')
  }

  try {
    check.default()
    t.fail('should have failed')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.multi.cannot.have.default(MultiCheck[])')
  }

  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }) === 'undefined')
  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }) === 'undefined')

  await testAsyncException(t, check.validate(store, {}), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')
  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')
  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  const cloneCheck = check.clone()
  t.ok(typeof await cloneCheck.validate(store, { Numkey: 42, strkey: 'toto' }) === 'undefined')
  t.ok(typeof await cloneCheck.validate(store, { Numkey: 42, strkey: 'toto', key: false }) === 'undefined')

  await testAsyncException(t, cloneCheck.validate(store, {}), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')
  await testAsyncException(t, cloneCheck.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')
  await testAsyncException(t, cloneCheck.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  t.plan(24)
  t.end()
})

test('Checks Multi sub optional', async function (t) {
  const store = new Store()
  const check = Multi([
    Num('Numkey'),
    Str('strkey'),
    Str('foo').optional()
  ])

  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }) === 'undefined')
  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }) === 'undefined')

  await testAsyncException(t, check.validate(store, {}), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42, strkey: 'toto', foo: false }), 'InvalidRuleError: param.invalid.str(StrCheck[k:foo], false)')

  await testAsyncException(t, check.validate(store, { Numkey: 42, strkey: 'toto', foo: undefined }), 'InvalidRuleError: param.invalid.str(StrCheck[k:foo], )')

  t.plan(12)
  t.end()
})

test('Checks Multi sub absent', async function (t) {
  const store = new Store()
  const check = Multi([
    Id('knownId'),
    Id('createdId').asNew(),
    Num('Numkey'),
    Str('strkey'),
    Str('foo').absent()
  ])

  await store.set('xxx', {})

  t.ok(typeof await check.validate(store, { knownId: 'xxx', Numkey: 42, strkey: 'toto' }) === 'undefined')
  t.ok(typeof await check.validate(store, { knownId: 'xxx', Numkey: 42, strkey: 'toto', key: false }) === 'undefined')

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

test('Checks Multi sub default', async function (t) {
  const store = new Store()
  const check = Multi([
    Num('Numkey'),
    Str('strkey').default('plop')
  ])

  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }) === 'undefined')
  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }) === 'undefined')

  const param = { Numkey: 42 }
  t.ok(typeof await check.validate(store, param) === 'undefined')
  t.deepEquals(param, { Numkey: 42, strkey: 'plop' })

  await testAsyncException(t, check.validate(store, {}), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  t.plan(8)
  t.end()
})

test('Checks Multi full optional', async function (t) {
  const store = new Store()
  const check = Multi([
    Num('Numkey'),
    Str('strkey')
  ])
  const optional = check.clone(x => x.optional())

  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }) === 'undefined')
  t.ok(typeof await optional.validate(store, { Numkey: 42, strkey: 'toto' }) === 'undefined')
  t.ok(typeof await optional.validate(store, { Numkey: 42 }) === 'undefined')
  t.ok(typeof await optional.validate(store, { strkey: 'toto' }) === 'undefined')
  t.ok(typeof await optional.validate(store, { }) === 'undefined')

  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }) === 'undefined')
  t.ok(typeof await optional.validate(store, { Numkey: 42, strkey: 'toto', key: false }) === 'undefined')

  await testAsyncException(t, check.validate(store, {}), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  t.plan(13)
  t.end()
})

test('Checks Multi full absent', async function (t) {
  const store = new Store()
  const check = Multi([
    Num('Numkey'),
    Str('strkey')
  ])
  const absent = check.clone(x => x.absent())

  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }) === 'undefined')
  t.ok(typeof await absent.validate(store, { }) === 'undefined')

  t.ok(typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }) === 'undefined')
  t.ok(typeof await absent.validate(store, { key: false }) === 'undefined')

  await testAsyncException(t, check.validate(store, {}), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, absent.validate(store, { Numkey: 42, strkey: 'toto' }), 'InvalidRuleError: param.should.be.absent(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, absent.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.absent(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, absent.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.absent(StrCheck[k:strkey])')

  t.plan(16)
  t.end()
})

test('Checks Multi extractCreatedParam', async function (t) {
  const store = new Store()
  const check = Multi([
    Id('id', { algo: (t) => `plop:${t}` }).asNew(),
    Num('Numkey'),
    Str('strkey')
  ])

  const pl = { Numkey: 42, strkey: 'plop' }

  await check.validate(store, pl, 0)

  t.deepEqual(check.extractCreatedParam(pl), { id: 'plop:0' })

  t.plan(1)
  t.end()
})
