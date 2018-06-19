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

var _User = require('../../../../model/User');

var _User2 = _interopRequireDefault(_User);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserApi = function () {
  function UserApi(client, store) {
    _classCallCheck(this, UserApi);

    this.client = client;
    this.store = store;
  }

  /**
   * Registers a user on the Blockv platform.
   *
   * @param registration contains properties of the user. Only the properties to be registered should be set.
   * @return new Observable<User> instance
   */

  _createClass(UserApi, [{
    key: 'getAccessToken',
    value: function getAccessToken() {

      return this.store.token;
    }
  }, {
    key: 'setAccessToken',
    value: function setAccessToken(token) {
      this.store.token = '';
      this.store.token = token;
    }
  }, {
    key: 'getRefreshToken',
    value: function getRefreshToken() {
      return this.store.refreshToken;
    }
  }, {
    key: 'setRefreshToken',
    value: function setRefreshToken(token) {
      this.store.token = '';
      this.store.refreshToken = token;
    }
  }, {
    key: 'register',
    value: function register(registration) {
      var _this = this;

      return this.client.request('POST', '/v1/users', registration, false).then(function (data) {
        _this.store.token = data.access_token.token;
        _this.store.refreshToken = data.refresh_token.token;

        return data;
      }).then(function (data) {
        return new _User2.default(data);
      });
    }

    /**
     * Logs a user into the Blockv platform. Accepts a user token (phone or email).
     *
     * @param token the user's phone(E.164) or email
     * @param tokenType the type of the token (phone or email)
     * @param password the user's password.
     * @return JSON Object
     */

  }, {
    key: 'login',
    value: function login(token, tokenType, password) {
      var _this2 = this;

      var payload = {
        token: token,
        token_type: tokenType,
        auth_data: {
          password: password
        }
      };

      return this.client.request('POST', '/v1/user/login', payload, false).then(function (data) {

        if (!password) {
          var error = new Error('Login Failed, Password Reset');
          error.code = "PASSWORD_RESET";
          throw error;
        } else {
          _this2.store.token = data.access_token.token;
          _this2.store.refreshToken = data.refresh_token.token;
          _this2.store.assetProvider = data.asset_provider;
          _this2.store.userID = data.user.id;
          return data;
        }
      }).then(function (data) {
        return new _User2.default(data);
      });
    }

    /**
    * Logs a user into the Blockv platform. Accepts a guest id
    *
    * @param guestId the user's guest id.
    * @return JSON Object
    */

  }, {
    key: 'loginGuest',
    value: function loginGuest(guestId) {
      var _this3 = this;

      var payload = {
        "token": guestId,
        "token_type": "guest_id"
      };
      return this.client.request('POST', '/v1/user/login', payload, false).then(function (data) {

        console.log(data);
        _this3.store.token = data.access_token.token;
        _this3.store.refreshToken = data.refresh_token.token;
        _this3.store.assetProvider = data.asset_provider;
        return data;
      }).then(function (data) {
        return new _User2.default(data);
      });
    }

    /**
    * Logs a user into the Blockv platform. Accepts an OAuth token.
    *
    * @param provider the OAuth provider, e.g. Facebook.
    * @param oauthToken the OAuth token issued by the OAuth provider.
    * @return JSON Object
    */

  }, {
    key: 'loginOAuth',
    value: function loginOAuth(provider, oauthToken) {
      //waiting for a server fix before this one gets any more work!

    }
  }, {
    key: 'uploadAvatar',
    value: function uploadAvatar(request) {

      //get file
      //change to formData
      //submit formData with new header
      var avatarHeader = {
        'Content-Type': 'multipart/form-data'
      };
      this.client.request('POST', '/v1/user/avatar', request, true, avatarHeader);
    }

    /**
    * Fetches the current user's profile information from the Blockv platform.
    *
    * @return JSON Object
    */

  }, {
    key: 'getCurrentUser',
    value: function getCurrentUser(payload) {

      //get the current authenticated in user

      return this.client.request('GET', '/v1/user', payload, true).then(function (data) {
        console.log(data);
        return data;
      });
    }

    /**
    * Updates the current user's profile on the Blockv platform.
    *
    * @param update holds the properties of the user, e.g. their first name. Only the properties to be updated should be set.
    * @return JSON Object
    */

  }, {
    key: 'updateUser',
    value: function updateUser(update) {

      return this.client.request("PATCH", '/v1/user', update, true);
    }

    /**
     * Gets a list of the current users tokens
     * @return JSON Object
     */

  }, {
    key: 'getUserTokens',
    value: function getUserTokens() {

      return this.client.request('GET', '/v1/user/tokens', '', true);
    }

    /**
     * Verifies ownership of a token by submitting the verification code to the Blockv platform.
     *
     * @param token the user's phone(E.164) or email
     * @param tokenType the type of the token (phone or email)
     * @param code the verification code send to the user's token (phone or email).
     * @return JSON Object
     */

  }, {
    key: 'verifyUserToken',
    value: function verifyUserToken(verification) {

      return this.client.request('POST', '/v1/user/verify_token', verification, true);
    }

    /**
     * Sends a One-Time-Pin (OTP) to the user's token (phone or email).
     *
     * This OTP may be used in place of a password to login.
     *
     * @param token the user's phone(E.164) or email
     * @param tokenType the type of the token (phone or email)
     * @return JSON Object
     */

  }, {
    key: 'resetPassword',
    value: function resetPassword(token, tokenType) {

      var payload = {
        "token": token,
        "token_type": tokenType
      };

      return this.client.request('POST', '/v1/user/reset_token', payload, false);
    }

    /**
    * Sends a verification code to the user's token (phone or email).
    *
    * This verification code should be used to verifiy the user's ownership of the token (phone or email).
    *
    * @param token the user's phone(E.164) or email
    * @param tokenType the type of the token (phone or email)
    * @return JSON Object
    */

  }, {
    key: 'sendTokenVerification',
    value: function sendTokenVerification(token, tokenType) {

      var payload = {
        "token": token,
        "token_type": tokenType
      };
      return this.client.request('POST', '/v1/user/reset_token_verification', payload, false);
    }

    /**
     * Returns a server generated guest id
     * @return Object payload containing a guest user generated by the server
     */

  }, {
    key: 'getGuestToken',
    value: function getGuestToken() {
      return this.client.request('POST', '/v1/user/guest', '', false).then(function (data) {

        return data.properties.guest_id;
      });
    }

    /**
     * Log out the current user.
     *
     * The current user will not longer be authorized to perform user scoped requests on the Blockv platfrom.
     *
     * @return new JSON
     */

  }, {
    key: 'logout',
    value: function logout(params) {
      this.client.request('POST', '/v1/user/logout', params, true).then(function () {
        console.log('User has been logged out!');
        this.store.token = '';
        this.store.refreshToken = '';
      });
    }
  }, {
    key: 'extractHostname',
    value: function extractHostname(url) {
      var hostname;
      //find & remove protocol (http, ftp, etc.) and get hostname

      if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
      } else {
        hostname = url.split('/')[0];
      }

      //find & remove port number
      hostname = hostname.split(':')[0];
      //find & remove "?"
      hostname = hostname.split('?')[0];

      return hostname;
    }
  }, {
    key: 'encodeAssetProvider',
    value: function encodeAssetProvider(url) {
      var aP = this.store.assetProvider;
      var aPlen = aP.length;
      var compare = this.extractHostname(url);

      for (var i = 0; i < aPlen; i++) {
        var comparethis = this.extractHostname(aP[i].uri);
        if (compare === comparethis) {
          var total = 0;
          //same uri so get the policy signature and key and append
          for (var a in aP[i].descriptor) {
            if (total === 0) {
              url += '?' + a + "=" + aP[i].descriptor[a];
            } else {
              url += '&' + a + "=" + aP[i].descriptor[a];
            }
            total++;
          }
        }
      }
      return url;
    }
  }, {
    key: 'addUserToken',
    value: function addUserToken(payload) {
      /**
       * payload is
       * {
       * "token": "another.email@domain.com",
       * "token_type": "email",
       * "is_primary": false
       * }
       */
      return this.client.request('POST', '/v1/user/tokens', payload, true);
    }
  }, {
    key: 'setDefaultToken',
    value: function setDefaultToken(tokenId) {
      return this.client.request('PUT', '/v1/user/tokens/' + tokenId + '/default', null, true);
    }
  }, {
    key: 'deleteUserToken',
    value: function deleteUserToken(tokenId) {

      return this.client.request('DELETE', '/v1/user/tokens/' + tokenId, null, true);
    }
  }, {
    key: 'addRedeemable',
    value: function addRedeemable(payload) {
      var U = this.store.userID;
      return this.client.request('POST', '/v1/users/' + U + '/redeemables', payload, true);
    }
  }]);

  return UserApi;
}();

exports.default = UserApi;