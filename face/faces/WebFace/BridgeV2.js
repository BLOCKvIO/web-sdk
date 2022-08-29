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

export default class BridgeV2 {
  constructor(bv, vatom, face) {
    this.blockv = bv
    this.vatomObject = vatom;
    this.vatom = this.encodeVatom(vatom)
    this.face = face
    this.version = 2
  }

  init() {
    return {
      vatom: this.vatom,
      face: this.face
    }
  }

  getVatom() {
    return this.blockv.Vatoms.getUserVatoms([this.vatom.id]).then(v => {
      return {
        vatom: this.encodeVatom(v[0])
      }
    })
  }

  getVatomChildren() {
    return this.blockv.Vatoms.getVatomChildren(this.vatomObject).then(v => {
      return {
        vatoms: v.map(vatom => Object.assign({ actions: vatom.actions, faces: vatom.faces }, vatom.payload))
      }
    })
  }

  vatomParentSet(payload) {
    return this.blockv.Vatoms.setParent(payload).then(pId => {
      return {
        new_parent_id: pId
      }
    })
  }

  observeChildren(payload) {
    let vId = payload
    return this.blockv.Vatoms.observeChildren(payload.id).then(v => {
      return {
        id: vId,
        vatoms: v
      }
    })
  }

  performAction(payload) {
    if (this.vatom.id === payload.payload['this.id']) {
      return this.blockv.Vatoms.performAction(this.vatomObject, payload.action_name, payload.payload)
    }
  }

  getUserProfile(payload) {
    return this.blockv.UserManager.getPublicUserProfile(this.vatom['vAtom::vAtomType'].owner).then(u => {
      return this.encodeUser(u)
    })
  }

  getCurrentUser(payload) {
    let user = {}
    return Promise.all([
      this.blockv.UserManager.getPublicUserProfile(this.vatom['vAtom::vAtomType'].owner),
      this.blockv.UserManager.getCurrentUserTokens()
    ]).then(data => {
      let user = data[0]
      let tokens = data[1]
      return {
        user: {
          id: user.id,
          properties: {
            avatar_uri: user.properties.avatar_uri,
            first_name: user.properties.first_name,
            last_name: user.properties.last_name,
            is_guest: user.properties.guest_id ? true : false
          },
          tokens: {
            has_email: tokens.some(t => t.properties.token_type == 'email'),
            has_phone: tokens.some(t => t.properties.token_type == 'phone_number'),
            has_verified_email: tokens.some(t => t.properties.confirmed && t.properties.token_type == 'email'),
            has_verified_phone: tokens.some(t => t.properties.confirmed && t.properties.token_type == 'phone_number')
          }
        },
      }
    })
  }

  encodeResource(res) {
    let encodedUrls = []
    res.urls.forEach(url => {
      encodedUrls.push(this.blockv.UserManager.encodeAssetProvider(url))
    })
    console.log(encodedUrls);
    return {
      urls: encodedUrls
    }
  }

  updateVatom(vatom) {
    this.vatomObject = vatom;
    this.vatom = this.encodeVatom(vatom);
  }

  customMessage(payload) {
    return payload
  }

  encodeVatom(vatom) {
    return Object.assign({}, vatom.payload, { faces: vatom.faces }, { actions: vatom.actions })
  }

  encodeUser(user) {
    return {
      user: {
        id: user.id,
        properties: {
          avatar_uri: user.properties.avatar_uri,
          first_name: user.properties.first_name,
          last_name: user.properties.last_name
        }
      }
    }
  }

  /** Fetches information about the inventory */
  inventoryStats(payload) {

    // Get variations
    let template_variations = payload.template_variations || []

    // Ensure only template variations with the same FQDN as this vatom are allowed
    template_variations = template_variations.filter(tv => tv.startsWith(this.vatom['vAtom::vAtomType'].publisher_fqdn + ':'))

    // Call it
    return this.blockv.client.request('POST', '/v1/user/vatom/inventorystats', { template_variations }, true)

  }

}
