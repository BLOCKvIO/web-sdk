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
//
var Store = function () {
  function Store() {
    _classCallCheck(this, Store);
  }

  _createClass(Store, null, [{
    key: 'server',
    get: function get() {
      return this.serverAddress; // {{ SERVER }}
    },
    set: function set(address) {
      this.serverAddress = address;
    }
  }, {
    key: 'appID',
    get: function get() {
      return this.APPID; //{{APPID}}
    },
    set: function set(appid) {
      this.APPID = appid;
    }
  }, {
    key: 'websocketAddress',
    get: function get() {
      return this.wssocketAddress;
    },
    set: function set(websocAddress) {
      this.wssocketAddress = websocAddress;
    }
  }, {
    key: 'token',
    set: function set(token) {
      this.accessToken = token;
    },
    get: function get() {
      return this.accessToken;
    }
  }, {
    key: 'refreshToken',
    set: function set(refresh) {
      window.localStorage.setItem('refresh', refresh);
    },
    get: function get() {
      var rT = window.localStorage.getItem('refresh');
      return rT;
    }
  }, {
    key: 'assetProvider',
    set: function set(provider) {
      window.localStorage.setItem('asset_provider', JSON.stringify(provider));
    },
    get: function get() {
      var aP = JSON.parse(window.localStorage.getItem('asset_provider') || 'undefined');
      return aP;
    }
  }]);

  return Store;
}();

exports.default = Store;