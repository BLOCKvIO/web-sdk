'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _Store = require('../repo/Store');

var _Store2 = _interopRequireDefault(_Store);

var _Client = require('./Client');

var _Client2 = _interopRequireDefault(_Client);

var _jwtDecode = require('jwt-decode');

var _jwtDecode2 = _interopRequireDefault(_jwtDecode);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Auth = function () {
  function Auth() {
    _classCallCheck(this, Auth);
  }

  _createClass(Auth, [{
    key: 'refreshToken',


    /**
     * Refresh's the users access token
     * @return JSON save the token with the bearer.
     */
    value: function refreshToken() {

      var options = {
        'Authorization': 'Bearer ' + _Store2.default.refreshToken
      };

      return _Client2.default.request('POST', '/v1/access_token', '', false, options).then(function (data) {

        _Store2.default.token = data.access_token.token;
      });
    }

    /**
     * checkToken checks to see if the expiration time in the token has expired
     * jwt_decode returns an object for the token,
     *
     *  {
     *    foo: "bar",
     *    exp: 1393286893,
     *    iat: 1393268893
     *   }
     *
     * @return Boolean checks to see if the token time has expired
     */

  }, {
    key: 'checkToken',
    value: function checkToken() {
      var valid = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;


      //define our vars
      var decodedToken = void 0,
          nowDate = void 0,
          expirationTime = void 0,
          token = void 0;
      token = _Store2.default.token;

      if (token == 'undefined' || token == '') {
        this.refreshToken();
      } else {
        try {
          decodedToken = (0, _jwtDecode2.default)(_Store2.default.token);
          expirationTime = decodedToken.exp * 1000;
          nowDate = Date.now();

          //quick calc to determine if the token has expired
          //if ((nowDate - 30000) > expirationTime)
          return this.refreshToken();
          //else
          //   return Promise.resolve(true)
        } catch (e) {
          return this.refreshToken();
        }
      }
    }
  }]);

  return Auth;
}();

exports.default = new Auth();