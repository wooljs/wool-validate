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

async function testAsyncException(t, r, m, IRE=true) {
  let s = new Error().stack
  try {
    await r
    t.fail('should throw: '+m)
  } catch(e) {
    if (IRE) t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), m, s)
  }
}

test('Checks.InvalidRuleError', async function(t) {
  try {
    throw new Checks.InvalidRuleError()
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: undefined')
  }
  try {
    throw new Checks.InvalidRuleError('x')
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: x')
  }
  try {
    throw new Checks.InvalidRuleError('x', '')
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: x()')
  }
  try {
    throw new Checks.InvalidRuleError('', '')
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: ()')
  }
  try {
    throw new Checks.InvalidRuleError('', '', '')
  } catch(e) {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: (, )')
  }
  t.plan(10)
  t.end()
})

test('Checks.Multi Error on param, toDTO, keptParam, drop,...', async function(t) {
  t.throws(() => Checks.Multi([ 'plop' ]), /^InvalidRuleError/)
  let check

  check = Checks.Multi()
  t.deepEqual(check.toDTO(), {})

  check = Checks.Multi([])
  t.deepEqual(check.toDTO(), {})
  
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

  t.plan(9)
  t.end()
})

test('Checks.Multi', async function(t) {
  let check = Checks.Multi([
      Checks.Num('Numkey'),
      Checks.Str('strkey')
    ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }))
  t.ok('undefined' === typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }))

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

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

  t.ok('undefined' === typeof await check.validate(store, { Numkey: 42, strkey: 'toto' }))
  t.ok('undefined' === typeof await check.validate(store, { Numkey: 42, strkey: 'toto', key: false }))

  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42 }), 'InvalidRuleError: param.should.be.present(StrCheck[k:strkey])')

  await testAsyncException(t, check.validate(store, { strkey: 'toto' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:Numkey])')

  await testAsyncException(t, check.validate(store, { Numkey: 42, strkey: 'toto', foo: false }), 'InvalidRuleError: param.invalid.str(StrCheck[k:foo], false)')

  await testAsyncException(t, check.validate(store, { Numkey: 42, strkey: 'toto', foo: undefined }), 'InvalidRuleError: param.invalid.str(StrCheck[k:foo], )')

  t.plan(12)
  t.end()
})

test('Checks.Has', async function(t) {
  let check = Checks.Has('key')
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  
  await testAsyncException(t, check.validate(store, { }), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')
  await testAsyncException(t, check.validate(store, { foo: 42 }), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')
  await testAsyncException(t, check.validate(store, { bar: true, foo: 'bar'}), 'InvalidRuleError: param.should.be.present(ParamCheck[k:key])')

  check.presence = 42
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.value.presence(ParamCheck[k:key], 42)')

  t.plan(12)
  t.end()
})

test('Checks.None', async function(t) {
  let check = Checks.None()
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { foo: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  t.plan(6)
  t.end()
})

test('Checks.Any', async function(t) {
  let check = Checks.Any()
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { }))
  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { foo: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: true, bar: 42, foo: 'bar' }))
  t.plan(6)
  t.end()
})

test('Checks.Id', async function(t) {
  let check = Checks.Id('id')
    , store = new Store()

  await store.set('42', {id: '42', foo: 'bar'})
  t.ok('undefined' === typeof await check.validate(store, {id: '42', foo: true }))
  t.plan(1)
  t.end()
})

test('Checks.Id prefix', async function(t) {
  let check = Checks.Id('id', {prefix: 'test: '})
    , store = new Store()
  await store.set('test: 42', {id: '42', foo: 'bar'})

  t.ok('undefined' === typeof await check.validate(store, { id: '42' }))

  await check.validate(store, { id: '666' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.should.exists.in.store(ValidId[k:id], 666)')
  })

  await check.validate(store, { foo: true })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.present(ValidId[k:id])')
  })

  t.ok(check.isOne('test: 42'))

  t.plan(6)
  t.end()
})

