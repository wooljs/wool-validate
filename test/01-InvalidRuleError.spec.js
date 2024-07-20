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
import { InvalidRuleError } from '../index.js'

test('Checks InvalidRuleError', async function (t) {
  try {
    throw new InvalidRuleError()
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: undefined')
  }
  try {
    throw new InvalidRuleError('x')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: x')
  }
  try {
    throw new InvalidRuleError('x', '')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: x()')
  }
  try {
    throw new InvalidRuleError('', '')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: ()')
  }
  try {
    throw new InvalidRuleError('', '', '')
  } catch (e) {
    t.ok(e instanceof InvalidRuleError)
    t.deepEqual(e.toString(), 'InvalidRuleError: (, )')
  }
  t.plan(10)
  t.end()
})
