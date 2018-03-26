"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var User = function User(userData) {
    _classCallCheck(this, User);

    this.id = userData.user.id;
    this.firstName = userData.user.properties.first_name;
    this.lastName = userData.user.properties.last_name;
    this.avatarUri = userData.user.properties.avatar_uri;
    this.birthday = userData.user.properties.birthday;
    this.language = userData.user.properties.language;
    this.assetProvider = userData.asset_provider;
};

exports.default = User;