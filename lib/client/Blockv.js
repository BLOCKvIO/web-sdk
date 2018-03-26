'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Store = require('../internal/repo/Store');

var _Store2 = _interopRequireDefault(_Store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Created by LordCheddar on 2018/03/05.
 */

var Blockv = function () {
  function Blockv() {
    _classCallCheck(this, Blockv);
  }

  _createClass(Blockv, null, [{
    key: 'init',
    value: function init(_init) {
      //const APPID = appID;
      //const SERVER = 'https://apidev.blockv.net/';
      _Store2.default.appID = _init.appID;
      _Store2.default.server = _init.server;
      _Store2.default.websocketAddress = _init.websocketAddress;
    }
  }]);

  return Blockv;
}();

exports.default = Blockv;