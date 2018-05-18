"use strict";

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


var UserManager = function () {
  function UserManager(UserApi, store) {
    _classCallCheck(this, UserManager);

    this.UserApi = UserApi;
    this.store = store;
  }

  _createClass(UserManager, [{
    key: "register",
    value: function register(firstName, lastName, birthday, language, password, tokens, namePublic, avatarPublic) {
      return this.UserApi.register(new RegisterRequest(firstName, lastName, birthday, language, password, tokens, namePublic, avatarPublic));
    }
  }, {
    key: "register",
    value: function register(registration) {
      return this.UserApi.register(registration);
    }
  }, {
    key: "login",
    value: function login(token, tokenType, password) {
      return this.UserApi.login(token, tokenType, password);
    }
  }, {
    key: "loginGuest",
    value: function loginGuest(guestId) {
      return this.UserApi.loginGuest(guestId);
    }
  }, {
    key: "logout",
    value: function logout() {
      return this.UserApi.logout();
    }
  }, {
    key: "getCurrentUser",
    value: function getCurrentUser() {
      return this.UserApi.getCurrentUser();
    }
  }, {
    key: "getCurrentUserTokens",
    value: function getCurrentUserTokens() {
      return this.UserApi.getUserTokens();
    }
  }, {
    key: "uploadAvatar",
    value: function uploadAvatar(formData) {
      this.UserApi.uploadAvatar(formData);
    }
  }, {
    key: "updateUser",
    value: function updateUser(payload) {
      return this.UserApi.updateUser(payload);
    }
  }, {
    key: "getAccessToken",
    value: function getAccessToken() {
      return this.UserApi.getAccessToken();
    }
  }, {
    key: "encodeAssetProvider",
    value: function encodeAssetProvider(url) {
      return this.UserApi.encodeAssetProvider(url);
    }
  }, {
    key: "sendTokenVerification",
    value: function sendTokenVerification(token, token_type) {
      return this.UserApi.sendTokenVerification(token, token_type);
    }
  }, {
    key: "getRefreshToken",
    value: function getRefreshToken() {
      return this.UserApi.getRefreshToken();
    }
  }, {
    key: "setRefreshToken",
    value: function setRefreshToken(token) {
      return this.UserApi.setRefreshToken(token);
    }
  }, {
    key: "verifyUserToken",
    value: function verifyUserToken(verify) {
      return this.UserApi.verifyUserToken(verify);
    }
  }, {
    key: "addUserToken",
    value: function addUserToken(payload) {
      return this.UserApi.addUserToken(payload);
    }
  }, {
    key: "deleteUserToken",
    value: function deleteUserToken(tokenId) {
      return this.UserApi.deleteUserToken(tokenId);
    }
  }, {
    key: "getGuestToken",
    value: function getGuestToken() {
      return this.UserApi.getGuestToken();
    }
  }, {
    key: "resetPassword",
    value: function resetPassword(token, token_type) {
      return this.UserApi.resetPassword(token, token_type);
    }
  }, {
    key: "addRedeemable",
    value: function addRedeemable(payload) {
      return this.UserApi.addRedeemable(payload);
    }
  }]);

  return UserManager;
}();

exports.default = UserManager;