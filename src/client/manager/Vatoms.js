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


class Vatoms {
  constructor(vatomApi) {
    this.vatomApi = vatomApi;
  }


  /**
   * Returns a list of actions that can be performed on a template
   * @param  {[String]} templateID Template ID is the vAtom template iD
   * @return {[Promise<Object>]} returns a object containing a list of available actions
   */

  getActions(templateID) {
    return this.vatomApi.getActions(templateID);
  }

  /**
   * [performAction description]
   * @param  {String} vatomId id of the vatom to perform action
   * @param  {String} action  can be either of the following : Drop, Pickup , Transfer , Require
   * @param  {Object} payload contains geo-coordianates or anything else sent along with vatomid
   * @return {Promise<Object>}   json payload nested
   */

  performAction(vatomId, action, payload) {
    // check that payload is set
    const pload = payload || {};
    // assigns this.id
    pload['this.id'] = vatomId;
    return this.vatomApi.performAction(action, payload);
  }

  /**
   * Gets the current users vAtom inventory
   * @return {Promise<Array<Object>>} return a list of JSON Objects that contain the users inventory
   * No parameters are required for this call
   */

  getUserInventory() {
    const payload = {
      parent_id: '.',
      page: 1,
      limit: 1000,
    };

    return this.vatomApi.getUserInventory(payload);
  }

  /**
   * Gets a vAtom based on the vAtom ID
   * @param  {[String]} vatomId ID of the vAtom that is being searched for
   * @return {[Promise<Object>} returns a JSON Object containing the vAtom.
   */
  getUserVatoms(vatomId) {
    const payload = {
      ids: vatomId,
    };
    return this.vatomApi.getUserVatoms(payload);
  }

  /**
   * Gets a list of vAtoms based on the coordinates.
   * @param  {[Object]} bottomLeft containing a "lat" and "lon" coordinate
   * @param  {[Object]} topRight   containing a "lat" and "lon" coordinate
   * @param  {[String]} filter     defaults to "all"
   * @return {[Promise<Object>}  returns a list of vAtoms, faces and actions
   */
  geoDiscover(bottomLeft, topRight, filter = 'vatoms') {
    const payload = {
      bottom_left: {
        lat: bottomLeft.lat,
        lon: bottomLeft.lon,
      },
      top_right: {
        lat: topRight.lat,
        lon: topRight.lon,
      },
      filter,
    };

    return this.vatomApi.geoDiscover(payload);
  }

  /**
   * Discover groups of vAtoms with Keys
   * @param  {Object} bottomLeft contains a lat and lon coordinate.
   *                             Coordinate must be integers and not string
   * @param  {Object} topRight   contains a lat and lon coordinate.
   *                             Coordinate must be integers and not strings
   * @param  {Integer} precision  1 - 12 defines the accuracy of the combination.
   * @param  {String} filter     defaults to all
   * @return {Promise<Object>}   Returns a list of groups
   */
  geoDiscoverGroups(bottomLeft, topRight, precision = 2, filter = 'all') {
    const payload = {
      bottom_left: {
        lat: bottomLeft.lat,
        lon: bottomLeft.lon,
      },
      top_right: {
        lat: topRight.lat,
        lon: topRight.lon,
      },
      precision,
      filter,
    };

    return this.vatomApi.geoDiscoverGroups(payload);
  }

  /**
   * Deletes a vatom from your inventory
   * @param  {String} vatomID  Id of the vAtom you want to delete
   * @return {Promise<Object>} An object containing a success message
   */
  deleteVatom(vatomID) {
    return this.vatomApi.deleteVatom(vatomID);
  }
}

export default Vatoms;
