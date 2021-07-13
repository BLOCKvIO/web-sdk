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
import BaseFace from '../BaseFace'
import BridgeV1 from './BridgeV1'
import BridgeV2 from './BridgeV2'

export default class BaseWebFace extends BaseFace {
  /** @private Called on startup */
  onLoad() {

    // Pending requests
    this.pendingRequests = {}

    // Create iframe
    this.iframe = document.createElement('iframe')
    this.iframe.style.cssText = 'display: block; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; overflow: hidden; border: none; background: none; outline: none; z-index:0;'
    this.iframe.setAttribute('allowfullscreen',true);
    this.iframe.setAttribute('src', this.face.properties.display_url)
    this.element.appendChild(this.iframe)
    this.owner = this.vatomView.vatom.properties.owner
    this.user = this.vatomView.blockv.UserManager.getPublicUserProfile(this.owner)
    this.version = null
    this.BridgeV1 = new BridgeV1(this.vatomView.blockv, this.vatom, this.face)
    this.BridgeV2 = new BridgeV2(this.vatomView.blockv, this.vatom, this.face)
    this.observeListenerSet = false
    this.listChildren = []

    // Bind functions
    this.onIncomingBridgeMessage = this.onIncomingBridgeMessage.bind(this)

    // Add bridge message listener
    window.addEventListener('message', this.onIncomingBridgeMessage)

    // Done
    return Promise.resolve()
  }

  /** @private Called when the view is unloaded */
  onUnload() {
    // Remove iframe
    this.element.removeChild(this.iframe)
    this.iframe.onload = null
    this.iframe = null

    // Remove bridge message listener
    window.removeEventListener('message', this.onIncomingBridgeMessage)
    if (this.observeListenerSet) {
      this.vatomView.blockv.dataPool.region('inventory').removeEventListener('object.updated', this.observeChildren)
    }
  }

  processIncomingBridgeMessage(name, payload) {
    switch (name) {
      case 'vatom.init':
        this.version = 1
        return this.BridgeV1.init(payload)
      case 'vatom.children.get':
        return this.BridgeV1.getChildren(payload)
      case 'vatom.rpc.call':
        return this.BridgeV1.rpc()
      case 'vatom.performAction':
        return this.BridgeV1.performAction(payload)
      case 'user.profile.fetch':
        return this.BridgeV1.getUser()
      case 'user.avatar.fetch':
        return this.BridgeV1.getUser()
      case 'vatom.patch':
        return this.BridgeV1.patchVatom(payload)
      case 'vatom.get':
        return this.BridgeV1.getVatom(payload)
      case 'core.init':
        this.version = 2
        return this.BridgeV2.init(payload)
      case 'core.user.get':
        return this.BridgeV2.getUserProfile(payload)
      case 'core.user.current.get':
        return this.BridgeV2.getCurrentUser(payload)
      case 'core.vatom.get':
        return this.BridgeV2.getVatom()
      case 'core.vatom.children.get':
        return this.BridgeV2.getVatomChildren(payload)
      case 'core.vatom.parent.set':
        return this.BridgeV2.vatomParentSet(payload)
      case 'core.vatom.children.observe':
        if (!this.observeListenerSet) {
          this.observeChildren = this.observeChildren.bind(this)
          this.vatomView.blockv.dataPool.region('inventory').addEventListener('object.updated', this.observeChildren)
          this.observeListenerSet = true
        }
        return this.observeChildren(payload.id)
      case 'core.action.perform':
        return this.BridgeV2.performAction(payload)
      case 'core.resource.encode':
        return this.BridgeV2.encodeResource(payload)
      case 'core.inventory.stats':
        return this.BridgeV2.inventoryStats(payload)
      default:
        // Unknown event. Pass on to VatomView listener
        if (this.vatomView && this.vatomView.onMessage) {
          return this.vatomView.onMessage(name, payload)
        }
        // No listener, this is an error
        return Promise.reject(new Error('Bridge message not implemented.'))
    }
  }

