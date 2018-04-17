"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var BaseResponse = function BaseResponse(error, message, payload, status) {
  _classCallCheck(this, BaseResponse);

  this.status = status;
  this.error = error;
  this.message = message;
  this.payload = payload;
};

exports.default = BaseResponse;