'use strict';

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


var ChatApi = function () {
  function ChatApi(client) {
    _classCallCheck(this, ChatApi);

    this.client = client;
  }

  _createClass(ChatApi, [{
    key: 'myThreads',
    value: function myThreads() {
      return this.client.request('POST', '/v1/activity/mythreads', {}, true).then(function (data) {
        return data.threads;
      });
    }
  }, {
    key: 'myThreadMessages',
    value: function myThreadMessages(name) {
      var payload = {
        "name": name,
        "cursor": "",
        "count": 100
      };
      return this.client.request('POST', '/v1/activity/mythreadmessages', payload, true).then(function (data) {
        return data;
      });
    }
  }, {
    key: 'sendMessage',
    value: function sendMessage(token, token_type, message) {
      var payload = {
        "message": message,
        token_type: token
      };
      return this.client.request('POST', '/v1/user/message', payload, true).then(function (data) {
        return data;
      });
    }
  }]);

  return ChatApi;
}();

exports.default = ChatApi;