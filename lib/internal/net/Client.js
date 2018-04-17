'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Store = require('../repo/Store');

var _Store2 = _interopRequireDefault(_Store);

var _Auth = require('../net/Auth');

var _Auth2 = _interopRequireDefault(_Auth);

var _BaseResponse = require('./rest/response/BaseResponse');

var _BaseResponse2 = _interopRequireDefault(_BaseResponse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Client = function () {
  function Client() {
    _classCallCheck(this, Client);
  }

  _createClass(Client, [{
    key: 'request',
    value: function request(method, endpoint, payload, auth, headers) {
      var _this = this;

      if (auth === true) {
        return _Auth2.default.checkToken().then(function (e) {
          return _this._request(method, endpoint, payload, headers);
        });
      } else {
        return this._request(method, endpoint, payload, headers);
      }
    }
  }, {
    key: '_request',
    value: function _request(method, endpoint, payload, headers) {

      headers = Object.assign({
        'App-Id': _Store2.default.appID,
        'Authorization': 'Bearer ' + _Store2.default.token,
        'Content-Type': 'application/json'
      }, headers);

      // Convert object payload to JSON
      if (!(payload instanceof FormData) && (typeof payload === 'undefined' ? 'undefined' : _typeof(payload)) == "object") payload = JSON.stringify(payload);

      if (payload instanceof FormData) delete headers['Content-Type'];
      // Create promise
      return new Promise(function (onSuccess, onFail) {

        // Create XHR
        var xhr = new XMLHttpRequest();
        xhr.responseType = 'text';
        xhr.open(method, _Store2.default.server + endpoint);
        for (var name in headers) {
          xhr.setRequestHeader(name, headers[name]);
        }

        xhr.send(payload);

        // Add handlers
        xhr.onerror = onFail;
        xhr.onload = function (e) {
          return onSuccess(JSON.parse(xhr.response));
        };
      }).then(function (parsedBody) {

        return Object.assign(new _BaseResponse2.default(), parsedBody);
      }).then(function (response) {

        // Check for server error
        if (!response.payload) {
          var error = new Error(response.message || "An unknown server error occurred.");
          error.code = response.error || 0;
          throw error;
        }

        // No error, continue
        return response.payload;
      });
    }
  }]);

  return Client;
}();

exports.default = new Client();