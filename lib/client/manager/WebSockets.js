"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _EventEmitter2 = require("../../internal/EventEmitter");

var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } //
//  BlockV AG. Copyright (c) 2018, all rights reserved.
//
//  Licensed under the BlockV SDK License (the "License"); you may not use this file or
//  the BlockV SDK except in compliance with the License accompanying it. Unless
//  required by applicable law or agreed to in writing, the BlockV SDK distributed under
//  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
//  ANY KIND, either express or implied. See the License for the specific language
//  governing permissions and limitations under the License.
//

var WebSockets = function (_EventEmitter) {
  _inherits(WebSockets, _EventEmitter);

  function WebSockets(store, client) {
    _classCallCheck(this, WebSockets);

    var _this = _possibleConstructorReturn(this, (WebSockets.__proto__ || Object.getPrototypeOf(WebSockets)).call(this));

    _this.store = store;
    _this.client = client;
    _this.socket = null;
    _this.isOpen = false;
    _this.delayTime = 1000;

    return _this;
  }

  _createClass(WebSockets, [{
    key: "connect",
    value: function connect() {
      var _this2 = this;

      //before we connect, make sure the token is valid
      if (this.socket && this.socket.readyState !== 3)
        //if the websocket is connected already
        return Promise.resolve(this);

      return this.client.checkToken(this.store.accessToken).then(function () {
        var url = _this2.store.wssocketAddress + "/ws?app_id=" + encodeURIComponent(_this2.store.appID) + "&token=" + encodeURIComponent(_this2.store.token);
        _this2.socket = new WebSocket(url);
        _this2.isOpen = true;
        _this2.socket.addEventListener('open', _this2.handleConnected.bind(_this2));
        _this2.socket.addEventListener('message', _this2.handleMessage.bind(_this2));
        _this2.socket.addEventListener('close', _this2.handleClose.bind(_this2));
        //return class
        return _this2;
      }).catch(function (err) {
        _this2.retryConnection();
      });
    }
  }, {
    key: "handleMessage",
    value: function handleMessage(e) {
      /*
      /// INTERNAL: Broadcast on initial connection to the socket.
              case info           = "info"
              /// Inventory event
              case inventory      = "inventory"
              /// Vatom state update event
              case stateUpdate    = "state_update"
              /// Activity event
              case activity       = "my_events"
       */
      var ed = JSON.parse(e.data);

      //if the user only wants state updates
      if (ed.msg_type == "state_update") this.trigger('stateUpdate', ed);

      //if the user only wants inventory updates
      if (ed.msg_type == "inventory") this.trigger('inventory', ed);

      //if the user only wants activity updates
      if (ed.msg_type == "my_events") this.trigger('activity', ed);

      //if the user only wants info updates
      if (ed.msg_type == "info") this.trigger('info', ed);

      if (ed) this.trigger('all', ed);
    }
  }, {
    key: "handleConnected",
    value: function handleConnected(e) {

      this.delayTime = 1000;
      this.trigger('connected', e);
    }
  }, {
    key: "retryConnection",
    value: function retryConnection() {
      var _this3 = this;

      //set Time x 2
      //
      setTimeout(function () {
        if (!_this3.isOpen) return;
        if (_this3.socket.readyState == 3) _this3.connect();
      }, this.delayTime);

      if (this.delayTime < 8000) this.delayTime *= 2;
    }
  }, {
    key: "handleClose",
    value: function handleClose(e) {

      this.retryConnection();
    }
  }, {
    key: "close",
    value: function close() {
      if (!this.socket) return;
      this.isOpen = false;
      this.socket.close();
      this.socket = null;
    }
  }]);

  return WebSockets;
}(_EventEmitter3.default);

exports.default = WebSockets;