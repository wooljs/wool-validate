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

async function testAsyncException(t, r, m) {
  await r
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), m)
  })
}

test('Checks.Multi Error on param, toDTO, keptParam, drop,...', async function(t) {
  t.throws(() => Checks.Multi([ 'plop' ]), /^InvalidRuleError/)
  let check
  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey')
  ])

  t.deepEqual(check.toDTO(), {Numkey: true, strkey: true})
  t.deepEqual(check.keptParam(), [{ k: 'Numkey', keep: true, presence: 1 }, { k: 'strkey', keep: true, presence: 1 }])

  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey').drop()
  ])

  t.deepEqual(check.toDTO(), {Numkey: true, strkey: true})
  t.deepEqual(check.keptParam(), [{ k: 'Numkey', keep: true, presence: 1 }])

  check = Checks.Multi([
    Checks.Num('Numkey'),
    Checks.Str('strkey').drop().undrop()
  ])

  t.deepEqual(check.toDTO(), {Numkey: true, strkey: true})
  t.deepEqual(check.keptParam(), [{ k: 'Numkey', keep: true, presence: 1 }, { k: 'strkey', keep: true, presence: 1 }])

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

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.check.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.check.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.check.should.be.present(NumberCheck[k:Numkey])')

  t.plan(8)
  t.end()
})

test('Checks.Multi optional', async function(t) {
  let check = Checks.Multi([
      Checks.Num('Numkey'),
      Checks.Str('strkey'),
      Checks.Str('foo').optional()
    ])
    , store = new Store()

  t.ok(await check.validate(store, { Numkey: 42, strkey: 'toto' }))
  t.ok(await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }))

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.check.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.check.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.check.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42, strkey: 'toto', foo: false }), 'InvalidRuleError: param.check.multi.invalid.for.param(StrCheck[k:foo], {"Numkey":42,"strkey":"toto","foo":false})')

  t.plan(10)
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

test('Checks.Any', async function(t) {
  let check = Checks.Any()
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
  let check = Checks.Id('id')
    , store = new Store()

  await store.set('42', {id: '42', foo: 'bar'})
  t.ok(await check.validate(store, {id: '42', foo: true }))
  t.plan(1)
  t.end()
})

test('Checks.Id prefix', async function(t) {
  let check = Checks.Id('id', {prefix: 'test: '})
    , store = new Store()
  await store.set('test: 42', {id: '42', foo: 'bar'})

  t.ok(await check.validate(store, { id: '42' }))

  await check.validate(store, { id: '666' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.check.should.exists.in.store(ValidId[k:id], 666)')
  })

  await check.validate(store, { foo: true })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.check.should.be.present(ValidId[k:id])')
  })

  t.ok(check.isOne('test: 42'))

  t.plan(6)
  t.end()
})

test('Checks.Id.asNew()', async function(t) {
  let check = Checks.Id('id', {prefix: 'test: '}).asNew()
    , store = new Store()
    , p

  t.ok(await check.validate(store, p = { foo: true }))
  t.ok('id' in p)
  t.ok(/^test: /.test(check.as(p.id)))
  t.plan(3)
  t.end()
})

test('Checks.Id.asNew() algo', async function(t) {
  let algo = () => '42'
    , check = Checks.Id('id', {prefix: 'test: ', algo}).asNew()
    , store = new Store()

  t.ok(await check.validate(store, { foo: true }))

  await store.set('test: 42', {id: '42', foo: 'bar'})

  await check.validate(store, { foo: true })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.check.should.not.be.in.store(NotExistsId[k:id], 42)')
  })

  await check.validate(store, { id: '42' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.check.should.be.absent(NotExistsId[k:id])')
  })

  await check.validate(store, { id: '666' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.check.should.be.absent(NotExistsId[k:id])')
  })

  t.equal(check.presence, Checks.ParamCheck.Presence.absent)

  t.plan(8)
  t.end()
})