  onIncomingBridgeMessage(event) {
    // Get payload
    let payload = event.data
    // Check source is from this face's iframe
    if (!payload || !this.iframe || event.source !== this.iframe.contentWindow) {
      return
    }

    // V1: Check if there's a response ID, if so the web face is expecting a reply with that ID
    let responseID = null
    if (payload.responseID) {
      responseID = payload.responseID
    }

    // V2: Check if this is a response to one of our requests
    if (payload.response_id && this.pendingRequests[payload.response_id]) {

      // Complete the promise. Check for error or success
      if (payload.error_message) {

        // Failed
        let err = new Error(payload.error_message)
        err.code = payload.error_code || 'unknown_error'
        this.pendingRequests[payload.response_id].reject(err)
        delete this.pendingRequests[payload.response_id]
        return

      } else {

        // Success
        this.pendingRequests[payload.response_id].resolve(payload.payload)
        delete this.pendingRequests[payload.response_id]
        return

      }

    }

    // Process it, get response
    Promise.resolve(this.processIncomingBridgeMessage(payload.name, payload.data || payload.payload)).then(resp => {
      // Done, send response back
      if (payload.version === '2.0.0') {
        this.sendV2Message(payload.request_id, payload.name, resp)
      } else {
        this.sendv1Message(responseID || resp._responseName, resp)
      }
    }).catch(err => {

      if (payload.version === '2.0.0') {
        this.sendV2Message(payload.request_id, payload.name, {
          error_code: err.code || 'unknown_error',
          error_message: err.message
        }, false)
      } else {
        // Failed, send error response
        this.sendv1Message(responseID, {
          errorCode: err.code,
          errorText: err.message
        })
      }



    })
  }

  sendv1Message(name, data) {
    // Check if iframe is setup
    if (!this.iframe || !this.iframe.contentWindow) {
      return
    }

    // Send payload
    this.iframe.contentWindow.postMessage({
      source: 'VatomicSDK',
      name: name,
      data: data
    }, '*')
  }

  sendV2Message(id, name, data, isRequest) {
    // Check if iframe is setup
    if (!this.iframe || !this.iframe.contentWindow) {
      return
    }

    // Send payload
    this.iframe.contentWindow.postMessage({
      [isRequest ? 'request_id' : 'response_id']: id,
      source: 'BLOCKv SDK',
      name: name,
      payload: data,
      version: '2.0.0'
    }, '*')
  }

  /** Called when the viewer wants to send a request to the face. Only supported with the V2 bridge. */
  sendRequest(name, data) {

    // Send it
    let id = Math.random().toString(36).substr(2)
    this.sendV2Message(id, name, data, true)

    // Store response promise
    return new Promise((resolve, reject) => {
      this.pendingRequests[id] = { resolve, reject }
    })

  }

  vatomStateChanged(vatom) {
    if (this.version === 1) {
      if (vatom.id === this.vatom.id && this.face) {
        var resources = {}
        for (var resource of this.vatomView.vatom.properties.resources) {
          resources[resource.name] = resource.value.value
        }

        var data = {
          vatomInfo: {
            id: this.vatomView.vatom.id,
            properties: this.vatomView.vatom.properties,
            resources: resources,
            faceProperties: this.face.properties
          }
        }
        this.sendv1Message('vatom.updated', data)
      }
    } else {
      if (vatom.id === this.vatom.id && this.face) {
        this.sendV2Message('res_1', 'core.vatom.update', { vatom: this.BridgeV2.encodeVatom(vatom) }, true)
      }
    }
  }

  async observeChildren(payload) {
    console.log('payload from observe', payload)

    if (this.vatom.id === payload) {
      let children = await this.vatomView.blockv.dataPool.region('inventory').get(false).then(result => result.filter(v => v.properties.parent_id === payload).map(this.mapVatom));
      this.sendV2Message(Math.random(), 'core.vatom.children.update', { id: payload, vatoms: children }, true)
    }

  }

  onVatomUpdated() {
    this.vatomStateChanged(this.vatom)
  }
  /**
   * pass in vatom model recieve out packaged vatom for bridge
   * @param {*} vatom 
   */
  mapVatom(vatom) {
    return Object.assign({ actions: vatom.actions, faces: vatom.faces }, vatom.payload)
  }
}
