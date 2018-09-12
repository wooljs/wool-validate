/*
 * Copyright 2018 Nicolas Lochet Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is
 * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 */

'use strict'

const test = require('tape-async')
  , Checks = require(__dirname + '/../index.js')
  , { Store } = require('wool-store')

// TODO ValidID, Crypto asymetric

test('Checks.Multi Error on param, toDTO, keptParam, drop,...', async function(t) {
  t.throws(() => Checks.Multi([ 'plop' ]), /^InvalidRuleError/)
  let check
  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey')
  ])

  t.deepEqual(check.toDTO(), {Numkey: true, strkey: true})
  t.deepEqual(check.keptParam(), [{ k: 'Numkey', keep: true }, { k: 'strkey', keep: true }])

  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey').drop()
  ])

  t.deepEqual(check.toDTO(), {Numkey: true, strkey: true})
  t.deepEqual(check.keptParam(), [{ k: 'Numkey', keep: true }])

  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey').drop().undrop()
  ])

  t.deepEqual(check.toDTO(), {Numkey: true, strkey: true})
  t.deepEqual(check.keptParam(), [{ k: 'Numkey', keep: true }, { k: 'strkey', keep: true }])

  t.plan(7)
  t.end()
})

test('Checks.Multi', async function(t) {
  let check = Checks.Multi([
      Checks.Num('Numkey'),
      Checks.Str('strkey')
    ])
    , store = new Store()

  t.ok(await check.validate(store, { Numkey: 42, strkey: 'toto' }))
  t.ok(await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }))

  await check.validate(store, { })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(),'InvalidRuleError: invalid result while processing NumberCheck[k:Numkey] for param {}')
  })

  await check.validate(store, { Numkey: 42 })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: invalid result while processing StrCheck[k:strkey] for param {"Numkey":42}')
  })

  await check.validate(store, { strkey: 'toto' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: invalid result while processing NumberCheck[k:Numkey] for param {"strkey":"toto"}')
  })

  t.plan(8)
  t.end()
})

test('Checks.None', async function(t) {
  let check = Checks.None()
    , store = new Store()

  t.ok(await check.validate(store, { }))
  t.ok(await check.validate(store, { key: true }))
  t.ok(await check.validate(store, { key: false }))
  t.ok(await check.validate(store, { key: 'foo' }))
  t.ok(await check.validate(store, { foo: 42 }))
  t.ok(await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  t.plan(6)
  t.end()
})

test('Checks.Id', async function(t) {
  let check = Checks.Id('id', {prefix: 'test: '})
    , store = new Store()
  await store.set('test: 42', {id: '42', foo: 'bar'})

  t.ok(await check.validate(store, { id: '42' }))

  await check.validate(store, { id: '666' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: invalid id: 666 does not exist')
  })

  await check.validate(store, { foo: true })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: invalid id: undefined does not exist')
  })

  t.plan(5)
  t.end()
})

test('Checks.Id.asNew()', async function(t) {
  let algo = () => '42'
    , check = Checks.Id('id', {prefix: 'test: ', algo}).asNew()
    , store = new Store()

  t.ok(await check.validate(store, { foo: true }))

  await store.set('test: 42', {id: '42', foo: 'bar'})

  await check.validate(store, { foo: true })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: should not be in store id 42')
  })

  await check.validate(store, { id: '42' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: should not contain asNew param id')
  })

  await check.validate(store, { id: '666' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: should not contain asNew param id')
  })

  t.plan(7)
  t.end()
})

test('Checks.Bool', async function(t) {
  let check = Checks.Bool('key')
    , store = new Store()

  t.ok(await check.validate(store, { key: true }))
  t.ok(await check.validate(store, { key: false }))
  t.notOk(await check.validate(store, { key: 'foo' }))
  t.notOk(await check.validate(store, { foo: true }))
  t.plan(4)
  t.end()
})

test('Checks.Num', async function(t) {
  let check = Checks.Num('key')
    , store = new Store()

  t.ok(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: 'foo' }))
  t.notOk(await check.validate(store, { foo: 42 }))
  t.plan(3)
  t.end()
})

