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

import VatomApi from '../../internal/net/rest/api/VatomApi'
import GeoPosRegion from '../../internal/DataPool/plugins/GeoPosRegion'
export default class Vatoms {
  constructor (blockv) {
    this.Blockv = blockv
    this.vatomApi = new VatomApi(blockv.client)
  }

  /**
   * Returns a list of actions that can be performed on a template
   * @param  {[String]} templateID Template ID is the vAtom template iD
   * @return {[Promise<Object>]} returns a object containing a list of available actions
   */

  getActions (templateID) {
    return this.vatomApi.getActions(templateID)
  }

  /**
   * [performAction description]
   * @param  {String} vatomId id of the vatom to perform action
   * @param  {String} action  can be either of the following : Drop, Pickup , Transfer , Require
   * @param  {Object} payload contains geo-coordianates or anything else sent along with vatomid
   * @return {Promise<Object>}   json payload nested
   */

  transferTo (user, actionName = 'Transfer', vatomId) {
    // Check if user is a VatomUser
    var payload = {}
    if (typeof user === 'string') {
      // Check if string is email or phone number
      if (/^0x[a-fA-F0-9]{40}$/.test(user)) {
        // HACK: Sending to an Ethereum address, append "Eth" to the action name
        if (!actionName.startsWith('Eth')) {
          actionName = 'Eth' + actionName
        }

        // Use this address
        payload['new.owner.eth_address'] = user
      } else if (user.indexOf('@') !== -1) {
        payload['new.owner.email'] = user
      } else if (user.indexOf('+') === 0) {
        payload['new.owner.phone_number'] = user
      } else {
        payload['new.owner.id'] = user
      }
    } else {
      // This must be a VatomUser, fetch the identifying property
      if (user.userID) {
        payload['new.owner.id'] = user.userID
      } else if (user.phoneNumber) {
        payload['new.owner.phone_number'] = user.phoneNumber
      } else if (user.email) {
        payload['new.owner.email'] = user.email
      } else {
        return Promise.reject({ code: 'INVALID_PARAMETER', message: `The user object supplied didn't have any identifying fields. It must have either a userID, an email, or a phoneNumber.` })
      }
    }

    // Send request
    return this.performAction(vatomId, actionName, payload)
  }

