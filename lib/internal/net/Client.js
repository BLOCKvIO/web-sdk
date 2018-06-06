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


var _popsicle = require('popsicle');

var _jwtDecode = require('jwt-decode');

var _jwtDecode2 = _interopRequireDefault(_jwtDecode);

var _BaseResponse = require('./rest/response/BaseResponse');

var _BaseResponse2 = _interopRequireDefault(_BaseResponse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Client = function () {
  function Client(store) {
    _classCallCheck(this, Client);

    this.store = store;
  }

  _createClass(Client, [{
    key: 'request',
    value: function request(method, endpoint, payload, auth, headers) {
      var _this = this;

      if (auth === true) {
        return this.checkToken().then(function (e) {
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
        'App-Id': this.store.appID,
        'Authorization': 'Bearer ' + this.store.token,
        'Content-Type': 'application/json'
      }, headers);

      return (0, _popsicle.request)({
        method: method,
        url: this.store.server + endpoint,
        body: payload,
        headers: headers

      }).use(_popsicle.plugins.parse('json')).then(function (res) {
        return Object.assign(new _BaseResponse2.default(), res.body);
      }).then(function (response) {

        console.log(response);

        // Check for server error
        if (!response.payload) {

          var ErrorCodes = {
            11: "Problem with payload",
            401: 'Token has Expired',
            516: 'Invalid Payload',
            521: 'Token Unavailable',
            527: 'Invalid Date Format',
            2030: 'No user found, Please register an account first.',
            2031: 'Authentication Failed',
            2032: 'Login Failed, Please try again',
            2034: 'Invalid Token',
            2051: 'Too many login attempts, Please try again later.',
            2552: 'Unable To Retrieve Token',
            2563: 'Token Already Confirmed',
            2564: 'Invalid Verification Code',
            2569: 'Invalid Phone Number'
          };

          if (response.error === 2051) {
            // Check for the special login locked error
            // We need to pull the timestamp that is in the reponse.message to show when they
            // can login agin


            // HACK: Pull time from original server error string
            var dateString = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g.exec(response.message);
            response.lockedUntil = new Date(dateString);

            // Replace duration in the error message
            var duration = response.lockedUntil.getTime() - Date.now();
            if (duration < 2000) duration = 2000;
            var seconds = Math.floor(duration / 1000);
            var minutes = Math.floor(duration / 1000 / 60);
            if (seconds <= 90) response.error = response.message.replace("%DURATION%", seconds == 1 ? "1 second" : seconds + " seconds");else response.message = response.message.replace("%DURATION%", minutes == 1 ? "1 minute" : minutes + " minutes");

            // Rethrow error
            var error = new Error("Too many login attempts, Try again at : " + response.lockedUntil);
            error.code = response.error || 0;
            throw error;
          } else {

            var error = new Error(ErrorCodes[response.error] || "An unknown server error occurred.");
            error.code = response.error || 0;
            throw error;
          }
        }

        // No error, continue
        return response.payload;
      });
    }

    /**
     * Refresh's the users access token
     * @return JSON save the token with the bearer.
     */

  }, {
    key: 'refreshToken',
    value: function refreshToken() {
      var _this2 = this;

      var options = {
        'Authorization': 'Bearer ' + this.store.refreshToken
      };

      return this.request('POST', '/v1/access_token', '', false, options).then(function (data) {

        _this2.store.token = data.access_token.token;
      });
    }
  }, {
    key: 'checkToken',
    value: function checkToken() {
      var valid = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


      //define our vars
      var decodedToken = void 0,
          nowDate = void 0,
          expirationTime = void 0,
          token = void 0;
      token = this.store.token;

      if (token == 'undefined' || token == '') {
        this.refreshToken();
      } else {
        try {
          decodedToken = (0, _jwtDecode2.default)(this.store.token);
          expirationTime = decodedToken.exp * 1000;
          nowDate = Date.now();

          //quick calc to determine if the token has expired
          //if ((nowDate - 30000) > expirationTime)
          return this.refreshToken();
          //else
          //   return Promise.resolve(true)
        } catch (e) {
          return this.refreshToken();
        }
      }
    }
  }]);

  return Client;
}();

exports.default = Client;