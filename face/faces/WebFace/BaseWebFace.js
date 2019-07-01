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
  onLoad () {
    // Create iframe
    this.iframe = document.createElement('iframe')
    this.iframe.style.cssText = 'display: block; position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; overflow: hidden; border: none; background: none; outline: none; z-index:0;'
    this.iframe.setAttribute('src', this.face.properties.display_url)
    this.element.appendChild(this.iframe)
    this.owner = this.vatomView.vatom.properties.owner
    this.user = this.vatomView.blockv.UserManager.getPublicUserProfile(this.owner)
    this.version = null
    this.BridgeV1 = new BridgeV1(this.vatomView.blockv, this.vatom, this.face)
    this.BridgeV2 = new BridgeV2(this.vatomView.blockv, this.vatom, this.face)

    // Bind functions
    this.onIncomingBridgeMessage = this.onIncomingBridgeMessage.bind(this)

    // Add bridge message listener
    window.addEventListener('message', this.onIncomingBridgeMessage)

    // Done
    return Promise.resolve()
  }

  /** @private Called when the view is unloaded */
  onUnload () {
    // Remove iframe
    this.element.removeChild(this.iframe)
    this.iframe.onload = null
    this.iframe = null

    // Remove bridge message listener
    window.removeEventListener('message', this.onIncomingBridgeMessage)
  }

  processIncomingBridgeMessage (name, payload) {
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
        return this.BridgeV2.observeChildren(payload)
      case 'core.action.perform':
        return this.BridgeV2.performAction(payload)
      case 'core.resource.encode':
        return this.BridgeV2.encodeResource(payload)
      default:
        // Unknown event. Pass on to VatomView listener
        if (this.vatomView && this.vatomView.onMessage) {
          return this.vatomView.onMessage(name, payload)
        }
        // No listener, this is an error
        return Promise.reject(new Error('Bridge message not implemented.'))
    }
  }

  onIncomingBridgeMessage (event) {
    // Get payload
    let payload = event.data
    // Check source is from this face's iframe
    if (!payload || !this.iframe || event.source != this.iframe.contentWindow) {
      return
    }
    
    // Check if there's a response ID, if so the web face is expecting a reply with that ID
    let responseID = null
    if (payload.responseID) {
      responseID = payload.responseID
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
      // Failed, send error response
      this.sendv1Message(responseID, {
        errorCode: err.code,
        errorText: err.message
      })
    })
  }

  sendv1Message (name, data) {
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

  sendV2Message (id, name, data, isRequest) {
    // Check if iframe is setup
    if (!this.iframe || !this.iframe.contentWindow) {
      return
    }

    // Send payload
    this.iframe.contentWindow.postMessage({
      [ isRequest ? 'request_id' : 'response_id' ]: id,
      source: 'BLOCKv SDK',
      name: name,
      payload: data,
      version: '2.0.0'
    }, '*')
  }

  vatomStateChanged (vatom) {
    if (this.version === 1) {
      if (vatom.id === this.vatom.id && this.face) {
        var resources = {}
  
        for (var res in this.vatomView.vatom.resources) {
          resources[res] = this.vatomView.vatom.resources[res].value.value
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

  onVatomUpdated () {
    this.vatomStateChanged(this.vatom)
    // console.log(this.vatomView.vatom);
  }
}