  performAction (vatomId, action, payload) {

    // Create pre-emptive action in DataPool for known actions
    let undos = []
    switch (action) {
      case 'Transfer':
        undos.push(this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.owner', '.'))
        break

      case 'Drop':
        undos.push(this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.geo_pos', payload))
        undos.push(this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.dropped', true))
        break

      case 'Pickup':
        undos.push(this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.dropped', false))
        break

      case 'Redeem':
        undos.push(this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.owner', '.'))
        break

      default:
        break
    }

    // Perform the action
    return this.vatomApi.performAction(action, Object.assign({ 'this.id': vatomId }, payload)).catch(err => {

      // An error occurred, undo preemptive actions
      undos.map(u => u())

      // Workaround: If error was an attempt to pick up a vatom but the vatom is already picked up, it's possible
      // that the GeoPos region missed an update. Notify all GeoPos regions that this vatom is no longer available.
      if (err.code == 1645)
        this.Blockv.dataPool.regions.filter(r => r instanceof GeoPosRegion).forEach(r => r.preemptiveChange(vatomId, 'vAtom::vAtomType.dropped', false))

      // Pass on the error
      throw err

    })

  }

  /** Called to combine the specified vatom into this one. Note that some faces override the Combine action,
   *  so in order to get those actions as well you should use `combineWith()` on `VatomView` instead. */
  combineWith (vatom, otherVatom) {
    // Pre-emptively set the parent ID
    let undo = this.Blockv.dataPool.region('inventory').preemptiveChange(otherVatom.id, 'vAtom::vAtomType.parent_id', vatom.id)
    // Set parent
    return this.Blockv.client.request('PATCH', '/v1/vatoms', { ids: [otherVatom.id], parent_id: vatom.id }, true).catch(err => {
      // Failed, reset vatom reference
      undo()
      throw err
    })
  }

  /** Called to remove all child vatoms from this vatom */
  split (vatom) {
    // Get vatom's parent ID
    let newParentID = vatom.properties.parent_id || '.'
    // Get all children
    return this.getVatomChildren(vatom.id).then(children => {
      // Remove parent IDs
      return Promise.all(children.map(child => {
        // Pre-emptively update parent ID
        let undo = this.Blockv.dataPool.region('inventory').preemptiveChange(child.id, 'vAtom::vAtomType.parent_id', newParentID)
        // Do patch
        return this.Blockv.client.request('PATCH', '/v1/vatoms', { ids: [child.id], parent_id: newParentID }, true).catch(err => {
          // Failed, reset vatom reference
          undo()
          throw err
        })
      }))
    })
  }

  /**
   * Gets the current users vAtom inventory
   * @return {Promise<Array<Object>>} return a list of JSON Objects that contain the users inventory
   * No parameters are required for this call
   */

  getUserInventory () {
    return this.Blockv.dataPool.region('inventory').get()
  }

  /**
   * Gets a vAtom based on the vAtom ID
   * @param  {[String]} vatomId ID of the vAtom that is being searched for
   * @return {[Promise<Object>} returns a JSON Object containing the vAtom.
   */

  async getUserVatoms (vatomIds) {
    // Make sure it's an array
    if (typeof vatomIds === 'string') {
      vatomIds = [vatomIds]
    }

    // Load all from inventory
    let vatoms = []
    for (let id of vatomIds) {
      let vatom = await this.Blockv.dataPool.region('inventory').getItem(id)
      if (vatom) {
        vatoms.push(vatom)
      } else {
        break
      }
    }
    // If all found, stop
    if (vatoms.length === vatomIds.length) {
      return vatoms
    }

    // Not all the vatoms were in the inventory, create a new region
    return this.Blockv.dataPool.region('ids', vatomIds).get()
  }

  /**
   * Gets a list of vAtoms based on the coordinates.
   * @param  {[Object]} bottomLeft containing a "lat" and "lon" coordinate
   * @param  {[Object]} topRight   containing a "lat" and "lon" coordinate
   * @param  {[String]} filter     defaults to "all"
   * @return {[Promise<Object>}  returns a list of vAtoms, faces and actions
   */
  geoDiscover (bottomLeft, topRight, filter = 'vatoms') {
    const payload = {
      bottom_left: {
        lat: bottomLeft.lat,
        lon: bottomLeft.lon
      },
      top_right: {
        lat: topRight.lat,
        lon: topRight.lon
      },
      filter
    }

    return this.vatomApi.geoDiscover(payload)
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
  geoDiscoverGroups (bottomLeft, topRight, precision = 2, filter = 'all') {
    const payload = {
      bottom_left: {
        lat: bottomLeft.lat,
        lon: bottomLeft.lon
      },
      top_right: {
        lat: topRight.lat,
        lon: topRight.lon
      },
      precision,
      filter
    }

    return this.vatomApi.geoDiscoverGroups(payload)
  }

  /**
   *
   * @param {String} parentID   ID of the vatom that you would like to list the children
   * @returns {Promise<Vatom[]>} Array of vatoms
   */
  getVatomChildren (parentID) {

    // Check if vatom is in the inventory
    if (this.Blockv.dataPool.region('inventory').has(parentID)) {

      // It is, read children from inventory region
      return this.Blockv.dataPool.region('inventory').get().then(children => {
        return children.filter(v => v.properties.parent_id === parentID)
      })

    }

    // Not in inventory region, read from API
    return this.vatomApi.getVatomChildren(parentID)
    
  }

  setParentID(childID, newParentID) {

    // Pre-emptively update parent ID
    let undo = this.Blockv.dataPool.region('inventory').preemptiveChange(childID, 'vAtom::vAtomType.parent_id', newParentID)

    // Do patch
    return this.Blockv.client.request('PATCH', '/v1/vatoms', { ids: [childID], parent_id: newParentID }, true).catch(err => {

      // Failed, reset vatom reference
      undo()
      throw err

    })

  }

  /**
   * 
   * @param {*} vatomIds Array of vatoms that will be changed 
   * @param {*} parentId ID or . to set the children to
   */
  setParent (payload) {
    let parentPayload = {
      ids: [payload.id],
      parent_id: payload.parent_id
    }
    return this.vatomApi.setParent(parentPayload)
  }

  /**
   * Removes the specified vAtom from the current user's inventory
   * @param  {String} vatomID  Id of the vAtom you want to remove
   * @return {Promise<Object>} An object containing a success message
   */
  trashVatom (vatomID) {
    let undos = []
    undos.push(this.Blockv.dataPool.region('inventory').preemptiveChange(vatomID, 'vAtom::vAtomType.owner', '.'))
    return this.vatomApi.trashVatom(vatomID).catch(err => {
      undos.map(u => u())
      throw err
    })
  }
}
