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


var Chat = function () {
  function Chat(chatApi) {
    _classCallCheck(this, Chat);

    this.chatApi = chatApi;
  }

  /**
   * Returns a list of messages of activity
   * @return {Promise<Object>} JSON array containing all the activity from the user.
   */


  _createClass(Chat, [{
    key: "myThreads",
    value: function myThreads() {
      return this.chatApi.myThreads();
    }

    /**
     * Returns a single activity message thread
     * @param  {String} name Unique identifier from the myThreads response
     * @return {Promise<Object>}  returns a detailed object containing the thread specified from the name
     */

  }, {
    key: "myThreadMessages",
    value: function myThreadMessages(name) {
      return this.chatApi.myThreadMessages(name);
    }

    /**
    * Send a message to a user that appears in the "activity" tab
    * @param  {String} token      Phone number or email or id of the user that is going to receive the message
    * @param  {String} token_type phone_number / email / id
    * @param  {String} message    Message that will get sent to the user
    * @return {Promise<Object>}   Success Object
    */

  }, {
    key: "sendMessage",
    value: function sendMessage(token, token_type, message) {
      return this.chatApi.sendMessage(token, token_type, message);
    }
  }]);

  return Chat;
}();

exports.default = Chat;