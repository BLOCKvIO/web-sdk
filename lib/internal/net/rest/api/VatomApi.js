'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

//
//  BlockV AG. Copyright (c) 2018, all rights reserved.
//
//  Licensed under the BlockV SDK License (the "License"); you may not use this file or
//  the BlockV SDK except in compliance with the License accompanying it. Unless
//  required by applicable law or agreed to in writing, the BlockV SDK distributed under
//  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
//  ANY KIND, either express or implied. See the License for the specific language
//  governing permissions and limitations under the License.


var VatomApi = function () {
  function VatomApi(client) {
    _classCallCheck(this, VatomApi);

    this.client = client;
  }

  _createClass(VatomApi, [{
    key: 'getActions',
    value: function getActions(templateID) {
      return this.client.request('GET', '/v1/user/actions/' + templateID, {}, true).then(function (data) {
        var len = data.length;
        var actions = [];
        for (var i = 0; i < len; i++) {

          var action = data[i].name.split('::Action::');
          actions.push({
            "template_id": action[0],
            "action": action[1]
          });
        }

        return actions;
      });
    }
  }, {
    key: 'performAction',
    value: function performAction(action, payload) {

      return this.client.request('POST', '/v1/user/vatom/action/' + action, payload, true).then(function (data) {
        data.main.output;
      });
    }
  }, {
    key: 'getUserInventory',
    value: function getUserInventory(payload) {
      return this.client.request('POST', '/v1/user/vatom/inventory', payload, true).then(function (data) {
        return data.vatoms;
      });
    }
  }, {
    key: 'getUserVatoms',
    value: function getUserVatoms(payload) {
      return this.client.request('POST', '/v1/user/vatom/get', payload, true).then(function (data) {
        return data;
      });
    }
  }, {
    key: 'geoDiscover',
    value: function geoDiscover(payload) {
      return this.client.request('POST', '/v1/vatom/geodiscover', payload, true).then(function (data) {
        return data;
      });
    }
  }, {
    key: 'geoDiscoverGroups',
    value: function geoDiscoverGroups(payload) {
      return this.client.request('POST', '/v1/vatom/geodiscovergroups', payload, true).then(function (data) {
        return data;
      });
    }
  }]);

  return VatomApi;
}();

exports.default = VatomApi;