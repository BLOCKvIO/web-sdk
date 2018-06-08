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


var Vatoms = function () {
  function Vatoms(vatomApi) {
    _classCallCheck(this, Vatoms);

    this.vatomApi = vatomApi;
  }

  /**
   * [performAction description]
   * @param  {String} vatomId id of the vatom to perform action
   * @param  {String} action  can be either of the following : Drop, Pickup , Transfer , Require
   * @param  {Object} payload contains geo-coordianates or anything else sent along with vatomid
   * @return {JSON}   json payload nested
   */

  _createClass(Vatoms, [{
    key: "performAction",
    value: function performAction(vatomId, action, payload) {

      //check that payload is set
      payload = payload || {};
      //assigns this.id
      payload["this.id"] = vatomId;

      return this.vatomApi.performAction(action, payload);
    }
  }, {
    key: "getUserInventory",
    value: function getUserInventory() {
      var payload = {
        "parent_id": ".",
        "page": 1,
        "limit": 1000
      };

      return this.vatomApi.getUserInventory(payload);
    }
  }, {
    key: "getUserVatoms",
    value: function getUserVatoms(vatomId) {
      var payload = {
        "ids": [vatomId]
      };

      return this.vatomApi.getUserVatoms(payload);
    }
  }, {
    key: "geoDiscover",
    value: function geoDiscover(bottomLeft, topRight, filter) {
      filter = filter || "all";
      var payload = {
        "bottom_left": {
          "lat": bottomLeft.lat,
          "lon": bottomLeft.lon
        },
        "top_right": {
          "lat": topRight.lat,
          "lon": topRight.lon
        },
        "filter": filter,
        "limit": 100000
      };

      return this.vatomApi.geoDiscover(payload);
    }
  }]);

  return Vatoms;
}();

exports.default = Vatoms;