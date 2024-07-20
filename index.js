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

import InvalidRuleError from './lib/InvalidRuleError.js'
import ParamCheck from './lib/ParamCheck.js'
import StrCheck from './lib/StrCheck.js'
import EnumCheck from './lib/EnumCheck.js'
import BoolCheck from './lib/BoolCheck.js'
import NumberCheck from './lib/NumberCheck.js'
import StructCheck from './lib/StructCheck.js'
import ValidId from './lib/ValidId.js'
import MultiCheck from './lib/MultiCheck.js'
import NoCheck from './lib/NoCheck.js'
import ListCheck from './lib/ListCheck.js'
import DictCheck from './lib/DictCheck.js'
import TupleCheck from './lib/TupleCheck.js'
import EitherCheck from './lib/EitherCheck.js'

const Any = NoCheck.build
const Bool = BoolCheck.build
const Dict = DictCheck.build
const Enum = EnumCheck.build
const Either = EitherCheck.build
const Has = ParamCheck.build
const Id = ValidId.build
const List = ListCheck.build
const Multi = MultiCheck.build
const None = NoCheck.build
const Num = NumberCheck.build
const Str = StrCheck.build
const Struct = StructCheck.build
const Tuple = TupleCheck.build

export {
  InvalidRuleError,
  ParamCheck,
  StrCheck,
  EnumCheck,
  BoolCheck,
  NumberCheck,
  StructCheck,
  ValidId,
  MultiCheck,
  NoCheck,
  ListCheck,
  DictCheck,
  TupleCheck,
  EitherCheck,
  Any,
  Bool,
  Dict,
  Enum,
  Either,
  Has,
  Id,
  List,
  Multi,
  None,
  Num,
  Str,
  Struct,
  Tuple
}