test('Checks.Str', async function(t) {
  let check = Checks.Str('key')
    , store = new Store()

  t.ok(await check.validate(store, { key: 'foo' }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(3)
  t.end()
})

test('Checks.Str.asDate', async function(t) {
  let check = Checks.Str('key').asDate()
    , store = new Store()
    , p

  t.ok(await check.validate(store, p = { key: '2018-05-19' }))
  t.deepEqual(p, { key: new Date(1526688000000)})

  t.ok(await check.validate(store, p = { key: '2018-05-19T06:04:29' }))
  t.deepEqual(p, { key: new Date(1526709869000)})

  t.ok(await check.validate(store, p = { key: '2018-05-19T06:04:29.945Z' }))
  t.deepEqual(p, { key: new Date(1526709869945)})

  t.notOk(await check.validate(store, { key: 1526688000000 })) // we check it is a string so this is invalid
  t.notOk(await check.validate(store, { key: '1526709869945' }))
  t.notOk(await check.validate(store, { key: 'plop' }))

  t.plan(9)
  t.end()
})

test('Checks.Str.predicate', async function(t) {
  let check = Checks.Str('key').predicate(s => s.indexOf('f') === 0 )
    , store = new Store()

  t.ok(await check.validate(store, { key: 'foo' }))
  t.notOk(await check.validate(store, { key: 'bar' }))
  t.notOk(await check.validate(store, { key: 'another' }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(5)
  t.end()
})

test('Checks.Str.parse', async function(t) {
  let check = Checks.Str('key').parse(s => s.toUpperCase())
    , store = new Store()
    , p

  t.ok(await check.validate(store, p = { key: 'foo' }))
  t.deepEqual(p, { key: 'FOO' })

  t.ok(await check.validate(store, p = { key: 'bar' }))
  t.deepEqual(p, { key: 'BAR' })

  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(6)
  t.end()
})

test('Checks.Str.regex', async function(t) {
  let check = Checks.Str('key').regex(/^f/)
    , store = new Store()

  t.ok(await check.validate(store, { key: 'foo' }))
  t.notOk(await check.validate(store, { key: 'bar' }))
  t.notOk(await check.validate(store, { key: 'another' }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(5)
  t.end()
})

test('Checks.Str.regex.crypto', async function(t) {
  let check = Checks.Str('key').regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,}$/).crypto(x => x)
    , store = new Store()

  t.ok(await check.validate(store, { key: 'FooBar42' }))
  t.ok(await check.validate(store, { key: 'xD5Ae8f4ysFG9luB' }))
  t.notOk(await check.validate(store, { key: 'bar' }))
  t.notOk(await check.validate(store, { key: 'another' }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(6)
  t.end()
})

test('Checks.Str.regex.crypto.check', async function(t) {
  let check = Checks.Str('key')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,}$/)
    .crypto(x => x)
    .check(async (store, param) => {
      let { userId } = param
        , user = await store.get(userId)
      if (user) return user.password
    })
    , store = new Store()

  store.set('foo', { password: 'FooBar42' })
  store.set('bar', { password: 'xD5Ae8f4ysFG9luB' })

  t.ok(await check.validate(store, { userId: 'foo', key: 'FooBar42' }))
  t.ok(await check.validate(store, { userId: 'bar', key: 'xD5Ae8f4ysFG9luB' }))
  t.notOk(await check.validate(store, { userId: 'foo' }))
  t.notOk(await check.validate(store, { userId: 'bar' }))
  t.notOk(await check.validate(store, { userId: 'foo', key: 42 }))
  t.notOk(await check.validate(store, { userId: 'bar', key: 'another' }))
  t.notOk(await check.validate(store, { key: 'another' }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(9)
  t.end()
})

test('Checks.Enum', async function(t) {
  let check = Checks.Enum('key', [ 'foo', 'bar', 'another' ])
    , store = new Store()

  t.ok(await check.validate(store, { key: 'foo' }))
  t.ok(await check.validate(store, { key: 'another' }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(4)
  t.end()
})

test('Checks.Struct', async function(t) {
  let check = Checks.Struct('key', [ Checks.Num('int'), Checks.Str('str'), Checks.Enum('rank', [ 'S', 'A', 'B' ]) ])
    , store = new Store()

  t.ok(await check.validate(store, { key: { int: 42, str: 'plop', rank: 'S'} }))
  t.ok(await check.validate(store, { key: { int: 666, str: 'foobar', rank: 'B'} }))
  t.notOk(await check.validate(store, { key: { int: 42, str: 'plop', rank: 'K'} }))
  t.notOk(await check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }))
  t.notOk(await check.validate(store, { key: { int: 'yo', str: 'plop', rank: 'S'} }))
  t.notOk(await check.validate(store, { key: { str: 'plop', rank: 'S'} }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(9)
  t.end()
})

test('Checks.List', async function(t) {
  let check = Checks.List(Checks.Str('key'))
    , store = new Store()

  t.ok(await check.validate(store, { key: [ 'foo' ] }))
  t.ok(await check.validate(store, { key: [ 'foo', 'bar' ] }))
  t.ok(await check.validate(store, { key: [ 'another', 'foo', 'bar' ] }))
  t.ok(await check.validate(store, { key: [ ] }))
  t.notOk(await check.validate(store, { key: [ 42 ] }))
  t.notOk(await check.validate(store, { key: [ 42, 666 ] }))
  t.notOk(await check.validate(store, { key: [ 42, 'plop' ] }))
  t.notOk(await check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))
  t.notOk(await check.validate(store, { foo: 'bar' }))
  t.plan(11)
  t.end()
})
