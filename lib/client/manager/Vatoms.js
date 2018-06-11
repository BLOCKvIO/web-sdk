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
   * @return {Promise<Object>}   json payload nested
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

    /**
     * Gets the current users vAtom inventory
     * @return {Promise<Object>} return a list of JSON Objects that contain the users inventory
     * No parameters are required for this call
     */

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

    /**
     * Gets a vAtom based on the vAtom ID
     * @param  {[STRING]} vatomId ID of the vAtom that is being searched for
     * @return {[JSON OBJECT]} returns a JSON Object containing the vAtom.
     */

  }, {
    key: "getUserVatoms",
    value: function getUserVatoms(vatomId) {
      var payload = {
        "ids": [vatomId]
      };

      return this.vatomApi.getUserVatoms(payload);
    }

    /*  geoDiscover(bottomLeft, topRight, filter){
        filter = filter || "all";
        let payload = {
            "bottom_left": {
                "lat":bottomLeft.lat,
                "lon": bottomLeft.lon
            },
            "top_right": {
                "lat": topRight.lat,
                "lon": topRight.lon
            },
            "filter": filter,
            "limit": 100000
          }
    
        return this.vatomApi.geoDiscover(payload);
      }
    
      */

  }]);

  return Vatoms;
}();

exports.default = Vatoms;