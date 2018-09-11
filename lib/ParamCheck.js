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

module.exports = class ParamCheck {
  constructor(k) {
    this.k = k
    this.keep = true
  }
  getKey() {
    return this.k
  }
  containParam(param) {
    return this.k in param
  }
  extractParam(param) {
    return param[this.k]
  }
  saveToParam(param, v) {
    param[this.k] = v
  }
  isMandatory() {
    return true
  }
  drop() {
    this.keep = false
    return this
  }
  undrop() {
    this.keep = true
    return this
  }
  toString() {
    return `${this.constructor.name}[k:${this.k}]`
  }
  toDTO() {
    return {}
  }
}
