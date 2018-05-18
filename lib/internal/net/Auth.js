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

var _jwtDecode = require('jwt-decode');

var _jwtDecode2 = _interopRequireDefault(_jwtDecode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Auth = function () {
  function Auth(store, client) {
    _classCallCheck(this, Auth);

    this.store = store;
    this.client = client;
  }

  /**
   * Refresh's the users access token
   * @return JSON save the token with the bearer.
   */


  _createClass(Auth, [{
    key: 'refreshToken',
    value: function refreshToken() {

      var options = {
        'Authorization': 'Bearer ' + this.store.refreshToken
      };

      return this.client.request('POST', '/v1/access_token', '', false, options).then(function (data) {

        this.store.token = data.access_token.token;
      });
    }

    /**
     * checkToken checks to see if the expiration time in the token has expired
     * jwt_decode returns an object for the token,
     *
     *  {
     *    foo: "bar",
     *    exp: 1393286893,
     *    iat: 1393268893
     *   }
     *
     * @return Boolean checks to see if the token time has expired
     */

  }, {
    key: 'checkToken',
    value: function checkToken() {
      var valid = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


      //define our vars
      var decodedToken = void 0,
          nowDate = void 0,
          expirationTime = void 0,
          token = void 0;
      token = Store.token;

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

  return Auth;
}();

exports.default = Auth;