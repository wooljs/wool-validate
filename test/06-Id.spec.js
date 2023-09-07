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
  let check = Checks.Id('id')
    , store = new Store()

  await store.set('42', { id: '42', foo: 'bar' })
  t.ok('undefined' === typeof await check.validate(store, { id: '42', foo: true }))
  t.ok(check.isOne('42'))

  t.plan(2)
  t.end()
})

test('Checks.Id prefix', async function (t) {
  let check = Checks.Id('id', { prefix: 'test: ' })
    , store = new Store()
  await store.set('test: 42', { id: '42', foo: 'bar' })

  t.ok('undefined' === typeof await check.validate(store, { id: '42' }))

  await check.validate(store, { id: '666' })
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

  t.plan(8)
  t.end()
})

test('Checks.Id alias', async function (t) {
  let check = Checks.Id('id', { prefix: 'test: ' }).alias('foobar')
    , store = new Store()
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

  t.plan(10)
  t.end()
})


test('Checks.Id.asNew()', async function (t) {
  let check = Checks.Id('id', { prefix: 'test: ' }).asNew()
    , store = new Store()
    , p, d = new Date()

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
  let algo = () => '42'
    , check = Checks.Id('id', { prefix: 'test: ', algo }).asNew()
    , store = new Store()
    , p, d = new Date()

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

  t.plan(11)
  t.end()
})

test('Checks.Id.notInStore()', async function (t) {
  let check = Checks.Id('id', { prefix: 'foo: ' }).notInStore()
    , store = new Store()
    , p, d = new Date()

  t.ok('undefined' === typeof await check.validate(store, p = { id: '42', foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '42')

  await store.set('foo: 42', { id: '42', foo: 'bar' })

  t.ok('undefined' === typeof await check.validate(store, p = { id: '666', foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '666')

  await check.validate(store, { id: '42' })
    .then(() => t.fail('should throw'))
    .catch(e => {
      t.ok(e instanceof Checks.InvalidRuleError)
      t.deepEqual(e.toString(), 'InvalidRuleError: param.should.not.be.in.store(NotInStoreId[k:id], 42)')
    })

  t.plan(8)
  t.end()
})

test('Checks.Id.noCheck()', async function (t) {
  let check = Checks.Id('id', { prefix: 'foo: ' }).noCheck()
    , store = new Store()
    , p, d = new Date()

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