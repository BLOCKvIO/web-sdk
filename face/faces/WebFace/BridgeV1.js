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
import _ from 'lodash'
export default class BridgeV1 {
  constructor (bv, vatom, face) {
    this.blockv = bv
    this.vatom = vatom
    this.face = face
    this.version = 1
  }

  init () {
    let data = this.encodeVatom(this.vatom)
    data.vatomInfo.faceProperties = this.face.properties || {}

    if (this.blockv.store.userID != null) {
      this.blockv.UserManager.getCurrentUser().then(uv => {
        data['user'] = this.encodeUser(uv)
      })
    }
    // This response has a special message name
    data._responseName = 'vatom.init-complete'
    
    // Done, return payload
    return data
  }

  getChildren (payload) {
    return this.blockv.Vatoms.getVatomChildren(this.vatom).then(children => {
      let vatomInfos = []
      for (let vatom of children) {
        vatomInfos.push(this.encodeVatom(vatom))
      }
      return {
        'items': vatomInfos,
        _responseName: 'vatom.children.get-response'
      }
    })
  }

  rpc (payload) {
    // sends on payload to all faces
    Events.callEvent('websocket.rpc', payload)
    return {}
  }

  performAction (payload) {
    // Perform vAtom action
    return this.blockv.Vatoms.performAction(payload.actionData['this.id'], payload.actionName, payload.actionData)
  }

  getProfile (payload) {
    // Get user details
    return this.vatomView.blockv.UserManager.getCurrentUser().then(user => {
      // Got it, send response
      return {
        firstName: user.firstName,
        lastName: user.lastName,
        avatarURL: this.blockv.UserManager.encodeAssetProvider(user.avatarURL)
      }
    })
  }

  patchVatom (payload) {
    // Perform patch operation
    return this.blockv.request('PATCH', '/vatoms', payload, true)
  }

  getVatom (payload) {
    // Get details from a vatom ID
    return this.blockv.Vatoms.getUserVatoms([payload.id]).then(vatom => this.encodeVatom(vatom[0]))
  }

  async getUser () {
    let us = this.vatom.properties.owner

    return this.blockv.UserManager.getPublicUserProfile(us).then(pu => {
      return this.encodeUser(pu)
    })
  }

  encodeVatom (vatom) {
    // Create resource list
    var resources = {}
    for (let i = 0; i < vatom.properties.resources.length; i++) {
      resources[vatom.properties.resources[i].name] = this.blockv.UserManager.encodeAssetProvider(vatom.properties.resources[i].value.value)
    }
    if (vatom.private && vatom.private.resources) {
      for (let p = 0; p < vatom.private.resources.length; p++) {
        resources[vatom.private.resources[p].name] = this.blockv.UserManager.encodeAssetProvider(vatom.private.resources[p].value.value)
      }
    }
    // Create payload
    return {
      'vatomInfo': {
        'id': vatom.id,
        'properties': _.merge({}, vatom.properties, vatom.private),
        'resources': resources
      }
    }
  }

  encodeUser (user) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarURL: this.blockv.UserManager.encodeAssetProvider(user.avatarURI)
    }
  }
}
