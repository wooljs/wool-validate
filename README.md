# wool-validate

A data validation tool for Wool.

It serves as a way to define and validate the Command payloads (see [wool-model](https://github.com/wooljs/wool-model)) before they are registered into an event. As such it parse an object and validate presence and type of each key-value pair of the object. It also can modify the data to add computed data from the command into the event or remove sensitive data not needed to be kept in the event store.

As of current implementation, some validation classes work with [wool-store](https://github.com/wooljs/wool-store) package to make in-database validation.

# Usage

A validation do nothing if data is validated, but throws an InvalidRuleError if 


```javascript
const store = new Store()
const check = Multi([
  Id('knownId'),
  Id('createdId').asNew(),
  Num('Numkey'),
  Str('strkey'),
  Str('foo').absent()
])

await store.set('ID-42', {foo: 'bar'})

let data

// This one pass silently
await check.validate(store, data = { knownId: 'ID-42', Numkey: 42, strkey: 'toto' })
// data = { knownId: 'ID-42', createdId: '<new Id following standard algo>', Numkey: 42, strkey: 'toto' }

// throws an InvalidRuleError because of key knownId associated value not present in Store 
await check.validate(store, { knownId: 'xxx', Numkey: 42, strkey: 'toto' })

// throws an InvalidRuleError because of key foo being present in Store 
await check.validate(store, { knownId: 'ID-42', Numkey: 42, strkey: 'toto', foo: 'boom' })


```

# API Doc
