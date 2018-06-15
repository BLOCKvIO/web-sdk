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


var WebSockets = function () {
  function WebSockets(store) {
    _classCallCheck(this, WebSockets);

    this.store = store;
    this.socketserver = this.store.websocketAddress;
  }

  _createClass(WebSockets, [{
    key: "start",
    value: function start() {
      var _this = this;

      console.log("starting the web sockets....");

      var connection = new WebSocket(this.socketserver);

      connection.onopen = function () {
        var payload = {
          "action": "login",
          "appID": _this.store.appID,
          "token": "Bearer " + _this.store.token
        };
        console.log(payload);
        connection.send(JSON.stringify(payload));
      };

      // Log errors
      connection.onerror = function (error) {
        console.log('WebSocket Error ' + error);
      };

      // Log messages from the server
      connection.onmessage = function (e) {
        console.log('Server: ' + e.data);
      };
    }
  }, {
    key: "close",
    value: function close() {
      this.connection.close();
    }
  }]);

  return WebSockets;
}();

exports.default = WebSockets;