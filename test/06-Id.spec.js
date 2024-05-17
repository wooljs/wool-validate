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
//, { testAsyncException } = require('./common.js')

test('Checks.Id', async function (t) {
  const store = new Store()
    , check = Checks.Id('id')

  try {
    check.absent(true)
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.be.absent.and.in.store(ValidId[k:id])')
  }

  try {
    check.default('plop')
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.have.default(ValidId[k:id])')
  }

  await store.set('42', { id: '42', foo: 'bar' })
  t.ok('undefined' === typeof await check.validate(store, { id: '42', foo: true }))
  t.ok(check.isOne('42'))

  t.plan(6)
  t.end()
})

test('Checks.Id prefix', async function (t) {
  const store = new Store()
    , check = Checks.Id('id', { prefix: 'test: ' })
    , optionalCheck = check.optional()
    , absentNoCheck = check.absent()

  await store.set('test: 42', { id: '42', foo: 'bar' })

  t.ok('undefined' === typeof await check.validate(store, { id: '42' }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { id: '42' }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { foo: true  }))
  t.ok('undefined' === typeof await absentNoCheck.validate(store, { }))

  await check.validate(store, { id: '666' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.exists.in.store(ValidId[k:id], 666)')
    })

  await absentNoCheck.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(ValidId[k:id])')
    })

  await optionalCheck.validate(store, { id: '666' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.exists.in.store(ValidId[k:id], 666)')
    })

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(ValidId[k:id])')
    })

  t.ok(check.isOne('test: 42'))

  t.ok(check.isOne()('test: XX'))
  t.notOk(check.isOne()('crap: XX'))

  t.plan(16)
  t.end()
})

test('Checks.Id alias', async function (t) {
  const store = new Store()
    , check = Checks.Id('id', { prefix: 'test: ' }).alias('foobar')

  try {
    check.absent(true)
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.be.absent.and.in.store(ValidId[k:foobar])')
  }

  try {
    check.default('plop')
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.have.default(ValidId[k:foobar])')
  }

  await store.set('test: 42', { id: '42', foo: 'bar' })

  t.ok('undefined' === typeof await check.validate(store, { foobar: '42' }))

  await check.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(ValidId[k:foobar])')
    })

  await check.validate(store, { foobar: '666' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.exists.in.store(ValidId[k:foobar], 666)')
    })

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(ValidId[k:foobar])')
    })

  t.ok(check.isOne('test: 42'))

  t.ok(check.isOne()('test: XX'))
  t.notOk(check.isOne()('crap: XX'))

  t.plan(14)
  t.end()
})


test('Checks.Id.asNew()', async function (t) {
  const store = new Store()
    , check = Checks.Id('id', { prefix: 'test: ' }).asNew()
    , d = new Date()
  let p

  t.ok('undefined' === typeof await check.validate(store, p = { foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '0' + d.getTime().toString(16) + '0000')
  t.ok('undefined' === typeof await check.validate(store, p = { foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '0' + d.getTime().toString(16) + '0001')
  t.ok('undefined' === typeof await check.validate(store, p = { foo: true }))
  t.ok('id' in p)
  t.ok(/^test: /.test(check.as(p.id)))
  t.plan(9)
  t.end()
})

test('Checks.Id.asNew() algo', async function (t) {
  const store = new Store()
    , algo = () => '42'
    , check = Checks.Id('id', { prefix: 'test: ', algo }).asNew()
    , d = new Date()
  let p

  try {
    check.absent()
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.is.already.absent(NotExistsId[k:id])')
  }

  try {
    check.absent(true)
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.is.already.absent(NotExistsId[k:id])')
  }

  try {
    check.default('plop')
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.have.default(NotExistsId[k:id])')
  }

  t.ok('undefined' === typeof await check.validate(store, { foo: true }))

  t.ok('undefined' === typeof await check.validate(store, p = { foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '42')

  await store.set('test: 42', { id: '42', foo: 'bar' })

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.not.be.in.store(NotExistsId[k:id], 42)')
    })

  await check.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(NotExistsId[k:id])')
    })

  await check.validate(store, { id: '666' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(NotExistsId[k:id])')
    })

  t.equal(check.presence, Checks.ParamCheck.Presence.absent)

  t.plan(17)
  t.end()
})

test('Checks.Id.notInStore()', async function (t) {
  const store = new Store()
    , check = Checks.Id('id', { prefix: 'foo: ' }).notInStore()
    , optionalCheck = check.optional()
    , absentNoCheck = check.absent()
    , d = new Date()
  let p

  try {
    check.absent(true)
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.be.absent.and.not.in.store(NotInStoreId[k:id])')
  }

  try {
    check.default('plop')
    t.fail('should throw')
  } catch (e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.cannot.have.default(NotInStoreId[k:id])')
  }

  t.ok('undefined' === typeof await check.validate(store, p = { id: '42', foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '42')


  t.ok('undefined' === typeof await check.validate(store, { id: '42' }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { id: '42' }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { }))
  t.ok('undefined' === typeof await optionalCheck.validate(store, { foo: true  }))
  t.ok('undefined' === typeof await absentNoCheck.validate(store, { }))

  await store.set('foo: 42', { id: '42', foo: 'bar' })

  t.ok('undefined' === typeof await check.validate(store, p = { id: '666', foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '666')

  t.ok('undefined' === typeof await optionalCheck.validate(store, { id: '666' }))

  await check.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.not.be.in.store(NotInStoreId[k:id], 42)')
    })

  await optionalCheck.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.not.be.in.store(NotInStoreId[k:id], 42)')
    })

  await absentNoCheck.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(NotInStoreId[k:id])')
    })

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(NotInStoreId[k:id])')
    })

  t.plan(24)
  t.end()
})

test('Checks.Id.noCheck()', async function (t) {
  const store = new Store()
    , check = Checks.Id('id', { prefix: 'foo: ' }).noCheck()
    , d = new Date()
  let p

  await check.validate(store, { foo: true })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(NoCheckId[k:id])')
    })

  t.ok('undefined' === typeof await check.validate(store, p = { id: '42', foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '42')

  t.plan(5)
  t.end()
})