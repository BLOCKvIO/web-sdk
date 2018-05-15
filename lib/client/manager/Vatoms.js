'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); //
//  BlockV AG. Copyright (c) 2018, all rights reserved.
//
//  Licensed under the BlockV SDK License (the "License"); you may not use this file or
//  the BlockV SDK except in compliance with the License accompanying it. Unless
//  required by applicable law or agreed to in writing, the BlockV SDK distributed under
//  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
//  ANY KIND, either express or implied. See the License for the specific language
//  governing permissions and limitations under the License.
//


var _Client = require('../../internal/net/Client');

var _Client2 = _interopRequireDefault(_Client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vatoms = function () {
  function Vatoms() {
    _classCallCheck(this, Vatoms);
  }

  _createClass(Vatoms, [{
    key: 'performAction',


    /**
     * [performAction description]
     * @param  {String} vatomId id of the vatom to perform action
     * @param  {String} action  can be either of the following : Drop, Pickup , Transfer , Require
     * @param  {Object} payload contains geo-coordianates or anything else sent along with vatomid
     * @return {JSON}   json payload nested
     */

    value: function performAction(vatomId, action, payload) {

      //check that payload is set
      payload = payload || {};
      //assigns this.id
      payload["this.id"] = vatomId;

      return _Client2.default.request('POST', '/v1/user/vatom/action/' + action, payload, true).then(function (data) {
        data.main.output;
      });
    }
  }, {
    key: 'getUserInventory',
    value: function getUserInventory() {
      var payload = {
        "parent_id": ".",
        "page": 1,
        "limit": 1000
      };

      return _Client2.default.request('POST', '/v1/user/vatom/inventory', payload, true).then(function (data) {
        return data.vatoms;
      });
    }
  }, {
    key: 'getUserVatoms',
    value: function getUserVatoms(vatomId) {
      var payload = {
        "ids": [vatomId]
      };

      return _Client2.default.request('POST', '/v1/user/vatom/get', payload, true).then(function (data) {
        return data;
      });
    }
  }]);

  return Vatoms;
}();

exports.default = new Vatoms();