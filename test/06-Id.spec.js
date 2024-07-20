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
import { Id, InvalidRuleError, ParamCheck } from '../index.js'
import { Store } from 'wool-store'

test('Checks Id', async function (t) {
  const store = new Store()
  const check = Id('id')

  t.deepEqual(check.toFullString(), 'ValidId[k:id]')

  try {
    check.absent(true)
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.be.absent.and.in.store(ValidId[k:id])')
  }

  try {
    check.default('plop')
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.have.default(ValidId[k:id])')
  }

  await store.set('42', { id: '42', foo: 'bar' })
  t.ok(typeof await check.validate(store, { id: '42', foo: true }) === 'undefined')
  t.ok(check.isOne('42'))

  t.plan(7)
  t.end()
})

test('Checks Id prefix', async function (t) {
  const store = new Store()
  const check = Id('id', { prefix: 'test: ' })
  const optionalCheck = check.optional()
  const absentNoCheck = check.absent()

  t.deepEqual(check.toFullString(), 'ValidId[k:id]')
  t.deepEqual(optionalCheck.toFullString(), 'ValidId[k:id(*)]')
  t.deepEqual(absentNoCheck.toFullString(), 'ValidId[k:id(!)]')

  await store.set('test: 42', { id: '42', foo: 'bar' })

  t.ok(typeof await check.validate(store, { id: '42' }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { id: '42' }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { foo: true }) === 'undefined')
  t.ok(typeof await absentNoCheck.validate(store, { }) === 'undefined')

  await check.validate(store, { id: '666' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.exists.in.store(ValidId[k:id], 666)')
    })

  await absentNoCheck.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(ValidId[k:id])')
    })

  await optionalCheck.validate(store, { id: '666' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.exists.in.store(ValidId[k:id], 666)')
    })

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(ValidId[k:id])')
    })

  t.ok(check.isOne('test: 42'))

  t.ok(check.isOne()('test: XX'))
  t.notOk(check.isOne()('crap: XX'))

  t.plan(19)
  t.end()
})

test('Checks Id alias', async function (t) {
  const store = new Store()
  const check = Id('id', { prefix: 'test: ' }).alias('foobar')

  t.deepEqual(check.toFullString(), 'ValidId[k:foobar]')

  try {
    check.absent(true)
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.be.absent.and.in.store(ValidId[k:foobar])')
  }

  try {
    check.default('plop')
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.have.default(ValidId[k:foobar])')
  }

  await store.set('test: 42', { id: '42', foo: 'bar' })

  t.ok(typeof await check.validate(store, { foobar: '42' }) === 'undefined')

  await check.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(ValidId[k:foobar])')
    })

  await check.validate(store, { foobar: '666' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.exists.in.store(ValidId[k:foobar], 666)')
    })

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(ValidId[k:foobar])')
    })

  t.ok(check.isOne('test: 42'))

  t.ok(check.isOne()('test: XX'))
  t.notOk(check.isOne()('crap: XX'))

  t.plan(15)
  t.end()
})

test('Checks Id.asNew()', async function (t) {
  const store = new Store()
  const check = Id('id', { prefix: 'test: ' }).asNew()
  const d = new Date()
  let p

  t.deepEqual(check.toFullString(), 'NotExistsId[k:id]')

  t.ok(typeof await check.validate(store, p = { foo: true }, d) === 'undefined')
  t.ok('id' in p)
  t.deepEqual(p.id, '0' + d.getTime().toString(16) + '0000')
  t.ok(typeof await check.validate(store, p = { foo: true }, d) === 'undefined')
  t.ok('id' in p)
  t.deepEqual(p.id, '0' + d.getTime().toString(16) + '0001')
  t.ok(typeof await check.validate(store, p = { foo: true }) === 'undefined')
  t.ok('id' in p)
  t.ok(/^test: /.test(check.as(p.id)))
  t.plan(10)
  t.end()
})

