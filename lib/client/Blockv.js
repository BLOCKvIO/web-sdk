'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _Store = require('../internal/repo/Store');

var _Store2 = _interopRequireDefault(_Store);

var _UserManager = require('./manager/UserManager');

var _UserManager2 = _interopRequireDefault(_UserManager);

var _UserApi = require('../internal/net/rest/api/UserApi');

var _UserApi2 = _interopRequireDefault(_UserApi);

var _VatomApi = require('../internal/net/rest/api/VatomApi');

var _VatomApi2 = _interopRequireDefault(_VatomApi);

var _Vatoms = require('./manager/Vatoms');

var _Vatoms2 = _interopRequireDefault(_Vatoms);

var _Client = require('../internal/net/Client');

var _Client2 = _interopRequireDefault(_Client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } //
//  BlockV AG. Copyright (c) 2018, all rights reserved.
//
//  Licensed under the BlockV SDK License (the "License"); you may not use this file or
//  the BlockV SDK except in compliance with the License accompanying it. Unless
//  required by applicable law or agreed to in writing, the BlockV SDK distributed under
//  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
//  ANY KIND, either express or implied. See the License for the specific language
//  governing permissions and limitations under the License.
//


/**
 * Created by LordCheddar on 2018/03/05.
 */

var Blockv = function Blockv(payload) {
    _classCallCheck(this, Blockv);

    var prefix = payload.prefix || payload.appID;
    this.store = new _Store2.default(prefix);
    this.store.appID = payload.appID;
    this.store.server = payload.server;
    this.store.websocketAddress = payload.websocketAddress;

    var client = new _Client2.default(this.store);

    var userApi = new _UserApi2.default(client, this.store);
    var vatomApi = new _VatomApi2.default(client);

    this.UserManager = new _UserManager2.default(userApi, this.store);
    this.Vatoms = new _Vatoms2.default(vatomApi);
};

exports.default = Blockv;