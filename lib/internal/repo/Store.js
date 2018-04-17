'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
      this.assetProviderObj = provider;
    },
    get: function get() {
      return this.assetProviderObj;
    }
  }]);

  return Store;
}();

exports.default = Store;