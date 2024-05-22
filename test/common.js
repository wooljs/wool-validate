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

const Checks = require(__dirname + '/../index.js')

module.exports = {
  async testAsyncException(t, r, m, IRE = true) {
    const s = new Error().stack
    try {
      await r
      t.fail('should throw: ' + m)
    } catch (e) {
      if (IRE) t.ok(e instanceof Checks.InvalidRuleError)
      if (m instanceof RegExp) t.ok(m.test(e.toString()), s)
      else t.deepEqual(e.toString(), m, s)
    }
  }
}