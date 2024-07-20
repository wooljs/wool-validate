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

import ParamCheck from './ParamCheck.js'

export default class BoolCheck extends ParamCheck {
  static build (k) {
    return new BoolCheck(k)
  }

  async _check (store, param) {
    const val = this.extractParam(param)
    if (typeof val !== 'boolean') throw this.buildError('param.invalid.bool', val)
  }
}
