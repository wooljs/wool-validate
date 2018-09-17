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

const Checks = {}

;[
  'InvalidRuleError',
  'ParamCheck',
  'StrCheck',
  'EnumCheck',
  'BoolCheck',
  'NumberCheck',
  'StructCheck',
  'ValidId',
  'MultiCheck',
  'NoCheck',
  'ListCheck',
  'DictCheck',
  'TupleCheck'
].forEach((k)=> {
  Checks[k] = require('./lib/'+k)
})

Object.entries({
  Bool: 'BoolCheck',
  Num: 'NumberCheck',
  Str: 'StrCheck',
  Id: 'ValidId',
  Enum: 'EnumCheck',
  Struct: 'StructCheck',
  List: 'ListCheck',
  Tuple: 'TupleCheck',
  Dict: 'DictCheck',
  Multi: 'MultiCheck',
  None: 'NoCheck',
  Any: 'NoCheck'
}).forEach(([k,v])=>{
  Checks[k] = Checks[v].build
})

module.exports = Checks