test('Checks.Id.asNew()', async function(t) {
  let check = Checks.Id('id', {prefix: 'test: '}).asNew()
    , store = new Store()
    , p, d = new Date()

  t.ok('undefined' === typeof await check.validate(store, p = { foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '0'+ d.getTime().toString(16)+'0000')
  t.ok('undefined' === typeof await check.validate(store, p = { foo: true }, d))
  t.ok('id' in p)
  t.deepEqual(p.id, '0'+ d.getTime().toString(16)+'0001')
  t.ok('undefined' === typeof await check.validate(store, p = { foo: true }))
  t.ok('id' in p)
  t.ok(/^test: /.test(check.as(p.id)))
  t.plan(9)
  t.end()
})

test('Checks.Id.asNew() algo', async function(t) {
  let algo = () => '42'
    , check = Checks.Id('id', {prefix: 'test: ', algo}).asNew()
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { foo: true }))

  await store.set('test: 42', {id: '42', foo: 'bar'})

  await check.validate(store, { foo: true })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.should.not.be.in.store(NotExistsId[k:id], 42)')
  })

  await check.validate(store, { id: '42' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(NotExistsId[k:id])')
  })

  await check.validate(store, { id: '666' })
  .then(()=> t.fail('should throw') )
  .catch(e => {
    t.ok(e instanceof Checks.InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: param.should.be.absent(NotExistsId[k:id])')
  })

  t.equal(check.presence, Checks.ParamCheck.Presence.absent)

  t.plan(8)
  t.end()
})

test('Checks.Bool', async function(t) {
  let check = Checks.Bool('key')
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  t.ok('undefined' === typeof await check.validate(store, { key: false }))
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.bool(BoolCheck[k:key], foo)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(BoolCheck[k:key])')

  t.plan(6)
  t.end()
})

test('Checks.Bool.predicate', async function(t) {
  let check = Checks.Bool('key').predicate(async(x, store) => x && await store.has('key'))
    , store = new Store()

  await store.set('key', 'plop')

  t.ok('undefined' === typeof await check.validate(store, { key: true }))
  await testAsyncException(t, check.validate(store, { key: false }), 'InvalidRuleError: param.invalid.predicate(BoolCheck[k:key], false, async(x, store) => x && await store.has(\'key\'))')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.bool(BoolCheck[k:key], foo)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(BoolCheck[k:key])')

  t.plan(7)
  t.end()
})

test('Checks.Num', async function(t) {
  let check = Checks.Num('key')
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 3.14159 }))
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(6)
  t.end()
})

test('Checks.Num.predicate', async function(t) {
  let check = Checks.Num('key').predicate(x => Number.isInteger(Math.sqrt(x)))
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 1 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 4 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 9 }))
  await testAsyncException(t, check.validate(store, { key: 7 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 7, x => Number.isInteger(Math.sqrt(x)))')
  await testAsyncException(t, check.validate(store, { key: [] }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], [])')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(13)
  t.end()
})

