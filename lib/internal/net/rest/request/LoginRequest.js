"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var LoginRequest = function () {
    function LoginRequest(tokenType, token, password) {
        _classCallCheck(this, LoginRequest);

        this.token_type = tokenType;
        this.token = token;
        this.auth_data = { password: password };
    }

    _createClass(LoginRequest, [{
        key: "tokenType",
        get: function get() {
            return this.token_type;
        },
        set: function set(tokenType) {
            this.token_type = tokenType;
        }
    }]);

    return LoginRequest;
}();

exports.default = LoginRequest;