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
const _ = require('lodash')

module.exports = class BridgeV2 {
  constructor (bv, vatom, face) {
    this.blockv = bv
    this.vatom = this.encodeVatom(vatom)
    this.face = face
    this.version = 2
    console.log("VATOM COMING FROM V2", this.vatom)
    console.log("FACE COMING FROM V2", this.face)
  }

  init () {
    return {
      vatom: this.vatom,
      face: this.face
    }
  }

  getVatom () {
    return this.blockv.Vatoms.getUserVatoms([this.vatom.id]).then(v => {
      return {
        vatom: this.encodeVatom(v[0])
      }
    })
  }

  getVatomChildren () {
   return this.blockv.Vatoms.getVatomChildren(this.vatom.id).then(v => {
      return {
        vatoms: v
      }
    })
  }

  performAction (payload) { 
    if (this.vatom.id === payload.payload['this.id'])
      return this.blockv.Vatoms.performAction(payload.payload['this.id'], payload.action_name, payload.payload)
  }

  getUserProfile () {
    return this.blockv.UserManager.getPublicUserProfile(this.vatom['vAtom::vAtomType'].owner).then(u => {
      return this.encodeUser(u)
    })
  }

  encodeResource (res) {
    let encodedUrls = []
    for (let u of res.urls) {
      let eur = this.blockv.UserManager.encodeAssetProvider(u)
      encodedUrls.push(eur)
    }

    return {
      urls: encodedUrls
    }
  }

  updateVatom (vatom) {
    this.vatom = vatom
  }

  customMessage (payload) {
    console.log("This would be coming through", payload)
    return payload
  }

  encodeVatom (vatom) {
    return Object.assign({}, vatom.payload, { faces: vatom.faces }, { actions: vatom.actions })
  }

  encodeUser (user) {
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

}
