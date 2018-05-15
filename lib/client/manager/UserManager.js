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


var _UserApi = require('../../internal/net/rest/api/UserApi');

var _UserApi2 = _interopRequireDefault(_UserApi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UserManager = function () {
  function UserManager() {
    _classCallCheck(this, UserManager);
  }

  _createClass(UserManager, [{
    key: 'register',
    value: function register(firstName, lastName, birthday, language, password, tokens, namePublic, avatarPublic) {
      return _UserApi2.default.register(new RegisterRequest(firstName, lastName, birthday, language, password, tokens, namePublic, avatarPublic));
    }
  }, {
    key: 'register',
    value: function register(registration) {
      return _UserApi2.default.register(registration);
    }
  }, {
    key: 'login',
    value: function login(token, tokenType, password) {
      return _UserApi2.default.login(token, tokenType, password);
    }
  }, {
    key: 'loginGuest',
    value: function loginGuest(guestId) {
      return _UserApi2.default.loginGuest(guestId);
    }
  }, {
    key: 'logout',
    value: function logout() {
      return _UserApi2.default.logout();
    }
  }, {
    key: 'getCurrentUser',
    value: function getCurrentUser() {
      return _UserApi2.default.getCurrentUser();
    }
  }, {
    key: 'getCurrentUserTokens',
    value: function getCurrentUserTokens() {
      return _UserApi2.default.getUserTokens();
    }
  }, {
    key: 'uploadAvatar',
    value: function uploadAvatar(formData) {
      _UserApi2.default.uploadAvatar(formData);
    }
  }, {
    key: 'updateUser',
    value: function updateUser(payload) {
      return _UserApi2.default.updateUser(payload);
    }
  }, {
    key: 'getAccessToken',
    value: function getAccessToken() {
      return _UserApi2.default.getAccessToken();
    }
  }, {
    key: 'encodeAssetProvider',
    value: function encodeAssetProvider(url) {
      return _UserApi2.default.encodeAssetProvider(url);
    }
  }, {
    key: 'sendTokenVerification',
    value: function sendTokenVerification(token, token_type) {
      return _UserApi2.default.sendTokenVerification(token, token_type);
    }
  }, {
    key: 'getRefreshToken',
    value: function getRefreshToken() {
      return _UserApi2.default.getRefreshToken();
    }
  }, {
    key: 'setRefreshToken',
    value: function setRefreshToken(token) {
      return _UserApi2.default.setRefreshToken(token);
    }
  }, {
    key: 'verifyUserToken',
    value: function verifyUserToken(verify) {
      return _UserApi2.default.verifyUserToken(verify);
    }
  }, {
    key: 'addUserToken',
    value: function addUserToken(payload) {
      return _UserApi2.default.addUserToken(payload);
    }
  }, {
    key: 'deleteUserToken',
    value: function deleteUserToken(tokenId) {
      return _UserApi2.default.deleteUserToken(tokenId);
    }
  }, {
    key: 'getGuestToken',
    value: function getGuestToken() {
      return _UserApi2.default.getGuestToken();
    }
  }, {
    key: 'resetPassword',
    value: function resetPassword(token, token_type) {
      return _UserApi2.default.resetPassword(token, token_type);
    }
  }]);

  return UserManager;
}();

exports.default = new UserManager();