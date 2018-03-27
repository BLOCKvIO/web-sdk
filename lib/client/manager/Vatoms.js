'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Client = require('../../internal/net/Client');

var _Client2 = _interopRequireDefault(_Client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Vatoms = function () {
  function Vatoms() {
    _classCallCheck(this, Vatoms);
  }

  _createClass(Vatoms, [{
    key: 'performAction',


    /**
     * [performAction description]
     * @param  {String} vatomId id of the vatom to perform action
     * @param  {String} action  can be either of the following : Drop, Pickup , Transfer , Require
     * @param  {Object} payload contains geo-coordianates or anything else sent along with vatomid
     * @return {JSON}   json payload nested
     */

    value: function performAction(vatomId, action, payload) {

      //check that payload is set
      payload = payload || {};
      //assigns this.id
      payload["this.id"] = vatomId;

      return _Client2.default.request('POST', '/v1/user/vatom/action/' + action, payload, true).then(function (data) {
        return data.main.output;
      });
    }
  }]);

  return Vatoms;
}();

exports.default = new Vatoms();