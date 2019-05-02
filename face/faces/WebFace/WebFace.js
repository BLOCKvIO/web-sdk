import BaseFace from '../BaseFace'

export default class WebFace extends BaseFace {

  processIncomingBridgeMessage (name, payload) {
    
    switch (name) {
      case 'vatom.init':
        this.bridgeVersion = (payload && payload.version) || 1
        let data = WebFace.encodeVatom(this.vatomView.vatom)
        data.vatomInfo.faceProperties = this.face.properties || {}

        if (this.vatomView.blockv.store.user != null) {
          this.vatomView.blockv.UserManager.getCurrentUser().then(uv => {
            data['user'] = WebFace.encodeUser(uv)
          })
        }
        // This response has a special message name
        data._responseName = 'vatom.init-complete'

        // Done, return payload
        return data

      case 'vatom.children.get':
        return this.vatomView.blockv.Vatoms.getVatomChildren(payload.id).then(vatoms => {
          // Create list of vatom info
          let vatomInfos = []
          for (let i = 0; i < vatoms.length; i++) {
            vatomInfos.push(WebFace.encodeVatom(vatoms[i]))
          }
          // Done
          return {
            'items': vatomInfos,
            _responseName: 'vatom.children.get-response'
          }
        })

      case 'vatom.rpc.call':
        // sends on payload to all faces
        Events.callEvent('websocket.rpc', payload)
        return {}

      case 'vatom.performAction':
        // Perform vAtom action
        return this.vatomView.blockv.Vatoms.performAction(payload.actionData['this.id'], payload.actionName, payload.actionData)

      case 'user.profile.fetch' || 'user.avatar.fetch':
        // Get user details
        console.log(this.vatomView)
        return this.vatomView.blockv.UserManager.getCurrentUser().then(user => {
          // Got it, send response
          return {
            firstName: user.firstName,
            lastName: user.lastName,
            avatarURL: this.vatomView.blockv.UserManager.encodeAssetProvider(user.avatarURL)
          }
        })

      case 'vatom.patch':
        // Perform patch operation
        return Request.patch('/vatoms', payload)

      case 'vatom.get':
        // Get details from a vatom ID
        return this.vatomView.blockv.Vatoms.getUserVatoms([payload.id]).then(vatom => WebFace.encodeVatom(vatom[0]))

      case 'core.init':
        this.bridgeVersion = (payload && payload.version) || 2

        return {
          vatom: this.vatomView.vatom,
          face: this.face
        }

      case 'core.user.get':
        let us = this.vatomView.vatom.properties.owner
        return this.vatomView.blockv.UserManager.getPublicUserProfile(us)

      case 'core.vatom.children.get':
        // Fetch children
        return this.vatomView.blockv.Vatoms.getVatomChildren(payload.id).then(vatoms => {
          // Return info
          return {
            vatoms: vatoms.map(v => v.payload),
            faces: vatoms.map(v => v.faces).flat().map(f => f.rawPayload),
            actions: vatoms.map(v => v.actions).flat().map(a => a.rawPayload)
          }
        })

      default:
        // Unknown event. Pass on to VatomView listener
        if (this.vatomView && this.vatomView.onMessage) {
          return this.vatomView.onMessage(name, payload)
        }
        // No listener, this is an error
        return Promise.reject(new Error('Bridge message not implemented.'))
    }
  }

  

  static encodeVatom (vatom) {
    // Create resource list
    var resources = {}
    for (var res in vatom.properties.resources) {
      resources[res] = vatom.properties.resources.find(r => r.res.value.value)
    }
    // Create payload
    return {
      'vatomInfo': {
        'id': vatom.id,
        'properties': vatom.properties,
        'resources': resources
      }
    }
  }

  static encodeUser (user) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarURL: user.avatarURL,
      displayName: ((user.firstName || '') + ' ' + (user.lastName || '')).trim(),
    }
  }

  sendMessage (id, name, data) {
    // Check if iframe is setup
    if (!this.iframe || !this.iframe.contentWindow)
      return

    // Send payload
    console.log('HTMLFace', 'Sending event to face: ' + name, data)
    


    this.iframe.contentWindow.postMessage({
      response_id: id,
      source: 'VatomicSDK',
      name: name,
      version: "2.0.0",
      payload: data || {}
    }, '*')
  }


  RPC (data) {
    if (data && data.template_variation && data.rpc && data.template_variation === this.vatomView.vatom.templateVariation) {
      this.sendMessage('vatom.rpc.incoming', { rpc: data.rpc })
    }
  }

  vatomStateChanged (vatom) {
    if (vatom.id === this.vatomView.vatom.id && this.face) {
      this.vatom = vatom
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
      console.log('webview vatom state changed')
      this.sendMessage('vatom.updated', data)
    }
  }

  onVatomUpdated () {
    this.vatomStateChanged(this.vatomView.vatom)
  }
  
}
