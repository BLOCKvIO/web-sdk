"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RegisterRequest = function () {
  function RegisterRequest(firstName, lastName, birthday, language, password, tokens, namePublic, avatarPublic) {
    _classCallCheck(this, RegisterRequest);

    this.first_name = firstName;
    this.last_name = lastName;
    this.birthday = birthday;
    this.language = language;
    this.password = password;
    this.user_tokens = tokens;
    this.name_public = namePublic;
    this.avatar_public = avatarPublic;
  }

  _createClass(RegisterRequest, [{
    key: "addToken",
    value: function addToken(tokenType, token) {

      if (!this.user_tokens) {
        this.user_tokens = [];
      }

      this.user_tokens.add({
        "token": token,
        "token_type": tokenType
      });
    }
  }, {
    key: "firstName",
    get: function get() {
      return this.first_name;
    },
    set: function set(value) {
      this.first_name = value;
    }
  }, {
    key: "lastName",
    get: function get() {
      return this.last_name;
    },
    set: function set(value) {
      this.last_name = value;
    }
  }, {
    key: "avatarPublic",
    get: function get() {
      return this.avatar_public;
    },
    set: function set(value) {
      this.avatar_public = value;
    }
  }, {
    key: "namePublic",
    get: function get() {
      return this.name_public;
    },
    set: function set(value) {
      this.name_public = value;
    }
  }]);

  return RegisterRequest;
}();

exports.default = RegisterRequest;