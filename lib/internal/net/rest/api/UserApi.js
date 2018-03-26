'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Client = require('../../Client');

var _Client2 = _interopRequireDefault(_Client);

var _Store = require('../../../repo/Store');

var _Store2 = _interopRequireDefault(_Store);

var _User = require('../../../../model/User');

var _User2 = _interopRequireDefault(_User);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserApi = function () {
  function UserApi() {
    _classCallCheck(this, UserApi);
  }

  _createClass(UserApi, null, [{
    key: 'getAccessToken',


    /**
     * Registers a user on the Blockv platform.
     *
     * @param registration contains properties of the user. Only the properties to be registered should be set.
     * @return new Observable<User> instance
     */

    value: function getAccessToken() {
      var a = _Store2.default.token;
      var ra = window.localStorage.getItem('refresh');
      return _Store2.default.token;
    }
  }, {
    key: 'setAccessToken',
    value: function setAccessToken(token) {
      _Store2.default.token = token;
      console.log("Access Token changed to  :" + token);
    }
  }, {
    key: 'register',
    value: function register(registration) {

      return _Client2.default.request('POST', '/v1/users', registration, false).then(function (data) {
        _Store2.default.token = data.access_token.token;
        _Store2.default.refreshToken = data.refresh_token.token;
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

      var payload = {
        token: token,
        token_type: tokenType,
        auth_data: {
          password: password
        }
      };

      return _Client2.default.request('POST', '/v1/user/login', payload, false).then(function (data) {
        console.log(data);

        _Store2.default.token = data.access_token.token;
        _Store2.default.refreshToken = data.refresh_token.token;
        _Store2.default.assetProvider = data.asset_provider;
        return data;
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
      var payload = {
        "token": guestId,
        "token_type": "guest_id"
      };
      return _Client2.default.request('POST', '/v1/user/login', payload, false);
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
      _Client2.default.request('POST', '/v1/user/avatar', request, true, avatarHeader);
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

      return _Client2.default.request('GET', '/v1/user', payload, true).then(function (data) {
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

      _Client2.default.request("PATCH", '/v1/user', update, true);
    }

    /**
     * Gets a list of the current users tokens
     * @return JSON Object
     */

  }, {
    key: 'getUserTokens',
    value: function getUserTokens() {

      _Client2.default.request('GET', '/v1/user/tokens', '', true);
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

      _Client2.default.request('POST', '/v1/user/verify_token', verification, true);
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
    key: 'resendVerification',
    value: function resendVerification(token, TokenType) {

      var payload = {
        "token": token,
        "token_type": tokenType
      };

      _Client2.default.request('POST', '/v1/user/reset_token', payload, true);
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
    key: 'resetToken',
    value: function resetToken(token, tokenType) {

      var payload = {
        "token": token,
        "token_type": tokenType
      };

      _Client2.default.request('POST', '/v1/user/reset_token', payload, true);
    }
  }, {
    key: 'resetTokenVerification',
    value: function resetTokenVerification(token, tokenType) {

      var payload = {
        "token": token,
        "token_type": tokenType
      };
      _Client2.default.request('POST', '/v1/user/reset_token_verification', payload, true);
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
      _Client2.default.request('POST', '/v1/user/logout', params, true).then(function () {
        console.log('User has been logged out!');
        _Store2.default.token = '';
        _Store2.default.refreshToken = '';
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
      var aP = JSON.parse(JSON.stringify(_Store2.default.assetProvider));
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
          return url;
        }
      }
    }
  }]);

  return UserApi;
}();

exports.default = UserApi;