test('Checks.Bool', async function(t) {
  let check = Checks.Bool('key')
    , store = new Store()

  t.ok(await check.validate(store, { key: true }))
  t.ok(await check.validate(store, { key: false }))
  t.notOk(await check.validate(store, { key: 'foo' }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(BoolCheck[k:key])')

  t.plan(5)
  t.end()
})

test('Checks.Num', async function(t) {
  let check = Checks.Num('key')
    , store = new Store()

  t.ok(await check.validate(store, { key: 42 }))
  t.ok(await check.validate(store, { key: 3.14159 }))
  t.notOk(await check.validate(store, { key: 'foo' }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(NumberCheck[k:key])')

  t.plan(5)
  t.end()
})

test('Checks.Num.predicate', async function(t) {
  let check = Checks.Num('key').predicate(x => Number.isInteger(Math.sqrt(x)))
    , store = new Store()

  t.ok(await check.validate(store, { key: 1 }))
  t.ok(await check.validate(store, { key: 4 }))
  t.ok(await check.validate(store, { key: 9 }))
  t.notOk(await check.validate(store, { key: 7 }))
  t.notOk(await check.validate(store, { key: [] }))
  t.notOk(await check.validate(store, { key: 'foo' }))
  t.notOk(await check.validate(store, { key: true }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(PredicateNumberCheck[k:key])')

  t.plan(9)
  t.end()
})

test('Checks.Num.asInt', async function(t) {
  let check = Checks.Num('key').asInt()
    , store = new Store()

  t.ok(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: 3.14159 }))
  t.notOk(await check.validate(store, { key: 'foo' }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(IntegerCheck[k:key])')

  t.plan(5)
  t.end()
})

test('Checks.Num.min', async function(t) {
  let check = Checks.Num('key').min(-1.5)
    , store = new Store()

  t.ok(await check.validate(store, { key: 42 }))
  t.ok(await check.validate(store, { key: 0 }))
  t.ok(await check.validate(store, { key: -1 }))
  t.ok(await check.validate(store, { key: -1.5 }))
  t.ok(await check.validate(store, { key: 3.14159 }))
  t.ok(await check.validate(store, { key: 142e12 }))
  t.notOk(await check.validate(store, { key: -1.6 }))
  t.notOk(await check.validate(store, { key: -666 }))
  t.notOk(await check.validate(store, { key: 'foo' }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(MinCheck[k:key])')

  t.plan(11)
  t.end()
})

test('Checks.Num.max', async function(t) {
  let check = Checks.Num('key').max(42)
    , store = new Store()

  t.ok(await check.validate(store, { key: 42 }))
  t.ok(await check.validate(store, { key: 17 }))
  t.ok(await check.validate(store, { key: 0 }))
  t.ok(await check.validate(store, { key: 3.14159 }))
  t.ok(await check.validate(store, { key: -66 }))
  t.notOk(await check.validate(store, { key: 42.1 }))
  t.notOk(await check.validate(store, { key: 142 }))
  t.notOk(await check.validate(store, { key: 142e12 }))
  t.notOk(await check.validate(store, { key: 'foo' }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(MaxCheck[k:key])')

  t.plan(11)
  t.end()
})

test('Checks.Num.asInt.min.max', async function(t) {
  let check = Checks.Num('key').asInt().min(0).max(4.5)
    , store = new Store()

  t.ok(await check.validate(store, { key: 4 }))
  t.ok(await check.validate(store, { key: 3 }))
  t.ok(await check.validate(store, { key: 2 }))
  t.ok(await check.validate(store, { key: 1 }))
  t.ok(await check.validate(store, { key: 0 }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: 3.14159 }))
  t.notOk(await check.validate(store, { key: 4.00001 }))
  t.notOk(await check.validate(store, { key: 4+1e-15 }))
  t.notOk(await check.validate(store, { key: 4.5 }))
  t.notOk(await check.validate(store, { key: 'foo' }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(MaxCheck[k:key])')

  t.plan(13)
  t.end()
})

test('Checks.Str', async function(t) {
  let check = Checks.Str('key')
    , store = new Store()

  t.ok(await check.validate(store, { key: 'foo' }))
  t.notOk(await check.validate(store, { key: 42 }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(StrCheck[k:key])')

  t.plan(4)
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

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(PredicateStrCheck[k:key])')

  t.plan(6)
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

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(ParseStrCheck[k:key])')

  t.plan(7)
  t.end()
})

test('Checks.Str.regex', async function(t) {
  let check = Checks.Str('key').regex(/^f/)
    , store = new Store()

  t.ok(await check.validate(store, { key: 'foo' }))
  t.notOk(await check.validate(store, { key: 'bar' }))
  t.notOk(await check.validate(store, { key: 'another' }))
  t.notOk(await check.validate(store, { key: 42 }))
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(RegexCheck[k:key])')
  t.plan(6)
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

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(CryptoCheck[k:key])')

  t.plan(7)
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

  await testAsyncException(t, check.validate(store, { userId: 'foo' }), 'InvalidRuleError: param.check.should.be.present(CryptoHashCheck[k:key])')
  await testAsyncException(t, check.validate(store, { userId: 'bar' }), 'InvalidRuleError: param.check.should.be.present(CryptoHashCheck[k:key])')

  t.notOk(await check.validate(store, { userId: 'foo', key: 42 }))
  t.notOk(await check.validate(store, { userId: 'bar', key: 'another' }))
  t.notOk(await check.validate(store, { key: 'another' }))
  t.notOk(await check.validate(store, { key: 42 }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(CryptoHashCheck[k:key])')

  t.plan(12)
  t.end()
})

test('Checks.Enum', async function(t) {
  let check = Checks.Enum('key', [ 'foo', 'bar', 'another' ])
    , store = new Store()

  t.ok(await check.validate(store, { key: 'foo' }))
  t.ok(await check.validate(store, { key: 'another' }))
  t.notOk(await check.validate(store, { key: 42 }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(EnumCheck[k:key])')

  t.plan(5)
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

  await testAsyncException(t, check.validate(store, { key: { str: 'plop', rank: 'S'} }), 'InvalidRuleError: param.check.should.be.present(NumberCheck[k:key.int])')
  
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(StructCheck[k:key])')

  t.plan(11)
  t.end()
})

test('Checks.Struct + Struct', async function(t) {
  let check = Checks.Struct('key', [ Checks.Str('str'), Checks.Struct('sub', [ Checks.Num('int'), Checks.Enum('rank', [ 'S', 'A', 'B' ]) ]) ])
    , store = new Store()

  t.ok(await check.validate(store, { key: { str: 'plop', sub: { int: 42, rank: 'S'} } }))

  await testAsyncException(t, check.validate(store, { key: { str: 'plop' } }), 'InvalidRuleError: param.check.should.be.present(StructCheck[k:key.sub])')
  await testAsyncException(t, check.validate(store, { key: { str: 'plop', sub: { int: 42 } } }), 'InvalidRuleError: param.check.should.be.present(EnumCheck[k:key.sub.rank])')

  t.plan(5)
  t.end()
})

test('Checks.List Str.regex', async function(t) {
  let check = Checks.List('key', Checks.Str().regex(/^[a-z]+$/))
    , store = new Store()

  t.ok(await check.validate(store, { key: [ ] }))
  t.ok(await check.validate(store, { key: [ 'foo' ] }))
  t.ok(await check.validate(store, { key: [ 'foo', 'bar' ] }))
  t.ok(await check.validate(store, { key: [ 'another', 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: [ '##yo"' ] }))
  t.notOk(await check.validate(store, { key: [ 42 ] }))
  t.notOk(await check.validate(store, { key: [ 42, 666 ] }))
  t.notOk(await check.validate(store, { key: [ 42, 'plop' ] }))
  t.notOk(await check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(ListCheck[k:key])')

  t.plan(13)
  t.end()
})

test('Checks.List Num', async function(t) {
  let check = Checks.List('key', Checks.Num().asInt())
    , store = new Store()

  t.ok(await check.validate(store, { key: [ ] }))
  t.ok(await check.validate(store, { key: [ 42 ] }))
  t.ok(await check.validate(store, { key: [ 42, 666 ] }))
  t.notOk(await check.validate(store, { key: [ 42, 666, 3.14159 ] }))
  t.notOk(await check.validate(store, { key: [ 'foo' ] }))
  t.notOk(await check.validate(store, { key: [ 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: [ 'another', 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: [ 42, 'plop' ] }))
  t.notOk(await check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(ListCheck[k:key])')

  t.plan(13)
  t.end()
})

test('Checks.Tuple Str Num', async function(t) {
  let check = Checks.Tuple('key', [ Checks.Str().regex(/^[a-z]+$/), Checks.Num().asInt() ])
    , store = new Store()

  t.ok(await check.validate(store, { key: [ 'plop', 42 ] }))
  t.ok(await check.validate(store, { key: [ 'bar', -1e10 ] }))
  t.notOk(await check.validate(store, { key: [ 'foo', 3.14159 ] }))
  t.notOk(await check.validate(store, { key: [ 'bar', -1e10, true ] }))
  t.notOk(await check.validate(store, { key: [ ] }))
  t.notOk(await check.validate(store, { key: [ 42 ] }))
  t.notOk(await check.validate(store, { key: [ 42, 666, 3.14159 ] }))
  t.notOk(await check.validate(store, { key: [ 'foo' ] }))
  t.notOk(await check.validate(store, { key: [ 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: [ 'another', 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(TupleCheck[k:key])')

  t.plan(15)
  t.end()
})

test('Checks.Tuple Str Num predicate', async function(t) {
  let check = Checks.Tuple('key', [ Checks.Str().regex(/^[a-z]+$/), Checks.Num().asInt() ]).predicate(([a, b]) => a.length === b)
    , store = new Store()

  t.ok(await check.validate(store, { key: [ 'plop', 4 ] }))
  t.ok(await check.validate(store, { key: [ 'bar', 3 ] }))
  t.notOk(await check.validate(store, { key: [ 'foo', 0 ] }))
  t.notOk(await check.validate(store, { key: [ 'foo', 3.14159 ] }))
  t.notOk(await check.validate(store, { key: [ 'bar', -1e10, true ] }))
  t.notOk(await check.validate(store, { key: [ ] }))
  t.notOk(await check.validate(store, { key: [ 42 ] }))
  t.notOk(await check.validate(store, { key: [ 42, 666, 3.14159 ] }))
  t.notOk(await check.validate(store, { key: [ 'foo' ] }))
  t.notOk(await check.validate(store, { key: [ 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: [ 'another', 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(PredicateTupleCheck[k:key])')

  t.plan(16)
  t.end()
})

test('Checks.Tuple Enum Num Bool', async function(t) {
  let check = Checks.Tuple('key', [ Checks.Enum('', ['foo', 'bar']), Checks.Num().min(0), Checks.Bool() ])
    , store = new Store()

  t.ok(await check.validate(store, { key: [ 'bar', 0, true ] }))
  t.ok(await check.validate(store, { key: [ 'foo', 3.14159, false ] }))
  t.notOk(await check.validate(store, { key: [ 'bar', -1e10, true ] }))
  t.notOk(await check.validate(store, { key: [ 'plop', 42, false ] }))
  t.notOk(await check.validate(store, { key: [ 'foo', 3.14159, undefined ] }))
  t.notOk(await check.validate(store, { key: [ ] }))
  t.notOk(await check.validate(store, { key: [ 42 ] }))
  t.notOk(await check.validate(store, { key: [ 42, 666, 3.14159 ] }))
  t.notOk(await check.validate(store, { key: [ 'foo' ] }))
  t.notOk(await check.validate(store, { key: [ 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: [ 'another', 'foo', 'bar' ] }))
  t.notOk(await check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(TupleCheck[k:key])')

  t.plan(16)
  t.end()
})

test('Checks.Dict Str Num', async function(t) {
  let check = Checks.Dict('key', Checks.Tuple('', [ Checks.Str().regex(/^[a-z]+$/), Checks.Num().asInt() ]))
    , store = new Store()

  t.ok(await check.validate(store, { key: { } }))
  t.ok(await check.validate(store, { key: { foo: 12 } }))
  t.ok(await check.validate(store, { key: { bar: 1654123 } }))
  t.ok(await check.validate(store, { key: { foo: 42, bar: 666, plop: 1e10, another: 0, last: -12 } }))
  t.notOk(await check.validate(store, { key: { A1: 42 } }))
  t.notOk(await check.validate(store, { key: { foo: 42, bar: 666, plop: 1e10, another: 0, '$bad': -12 } }))
  t.notOk(await check.validate(store, { key: { foo: 42, bar: 3.14159 } }))
  t.notOk(await check.validate(store, { key: { foo: 'plop', bar: 3 } }))
  t.notOk(await check.validate(store, { key: [ ] }))
  t.notOk(await check.validate(store, { key: [ 'plop' ] }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(DictCheck[k:key])')
  t.plan(14)
  t.end()
})

test('Checks.Dict Enum Num', async function(t) {
  let check = Checks.Dict('key', Checks.Tuple('', [ Checks.Enum('', ['foo', 'bar']), Checks.Num().min(0) ]))
    , store = new Store()

  t.ok(await check.validate(store, { key: { } }))
  t.ok(await check.validate(store, { key: { foo: 12 } }))
  t.ok(await check.validate(store, { key: { bar: 1.654123 } }))
  t.ok(await check.validate(store, { key: { foo: 42, bar: 3.14159 } }))
  t.notOk(await check.validate(store, { key: { foo: 42, bar: -1 } }))
  t.notOk(await check.validate(store, { key: { foo: 'plop', bar: 3.14159 } }))
  t.notOk(await check.validate(store, { key: { foo: 'plop', bar: -1 } }))
  t.notOk(await check.validate(store, { key: [ ] }))
  t.notOk(await check.validate(store, { key: [ 'plop' ] }))
  t.notOk(await check.validate(store, { key: 42 }))
  t.notOk(await check.validate(store, { key: true }))
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.check.should.be.present(DictCheck[k:key])')
  t.plan(13)
  t.end()
})