test('Checks Id.asNew() algo', async function (t) {
  const store = new Store()
  const algo = () => '42'
  const check = Id('id', { prefix: 'test: ', algo }).asNew()
  const d = new Date()
  let p

  t.deepEqual(check.toFullString(), 'NotExistsId[k:id]')

  try {
    check.present()
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.be.present(NotExistsId[k:id])')
  }

  try {
    check.optional()
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.be.optional(NotExistsId[k:id])')
  }

  try {
    check.absent()
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.is.already.absent(NotExistsId[k:id])')
  }

  try {
    check.absent(true)
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.is.already.absent(NotExistsId[k:id])')
  }

  try {
    check.default('plop')
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.have.default(NotExistsId[k:id])')
  }

  t.ok(typeof await check.validate(store, { foo: true }) === 'undefined')

  t.ok(typeof await check.validate(store, p = { foo: true }, d) === 'undefined')
  t.ok('id' in p)
  t.deepEqual(p.id, '42')

  await store.set('test: 42', { id: '42', foo: 'bar' })

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.not.be.in.store(NotExistsId[k:id], 42)')
    })

  await check.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(NotExistsId[k:id])')
    })

  await check.validate(store, { id: '666' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(NotExistsId[k:id])')
    })

  t.equal(check.presence, ParamCheck.Presence.absent)

  t.plan(22)
  t.end()
})

test('Checks Id.notInStore()', async function (t) {
  const store = new Store()
  const check = Id('id', { prefix: 'foo: ' }).notInStore()
  const optionalCheck = check.optional()
  const absentNoCheck = check.absent()
  const d = new Date()
  let p

  t.deepEqual(check.toFullString(), 'NotInStoreId[k:id]')

  try {
    check.absent(true)
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.be.absent.and.not.in.store(NotInStoreId[k:id])')
  }

  try {
    check.default('plop')
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.have.default(NotInStoreId[k:id])')
  }

  t.ok(typeof await check.validate(store, p = { id: '42', foo: true }, d) === 'undefined')
  t.ok('id' in p)
  t.deepEqual(p.id, '42')

  t.ok(typeof await check.validate(store, { id: '42' }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { id: '42' }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { }) === 'undefined')
  t.ok(typeof await optionalCheck.validate(store, { foo: true }) === 'undefined')
  t.ok(typeof await absentNoCheck.validate(store, { }) === 'undefined')

  await store.set('foo: 42', { id: '42', foo: 'bar' })

  t.ok(typeof await check.validate(store, p = { id: '666', foo: true }, d) === 'undefined')
  t.ok('id' in p)
  t.deepEqual(p.id, '666')

  t.ok(typeof await optionalCheck.validate(store, { id: '666' }) === 'undefined')

  await check.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.not.be.in.store(NotInStoreId[k:id], 42)')
    })

  await optionalCheck.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.not.be.in.store(NotInStoreId[k:id], 42)')
    })

  await absentNoCheck.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(NotInStoreId[k:id])')
    })

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(NotInStoreId[k:id])')
    })

  t.plan(25)
  t.end()
})

test('Checks Id.noCheck()', async function (t) {
  const store = new Store()
  const check = Id('id', { prefix: 'foo: ' }).noCheck()
  const absentNoCheck = check.absent()
  const absentWithCheck = check.absent(true)
  const d = new Date()
  let p

  t.deepEqual(check.toFullString(), 'NoCheckId[k:id]')

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(NoCheckId[k:id])')
    })

  t.ok(typeof await check.validate(store, p = { id: '42', foo: true }, d) === 'undefined')
  t.ok('id' in p)
  t.deepEqual(p.id, '42')

  t.ok(typeof await absentNoCheck.validate(store, {}, d) === 'undefined')
  t.ok(typeof await absentWithCheck.validate(store, {}, d) === 'undefined')

  t.plan(8)
  t.end()
})