test('Checks.Num.asInt', async function(t) {
  let check = Checks.Num('key').asInt()
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  await testAsyncException(t, check.validate(store, { key: 3.14159 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 3.14159, function isInteger() { [native code] })')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(7)
  t.end()
})

test('Checks.Num.asDate', async function(t) {
  let check = Checks.Num('key').asDate()
    , store = new Store()
    , p

  t.ok('undefined' === typeof await check.validate(store, p = { key: 42 }))
  t.deepEqual(p.key.toISOString(), '1970-01-01T00:00:00.042Z')

  t.ok('undefined' === typeof await check.validate(store, p = { key: 1565192858493 }))
  t.deepEqual(p.key.toISOString(), '2019-08-07T15:47:38.493Z')

  await testAsyncException(t, check.validate(store, { key: 3.14159 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 3.14159, function isInteger() { [native code] })')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(TimestampCheck[k:key])')

  t.plan(10)
  t.end()
})

test('Checks.Num.min', async function(t) {
  let check = Checks.Num('key').min(-1.5)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 0 }))
  t.ok('undefined' === typeof await check.validate(store, { key: -1 }))
  t.ok('undefined' === typeof await check.validate(store, { key: -1.5 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 3.14159 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 142e12 }))
  await testAsyncException(t, check.validate(store, { key: -1.6 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], -1.6, x >= -1.5)')
  await testAsyncException(t, check.validate(store, { key: -666 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], -666, x >= -1.5)')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(14)
  t.end()
})

test('Checks.Num.max', async function(t) {
  let check = Checks.Num('key').max(42)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 42 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 17 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 0 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 3.14159 }))
  t.ok('undefined' === typeof await check.validate(store, { key: -66 }))
  await testAsyncException(t, check.validate(store, { key: 42.1 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 42.1, x <= 42)')
  await testAsyncException(t, check.validate(store, { key: 142 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 142, x <= 42)')
  await testAsyncException(t, check.validate(store, { key: 142e12 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 142000000000000, x <= 42)')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(15)
  t.end()
})

test('Checks.Num.asInt.min.max', async function(t) {
  let check = Checks.Num('key').asInt().min(0).max(4.5)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 4 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 3 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 2 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 1 }))
  t.ok('undefined' === typeof await check.validate(store, { key: 0 }))
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 42, x <= 4.5)')
  await testAsyncException(t, check.validate(store, { key: 3.14159 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 3.14159, function isInteger() { [native code] })')
  await testAsyncException(t, check.validate(store, { key: 4.00001 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 4.00001, function isInteger() { [native code] })')
  await testAsyncException(t, check.validate(store, { key: 4+1e-15 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 4.000000000000001, function isInteger() { [native code] })')
  await testAsyncException(t, check.validate(store, { key: 4.5 }), 'InvalidRuleError: param.invalid.predicate(NumberCheck[k:key], 4.5, function isInteger() { [native code] })')
  await testAsyncException(t, check.validate(store, { key: 'foo' }), 'InvalidRuleError: param.invalid.num(NumberCheck[k:key], "foo")')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(NumberCheck[k:key])')

  t.plan(19)
  t.end()
})

test('Checks.Str', async function(t) {
  let check = Checks.Str('key')
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StrCheck[k:key])')

  t.plan(5)
  t.end()
})

test('Checks.Str.asDate', async function(t) {
  let check = Checks.Str('key').asDate()
    , store = new Store()
    , p

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19' }))
  t.deepEqual(p, { key: new Date(1526688000000)})

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19T06' }))
  t.deepEqual(p, { key: new Date(1526709600000)})

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19T06:04' }))
  t.deepEqual(p, { key: new Date(1526709840000)})

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19T06:04:29' }))
  t.deepEqual(p, { key: new Date(1526709869000)})

  t.ok('undefined' === typeof await check.validate(store, p = { key: '2018-05-19T06:04:29.945Z' }))
  t.deepEqual(p, { key: new Date(1526709869945)})

  await testAsyncException(t, check.validate(store, { key: 1526688000000 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 1526688000000)') // we check it is a string so this is invalid
  await testAsyncException(t, check.validate(store, { key: '1526709869945' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "1526709869945", isISODate())')
  await testAsyncException(t, check.validate(store, { key: 'plop' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "plop", isISODate())')

  t.plan(16)
  t.end()
})

test('Checks.Str.predicate', async function(t) {
  let check = Checks.Str('key').predicate(s => s.indexOf('f') === 0 )
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  await testAsyncException(t, check.validate(store, { key: 'bar' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "bar", s => s.indexOf(\'f\') === 0)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", s => s.indexOf(\'f\') === 0)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StrCheck[k:key])')

  t.plan(9)
  t.end()
})

test('Checks.Str.parse', async function(t) {
  let check = Checks.Str('key').transform(s => s.toUpperCase()).regex(/^[A-Z]+$/)
    , store = new Store()
    , p

  t.ok('undefined' === typeof await check.validate(store, p = { key: 'foo' }))
  t.deepEqual(p, { key: 'FOO' })

  t.ok('undefined' === typeof await check.validate(store, p = { key: 'bar' }))
  t.deepEqual(p, { key: 'BAR' })

  await testAsyncException(t, check.validate(store, { key: 'foo1' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "FOO1", /^[A-Z]+$/)')

  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StrCheck[k:key])')

  t.plan(10)
  t.end()
})

test('Checks.Str.regex', async function(t) {
  let check = Checks.Str('key').regex(/^f/)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  await testAsyncException(t, check.validate(store, { key: 'bar' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "bar", /^f/)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^f/)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StrCheck[k:key])')
  t.plan(9)
  t.end()
})

test('Checks.Str.regex.crypto', async function(t) {
  let check = Checks.Str('key').regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,}$/).crypto(x => x)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 'FooBar42' }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'xD5Ae8f4ysFG9luB' }))
  await testAsyncException(t, check.validate(store, { key: 'bar' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "bar", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(CryptoCheck[k:key])')

  t.plan(10)
  t.end()
})

test('Checks.Str.regex.crypto(hash,match)', async function(t) {
  let check = Checks.Str('key').regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z0-9]{8,}$/).crypto({hash: (x => x), match: (x => x) })
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 'FooBar42' }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'xD5Ae8f4ysFG9luB' }))
  await testAsyncException(t, check.validate(store, { key: 'bar' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "bar", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(CryptoCheck[k:key])')

  t.plan(10)
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

  t.ok('undefined' === typeof await check.validate(store, { userId: 'foo', key: 'FooBar42' }))
  t.ok('undefined' === typeof await check.validate(store, { userId: 'bar', key: 'xD5Ae8f4ysFG9luB' }))

  await testAsyncException(t, check.validate(store, { userId: 'foo' }), 'InvalidRuleError: param.should.be.present(CryptoHashCheck[k:key])')
  await testAsyncException(t, check.validate(store, { userId: 'bar' }), 'InvalidRuleError: param.should.be.present(CryptoHashCheck[k:key])')

  await testAsyncException(t, check.validate(store, { userId: 'foo', key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { userId: 'bar', key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 'another' }), 'InvalidRuleError: param.invalid.predicate(StrCheck[k:key], "another", /^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z0-9]{8,}$/)')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.str(StrCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(CryptoHashCheck[k:key])')

  t.plan(16)
  t.end()
})

test('Checks.Enum', async function(t) {
  let check = Checks.Enum('key', [ 'foo', 'bar', 'another' ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: 'foo' }))
  t.ok('undefined' === typeof await check.validate(store, { key: 'another' }))
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.enum(EnumCheck[k:key], 42)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(EnumCheck[k:key])')

  t.plan(6)
  t.end()
})

test('Checks.Struct', async function(t) {
  let check = Checks.Struct('key', [ Checks.Num('int'), Checks.Str('str'), Checks.Enum('rank', [ 'S', 'A', 'B' ]) ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: { int: 42, str: 'plop', rank: 'S'} }))
  t.ok('undefined' === typeof await check.validate(store, { key: { int: 666, str: 'foobar', rank: 'B'} }))
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 'plop', rank: 'K'} }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.enum(EnumCheck[k:rank], "K"))')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.str(StrCheck[k:str], 666))')
  await testAsyncException(t, check.validate(store, { key: { int: 'yo', str: 'plop', rank: 'S'} }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.num(NumberCheck[k:int], "yo"))')

  await testAsyncException(t, check.validate(store, { key: { str: 'plop', rank: 'S'} }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.should.be.present(NumberCheck[k:int]))')

  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.struct(StructCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.struct(StructCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(StructCheck[k:key])')

  t.plan(16)
  t.end()
})

test('Checks.Struct + Struct', async function(t) {
  let check = Checks.Struct('key', [ Checks.Str('str'), Checks.Struct('sub', [ Checks.Num('int'), Checks.Enum('rank', [ 'S', 'A', 'B' ]) ]) ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: { str: 'plop', sub: { int: 42, rank: 'S'} } }))

  await testAsyncException(t, check.validate(store, { key: { str: 'plop', sub: { int: 16, rank: 10} } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.struct.item(StructCheck[k:sub], param.invalid.enum(EnumCheck[k:rank], 10)))')

  await testAsyncException(t, check.validate(store, { key: { str: 'plop' } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.should.be.present(StructCheck[k:sub]))')
  await testAsyncException(t, check.validate(store, { key: { str: 'plop', sub: { int: 42 } } }), 'InvalidRuleError: param.invalid.struct.item(StructCheck[k:key], param.invalid.struct.item(StructCheck[k:sub], param.should.be.present(EnumCheck[k:rank])))')

  t.plan(7)
  t.end()
})

test('Checks.List Str.regex', async function(t) {
  let check = Checks.List('key', Checks.Str().regex(/^[a-z]+$/))
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: [ ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 'foo' ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 'foo', 'bar' ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 'another', 'foo', 'bar' ] }))
  await testAsyncException(t, check.validate(store, { key: [ '##yo"' ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.predicate(StrCheck[], "##yo\\"", /^[a-z]+$/))')
  await testAsyncException(t, check.validate(store, { key: [ 42 ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.str(42))')
  await testAsyncException(t, check.validate(store, { key: [ 42, 666 ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.str(42))')
  await testAsyncException(t, check.validate(store, { key: [ 'plop', 42 ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 1, param.invalid.str(42))')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: 'plop' }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], "plop")')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(ListCheck[k:key])')

  t.plan(22)
  t.end()
})

test('Checks.List Num', async function(t) {
  let check = Checks.List('key', Checks.Num().asInt())
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: [ ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 42 ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 42, 666 ] }))
  await testAsyncException(t, check.validate(store, { key: [ 42, 666, 3.14159 ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 2, param.invalid.predicate(NumberCheck[], 3.14159, function isInteger() { [native code] }))')
  await testAsyncException(t, check.validate(store, { key: [ 42, true, undefined ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 1, param.invalid.num(true))')
  await testAsyncException(t, check.validate(store, { key: [ 'foo' ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.num("foo"))')
  await testAsyncException(t, check.validate(store, { key: [ {}, 'bar' ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.num({}))')
  await testAsyncException(t, check.validate(store, { key: [ 'another', 'foo', 'bar' ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 0, param.invalid.num("another"))')
  await testAsyncException(t, check.validate(store, { key: [ 42, 'plop' ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 1, param.invalid.num("plop"))')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: 'plop' }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], "plop")')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.list(ListCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(ListCheck[k:key])')

  t.plan(25)
  t.end()
})

test('Checks.List Num predicate', async function(t) {
  let check = Checks.List('key', Checks.Num().asInt().predicate(x => { 
      if (x === 0) { throw new Error('zero')}; return x })).predicate(l => l.reduce((a,b)=>(a+b),0) < 10)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: [ 9 ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 1, 2, 3 ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 4, 4 ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 1, 1, 1, 1, 1, 1, 1, 1, 1 ] }))

  await testAsyncException(t, check.validate(store, { key: [ 0 ] }), 'Error: zero', false)

  await testAsyncException(t, check.validate(store, { key: [ 42, 666, 3.14159 ] }), 'InvalidRuleError: param.invalid.list.item.at(ListCheck[k:key], 2, param.invalid.predicate(NumberCheck[], 3.14159, function isInteger() { [native code] }))')
  await testAsyncException(t, check.validate(store, { key: [ 42 ] }), 'InvalidRuleError: param.invalid.predicate(ListCheck[k:key], [42], l => l.reduce((a,b)=>(a+b),0) < 10)')

  t.plan(9)
  t.end()
})


test('Checks.Tuple Str Num', async function(t) {
  let check = Checks.Tuple('key', [ Checks.Str().regex(/^[a-z]+$/), Checks.Num().asInt() ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: [ 'plop', 42 ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 'bar', -1e10 ] }))
  await testAsyncException(t, check.validate(store, { key: [ 'foo', 3.14159 ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.predicate(NumberCheck[], 3.14159, function isInteger() { [native code] }))')
  await testAsyncException(t, check.validate(store, { key: [ 'bar', -1e10, true ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["bar",-10000000000,true])')
  await testAsyncException(t, check.validate(store, { key: [ ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 0, [])')
  await testAsyncException(t, check.validate(store, { key: [ 42 ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 1, [42])')
  await testAsyncException(t, check.validate(store, { key: [ 42, 666, 3.14159 ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, [42,666,3.14159])')
  await testAsyncException(t, check.validate(store, { key: [ 'foo' ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 1, ["foo"])')
  await testAsyncException(t, check.validate(store, { key: [ 'foo', 'bar' ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.num("bar"))')
  await testAsyncException(t, check.validate(store, { key: [ 'another', 'foo', 'bar' ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["another","foo","bar"])')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(TupleCheck[k:key])')

  t.plan(26)
  t.end()
})

test('Checks.Tuple Str Num predicate', async function(t) {
  let check = Checks.Tuple('key', [ Checks.Str().regex(/^[a-z]+$/), Checks.Num().asInt() ]).predicate(([a, b]) => a.length === b)
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: [ 'plop', 4 ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 'bar', 3 ] }))
  await testAsyncException(t, check.validate(store, { key: [ 'foo', 0 ] }), 'InvalidRuleError: param.invalid.predicate(TupleCheck[k:key], ["foo",0], ([a, b]) => a.length === b)')
  await testAsyncException(t, check.validate(store, { key: [ 'foo', 3.14159 ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.predicate(NumberCheck[], 3.14159, function isInteger() { [native code] }))')
  await testAsyncException(t, check.validate(store, { key: [ 'bar', -1e10, true ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["bar",-10000000000,true])')
  await testAsyncException(t, check.validate(store, { key: [ ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 0, [])')
  await testAsyncException(t, check.validate(store, { key: [ 42 ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 1, [42])')
  await testAsyncException(t, check.validate(store, { key: [ 42, 666, 3.14159 ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, [42,666,3.14159])')
  await testAsyncException(t, check.validate(store, { key: [ 'foo' ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 1, ["foo"])')
  await testAsyncException(t, check.validate(store, { key: [ 'foo', 'bar' ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.num("bar"))')
  await testAsyncException(t, check.validate(store, { key: [ 'another', 'foo', 'bar' ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 2, 3, ["another","foo","bar"])')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(TupleCheck[k:key])')

  t.plan(28)
  t.end()
})

test('Checks.Tuple Enum Num Bool', async function(t) {
  let check = Checks.Tuple('key', [ Checks.Enum('', ['foo', 'bar']), Checks.Num().min(0), Checks.Bool() ])
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: [ 'bar', 0, true ] }))
  t.ok('undefined' === typeof await check.validate(store, { key: [ 'foo', 3.14159, false ] }))
  await testAsyncException(t, check.validate(store, { key: [ 'bar', -1e10, true ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 1, param.invalid.predicate(NumberCheck[], -10000000000, x >= 0))')
  await testAsyncException(t, check.validate(store, { key: [ 'bar', -1e10, true, undefined ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 4, ["bar",-10000000000,true,null])')
  await testAsyncException(t, check.validate(store, { key: [ 'plop', 42, false ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 0, param.invalid.enum("plop"))')
  await testAsyncException(t, check.validate(store, { key: [ 'foo', 3.14159, undefined ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 2, param.invalid.bool())')
  await testAsyncException(t, check.validate(store, { key: [ ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 0, [])')
  await testAsyncException(t, check.validate(store, { key: [ 42 ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 1, [42])')
  await testAsyncException(t, check.validate(store, { key: [ 42, 666, 3.14159 ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 0, param.invalid.enum(42))')
  await testAsyncException(t, check.validate(store, { key: [ 'foo' ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 1, ["foo"])')
  await testAsyncException(t, check.validate(store, { key: [ 'foo', 'bar' ] }), 'InvalidRuleError: param.invalid.tuple.wrong.length.expected.actual(TupleCheck[k:key], 3, 2, ["foo","bar"])')
  await testAsyncException(t, check.validate(store, { key: [ 'another', 'foo', 'bar' ] }), 'InvalidRuleError: param.invalid.tuple.item.at(TupleCheck[k:key], 0, param.invalid.enum("another"))')
  await testAsyncException(t, check.validate(store, { key: { int: 42, str: 666, rank: 'S'} }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], {"int":42,"str":666,"rank":"S"})')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.tuple(TupleCheck[k:key], true)')

  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(TupleCheck[k:key])')

  t.plan(30)
  t.end()
})

test('Checks.Dict Str Num', async function(t) {
  let check = Checks.Dict('key', Checks.Str().regex(/^[a-z]+$/), Checks.Num().asInt())
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: { } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 12 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { bar: 1654123 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 42, bar: 666, plop: 1e10, another: 0, last: -12 } }))
  await testAsyncException(t, check.validate(store, { key: { A1: 42 } }), 'InvalidRuleError: param.invalid.dict.key(DictCheck[k:key], param.invalid.predicate(StrCheck[], "A1", /^[a-z]+$/))')
  await testAsyncException(t, check.validate(store, { key: { foo: 42, bar: 666, plop: 1e10, another: 0, '$bad': -12 } }), 'InvalidRuleError: param.invalid.dict.key(DictCheck[k:key], param.invalid.predicate(StrCheck[], "$bad", /^[a-z]+$/))')
  await testAsyncException(t, check.validate(store, { key: { foo: 42, bar: 3.14159 } }), 'InvalidRuleError: param.invalid.dict.val(DictCheck[k:key], param.invalid.predicate(NumberCheck[], 3.14159, function isInteger() { [native code] }))')
  await testAsyncException(t, check.validate(store, { key: { foo: 'plop', bar: 3 } }), 'InvalidRuleError: param.invalid.dict.val(DictCheck[k:key], param.invalid.num("plop"))')
  await testAsyncException(t, check.validate(store, { key: [ ] }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], [])')
  await testAsyncException(t, check.validate(store, { key: [ 'plop' ] }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], ["plop"])')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], true)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(DictCheck[k:key])')
  t.plan(22)
  t.end()
})

test('Checks.Dict Enum Num', async function(t) {
  let check = Checks.Dict('key',
      Checks.Enum(['foo', 'bar'])
      .transform(async (x, store) => { if (await store.get(x) === 666) { throw new Error('! 666 !') } ; return x } ),
      Checks.Num()
      .transform(x => { let r = Math.sqrt(x); if (isNaN(r)) { throw new Error('NaN') } else return r })
      .min(1)
    )
    , store = new Store()

  t.ok('undefined' === typeof await check.validate(store, { key: { } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 12 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { bar: 1.654123 } }))
  t.ok('undefined' === typeof await check.validate(store, { key: { foo: 42, bar: 3.14159 } }))

  await store.set('foo', 666)
  await testAsyncException(t, check.validate(store, { key: { foo: 666 } }), 'Error: ! 666 !', false)
  await store.del('foo')

  await testAsyncException(t, check.validate(store, { key: { foo: 42, bar: -1 } }), 'Error: NaN', false)

  await testAsyncException(t, check.validate(store, { key: { foo: 42, bar: 0 } }), 'InvalidRuleError: param.invalid.dict.val(DictCheck[k:key], param.invalid.predicate(NumberCheck[], 0, x >= 1))')
  await testAsyncException(t, check.validate(store, { key: { foobar: 'plop', bar: 3.14159 } }), 'InvalidRuleError: param.invalid.dict.key(DictCheck[k:key], param.invalid.enum("foobar"))')
  await testAsyncException(t, check.validate(store, { key: { foo: 'plop', bar: -1 } }), 'InvalidRuleError: param.invalid.dict.val(DictCheck[k:key], param.invalid.num("plop"))')
  await testAsyncException(t, check.validate(store, { key: [ ] }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], [])')
  await testAsyncException(t, check.validate(store, { key: [ 'plop' ] }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], ["plop"])')
  await testAsyncException(t, check.validate(store, { key: 42 }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], 42)')
  await testAsyncException(t, check.validate(store, { key: true }), 'InvalidRuleError: param.invalid.dict(DictCheck[k:key], true)')
  await testAsyncException(t, check.validate(store, { foo: 'bar' }), 'InvalidRuleError: param.should.be.present(DictCheck[k:key])')
  t.plan(22)
  t.end()
})
