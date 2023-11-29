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
  constructor(blockv) {
    this.Blockv = blockv
    this.vatomApi = new VatomApi(blockv.client)
  }

  getFaces(vatom) {
    return this.vatomApi.getFaces(vatom.properties.template, vatom.platformId)
  }

  getActions(vatom) {
    return this.vatomApi.getActions(vatom.properties.template, vatom.platformId)
  }
  /**
   * [performAction description]
   * @param  {String} vatom the vatom to perform action
   * @param  {String} action  can be either of the following : Drop, Pickup , Transfer , Require
   * @param  {Object} payload contains geo-coordianates or anything else sent along with vatomid
   * @return {Promise<Object>}   json payload nested
   */

  transferTo(user, actionName = 'Transfer', vatom) {
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
    return this.performAction(vatom, actionName, payload)
  }

  async performActionById(vatomId, platformId, action, payload, preemptiveReactor) {

    // Create pre-emptive action in DataPool for known actions
    let undos = []
    if (preemptiveReactor) {
      switch (preemptiveReactor) {
        case 'blockv://v1/Transfer':
          undos.push((await this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.owner', '.')))
          break

        case 'blockv://v1/Drop':
          undos.push((await this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.geo_pos', payload)))
          undos.push((await this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.dropped', true)))
          break

        case 'blockv://v1/Pickup':
          undos.push((await this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.dropped', false)))
          break

        case 'blockv://v1/Redeem':
          undos.push((await this.Blockv.dataPool.region('inventory').preemptiveChange(vatomId, 'vAtom::vAtomType.owner', '.')))
          break

        default:
          break
      }
    }

    // Perform the action
    return this.vatomApi.performAction(action, Object.assign({ 'this.id': vatomId }, payload), platformId).catch(err => {

      // An error occurred, undo preemptive actions
      undos.map(u => u())

      // Workaround: If error was an attempt to pick up a vatom but the vatom is already picked up, it's possible
      // that the GeoPos region missed an update. Notify all GeoPos regions that this vatom is no longer available.
      if (err.code == 1645)
        this.Blockv.dataPool.regions.filter(r => r instanceof GeoPosRegion).forEach(async r => await r.preemptiveChange(vatomId, 'vAtom::vAtomType.dropped', false))

      // Pass on the error
      throw err

    })

  }
  performAction(vatom, actionName, payload) {

    const action = vatom.actions.find(data => data.name.endsWith("::Action::" + actionName));

    return this.performActionById(vatom.id, vatom.platformId, actionName, payload, action?.properties?.reactor);
  }

  /** Called to combine the specified vatom into this one. Note that some faces override the Combine action,
   *  so in order to get those actions as well you should use `combineWith()` on `VatomView` instead. */
  async combineWith(vatom, otherVatom) {
    // Pre-emptively set the parent ID
    let undo = await this.Blockv.dataPool.region('inventory').preemptiveChange(otherVatom.id, 'vAtom::vAtomType.parent_id', vatom.id)

    const combineAction = vatom.actions.find((action) => action.name.endsWith('::Action::Combine'));

    if (combineAction) {
      return this.performAction(vatom, 'Combine', {
        'child.id': otherVatom.id,
      })
        .catch(err => {
          // Failed, reset vatom reference
          undo()
          throw err;
        })
    }
    // Set parent
    return this.Blockv.client.request('PATCH', '/v1/vatoms', { ids: [otherVatom.id], parent_id: vatom.id }, true, undefined, vatom.platformId).catch(err => {
      // Failed, reset vatom reference
      undo()
      throw err
    })
  }

  /** Called to remove all child vatoms from this vatom */
  async split(vatom) {
    const splitAction = vatom.actions.find((action) => action.name.endsWith('::Action::Split'));
    // Get all children
    return this.getVatomChildren(vatom).then(async children => {

      if (splitAction && splitAction.properties.reactor.endsWith('/Split')) {
        let ids = [];
        let undos = [];
        for (let i = 0; i < children.length; i += 1) {
          const child = children[i];
          ids.push(child.id);
          const undo = await this.Blockv.dataPool.region('inventory').preemptiveChange(child.id, 'vAtom::vAtomType.parent_id', '.')
          undos.push(undo)
        }

        return this.performAction(vatom, 'Split', {
          'vatom.ids': ids,
        })
          .catch(err => {
            // Failed, reset vatom reference
            undos.forEach((undo) => undo());
            throw err;
          })
      }
      // Remove parent IDs
      return Promise.all(children.map(child => {
        // Pre-emptively update parent ID
        return this.Blockv.dataPool.region('inventory').preemptiveChange(child.id, 'vAtom::vAtomType.parent_id', '.')
          .then((undo) => {
            const uncombineAction = child.actions.find((action) => action.name.endsWith('::Action::Uncombine'));
            if (uncombineAction) {
              return this.performAction(child, 'Uncombine', {})
                .catch(err => {
                  // Failed, reset vatom reference
                  undo()
                  throw err
                })
            }
            // Do patch
            return this.Blockv.client.request('PATCH', '/v1/vatoms', { ids: [child.id], parent_id: '.' }, true, undefined, vatom.platformId).catch(err => {
              // Failed, reset vatom reference
              undo()
              throw err
            })
          })
      }))
    })
  }

  uncombine(vatom) {
    const parentId = vatom.properties.parent_id;
    return this.Blockv.dataPool.region('inventory').preemptiveChange(vatom.id, 'vAtom::vAtomType.parent_id', '.')
      .then(async (undo) => {
        const uncombineAction = vatom.actions.find((action) => action.name.endsWith('::Action::Uncombine'));
        if (uncombineAction) {
          return this.performAction(vatom, 'Uncombine', {})
            .catch(err => {
              // Failed, reset vatom reference
              undo()
              throw err
            })
        }

        if (parentId !== ".") {
          const parent = await this.Blockv.dataPool.region('inventory').getItem(parentId, false);
          if (parent) {
            const splitAction = parent.actions.find((action) => action.name.endsWith('::Action::Split'));
            if (splitAction && splitAction.properties.reactor.endsWith('/Split')) {
              return this.performAction(parent, 'Split', { 'vatom.ids': [vatom.id] })
                .catch(err => {
                  // Failed, reset vatom reference
                  undo()
                  throw err
                })
            }
          }
        }
        // Do patch
        return this.Blockv.client.request('PATCH', '/v1/vatoms', { ids: [vatom.id], parent_id: '.' }, true, undefined, vatom.platformId).catch(err => {
          // Failed, reset vatom reference
          undo()
          throw err
        })
      })
  }

  /**
   * Gets the current users vAtom inventory
   * @return {Promise<Array<Object>>} return a list of JSON Objects that contain the users inventory
   * No parameters are required for this call
   */

  getUserInventory() {
    return this.Blockv.dataPool.region('inventory').get()
  }

  /**
   * Gets a vAtom based on the vAtom ID
   * @param  {[String]} vatomId ID of the vAtom that is being searched for
   * @return {[Promise<Object>} returns a JSON Object containing the vAtom.
   */

  async getUserVatoms(vatomIds) {
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
    return this.Blockv.dataPool.region('ids', vatomIds).get(true)
  }

  /**
   * Gets a list of vAtoms based on the coordinates.
   * @param  {[Object]} bottomLeft containing a "lat" and "lon" coordinate
   * @param  {[Object]} topRight   containing a "lat" and "lon" coordinate
   * @param  {[String]} filter     defaults to "all"
   * @return {[Promise<Object>}  returns a list of vAtoms, faces and actions
   */
  async geoDiscover(bottomLeft, topRight, filter = 'vatoms', publisherFqdn) {
    const payload = {
      bottom_left: {
        lat: bottomLeft.lat,
        lon: bottomLeft.lon
      },
      top_right: {
        lat: topRight.lat,
        lon: topRight.lon
      },
      filter,
    }
    if (publisherFqdn) { payload['publisher_fqdn'] = publisherFqdn; }

    const platformIds = await this.Blockv.getPlatformIds();
    let vatomsArray = []
    for (let platformId of platformIds) {
      const result = await this.vatomApi.geoDiscover(payload, platformId);
      vatomsArray = vatomsArray.concat(result)
    }

    return vatomsArray;
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

  async geoDiscoverGroups(bottomLeft, topRight, precision = 2, filter = 'all', publisherFqdn) {
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
    if (publisherFqdn) { payload['publisher_fqdn'] = publisherFqdn; }
    let groups = [];
    const platformIds = await this.Blockv.getPlatformIds();
    for (let platformId of platformIds) {
      const result = await this.vatomApi.geoDiscoverGroups(payload, platformId);
      if (result.groups) {
        result.groups.forEach(group => {
          group.platform = platformId;
          groups.push(group);
        })
      }
    }
    return groups;
  }

  /**
   *
   * @param {String} parent the vatom that you would like to list the children
   * @returns {Promise<Vatom[]>} Array of vatoms
   */
  getVatomChildren(parent) {

    // Check if vatom is in the inventory
    if (this.Blockv.dataPool.region('inventory').has(parent.id)) {

      // It is, read children from inventory region
      return this.Blockv.dataPool.region('inventory').get().then(children => {
        return children.filter(v => v.properties.parent_id === parent.id)
      })

    }

    // Not in inventory region, read from API
    return this.vatomApi.getVatomChildren(parent.id, parent.platformId)

  }

  setParentID(vatom, parentId) {

    // Pre-emptively update parent ID
    return this.Blockv.dataPool.region('inventory').preemptiveChange(vatom.id, 'vAtom::vAtomType.parent_id', parentId)
      .then(undo => {

        // Do patch
        return this.Blockv.client.request('PATCH', '/v1/vatoms', { ids: [vatom.id], parent_id: parentId }, true, undefined, vatom.platformId).catch(err => {

          // Failed, reset vatom reference
          undo()
          throw err

        })
      });

  }

  /**
   * 
   * @param {*} vatomIds Array of vatoms that will be changed 
   * @param {*} parentId ID or . to set the children to
   */
  setParent(payload, platformId) {
    let parentPayload = {
      ids: [payload.id],
      parent_id: payload.parent_id
    }
    return this.vatomApi.setParent(parentPayload, platformId)
  }

  /**
   * Removes the specified vAtom from the current user's inventory
   * @param  {String} vatom the vAtom you want to remove
   * @return {Promise<Object>} An object containing a success message
   */
  trashVatom(vatom) {
    return this.Blockv.dataPool.region('inventory').preemptiveChange(vatom.id, 'vAtom::vAtomType.owner', '.')
      .then((undo) => {
        return this.vatomApi.trashVatom(vatom.id, vatom.platformId).catch(err => {
          undo();
          throw err
        });
      })
  }
}
