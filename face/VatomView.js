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
/* eslint-disable no-underscore-dangle */
/* eslint-disable prefer-const */
/* eslint-disable no-console */
import FaceSelection from './FaceSelection'
import ProgressImage from './faces/ProgressImage'
import ImageFace from './faces/ImageFace'
import ImagePolicy from './faces/ImagePolicy'
import LayeredImage from './faces/LayeredImage'
import BaseWebFace from './faces/WebFace/BaseWebFace'

// list registered faces
let registeredFace = {
  'native://image': ImageFace,
  'native://progress-image-overlay': ProgressImage,
  'native://image-policy': ImagePolicy,
  'native://layered-image': LayeredImage
}

export default class VatomView {
  constructor (bv, vAtom, FSP, config) {
    this.blockv = bv
    this.vatomObj = vAtom
    this.fsp = FSP || FaceSelection.Icon
    this.config = config || {}
    // eslint-disable-next-line
    this._currentFace = null
    this.onVatomUpdated = this.onVatomUpdated.bind(this)
    this.region = this.blockv.dataPool.region('inventory')
    this.region.addEventListener('object.updated', this.onVatomUpdated)
    // create a default view with a div container
    // eslint-disable-next-line
    this.element = document.createElement('div')
    this.element.style.position = 'relative'
    this.element.style.width = this.config.width || '64px'
    this.element.style.height = this.config.height || '64px'

    // create loader
    this.createLoader = this.config.loader || function () {
      let css = '.spinner {margin: 0px auto;width: 70px;text-align: center; margin-top: -50%;}'
      css += '.spinner > div {width: 12px;height: 12px;margin: 0px 3px;border-radius: 100%;display: inline-block;-webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;animation: sk-bouncedelay 1.4s infinite ease-in-out both;}'
      css += '.spinner .bounce1 {-webkit-animation-delay: -0.32s;animation-delay: -0.32s;}'
      css += '.spinner .bounce2 {-webkit-animation-delay: -0.16s;animation-delay: -0.16s;}'
      css += '@-webkit-keyframes sk-bouncedelay {0%, 80%, 100% { -webkit-transform: scale(0) }40% { -webkit-transform: scale(1.0) }}'
      css += '@keyframes sk-bouncedelay {0%, 80%, 100% {-webkit-transform: scale(0);transform: scale(0);} 40% {-webkit-transform: scale(1.0);transform: scale(1.0);}}'

      let head = document.head || document.getElementsByTagName('head')[0]
      let style = document.createElement('style')
      head.appendChild(style)

      style.type = 'text/css'
      if (style.styleSheet) {
        // This is required for IE8 and below.
        style.styleSheet.cssText = css
      } else {
        style.appendChild(document.createTextNode(css))
      }

      let loader = document.createElement('div')

      loader.innerHTML = '<div class="spinner"><div class="bounce1" style="background-color: #333;"></div><div class="bounce2" style="background-color: #333;"></div><div class="bounce3" style="background-color: #333;"></div></div>'
      return loader
    }

    this.createErrorView = this.config.errorView || function (bvi, v, err) {
      let con = document.createElement('div')
      const rs = v.properties.resources.find(r => r.name === 'ActivatedImage')
      const du = rs && bvi.UserManager.encodeAssetProvider(rs.value.value)
      con.style.backgroundSize = 'contain'
      con.style.backgroundPosition = 'center'
      con.style.backgroundRepeat = 'no-repeat'
      con.style.backgroundImage = `url('${du}')`
      con.style.width = '100%'
      con.style.height = '100%'

      let errorView = document.createElement('div')
      errorView.style.cssText = 'position: absolute; top: 0px; right: 0px; padding-right: 5px; padding-top: 5px;'
      errorView.innerHTML = '<img width="20" height="20" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ5Ny40NzIgNDk3LjQ3MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDk3LjQ3MiA0OTcuNDcyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGcgdHJhbnNmb3JtPSJtYXRyaXgoMS4yNSAwIDAgLTEuMjUgMCA0NSkiPgoJPGc+CgkJPGc+CgkJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkNDNEQ7IiBkPSJNMjQuMzc0LTM1Ny44NTdjLTIwLjk1OCwwLTMwLjE5NywxNS4yMjMtMjAuNTQ4LDMzLjgyNkwxODEuNDIxLDE3LjkyOCAgICAgYzkuNjQ4LDE4LjYwMywyNS40NjMsMTguNjAzLDM1LjEyMywwTDM5NC4xNC0zMjQuMDMxYzkuNjcxLTE4LjYwMywwLjQyMS0zMy44MjYtMjAuNTQ4LTMzLjgyNkgyNC4zNzR6Ii8+CgkJCTxwYXRoIHN0eWxlPSJmaWxsOiMyMzFGMjA7IiBkPSJNMTczLjYwNS04MC45MjJjMCwxNC44MTQsMTAuOTM0LDIzLjk4NCwyNS4zOTUsMjMuOTg0YzE0LjEyLDAsMjUuNDA3LTkuNTEyLDI1LjQwNy0yMy45ODQgICAgIFYtMjE2Ljc1YzAtMTQuNDYxLTExLjI4Ny0yMy45ODQtMjUuNDA3LTIzLjk4NGMtMTQuNDYxLDAtMjUuMzk1LDkuMTgyLTI1LjM5NSwyMy45ODRWLTgwLjkyMnogTTE3MS40ODktMjg5LjA1NiAgICAgYzAsMTUuMTY3LDEyLjM0NSwyNy41MTEsMjcuNTExLDI3LjUxMWMxNS4xNjcsMCwyNy41MjMtMTIuMzQ1LDI3LjUyMy0yNy41MTFjMC0xNS4xNzgtMTIuMzU2LTI3LjUyMy0yNy41MjMtMjcuNTIzICAgICBDMTgzLjgzNC0zMTYuNTc5LDE3MS40ODktMzA0LjIzNCwxNzEuNDg5LTI4OS4wNTYiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==" />'
      errorView.addEventListener('click', e => alert(err.message), false)

      con.appendChild(errorView)
      return con
    }

    this.update()
  }

  update () {

    // Check if ready to be displayed
    if (!this.vatomObj)
      return console.warn('No vAtom supplied')

    // Notify current face it's being unloaded
    if (this._currentFace && this._currentFace.onUnload) this._currentFace.onUnload()
    this._currentFace = null

    // Remove all views from our element
    const view = this.element
    while (view.firstChild) {
      view.removeChild(view.firstChild)
    }

    // Load again
    this.load()

  }

  load () {
    // reset errorview and loader
    if (this.loader && this.loader.parentNode) {
      this.loader.parentNode.removeChild(this.loader)
    }
    if (this.errorView && this.errorView.parentNode) {
      this.errorView.parentNode.removeChild(this.errorView)
    }
    this.loader = null
    this.errorView = null

    let rFace = null
    Promise.resolve(() => null).then(() => {
    // start the face selection procedure
      const st = this.fsp(this.vatomObj)
      if (!st)
        throw new Error('No face found for this view mode.')
      let FaceClass = null
      // check if face is registered
      const du = st.properties.display_url.toLowerCase()
      let excludedFaces = this.config.excludedFaces

      if (excludedFaces.includes(du)) {
        throw new Error('This face is not allowed to run in this view mode. [excluded : ' + du + ']')
      } else {
        FaceClass = registeredFace[du]
      }
      // if there is no face registered in the array but we have a http link, show the web face
      if (FaceClass === undefined && du.indexOf('http') !== -1) {
        FaceClass = BaseWebFace
      } else if (FaceClass === undefined) {
        throw new Error('No Face Registered')
      }
      // create a new instance of the chosen face class and pass through the information
      rFace = new FaceClass(this, this.vatomObj, st)
      this._currentFace = rFace
      // make rface opaque
      rFace.element.style.opacity = 0

      // add face to element
      this.element.appendChild(rFace.element)

      // add the loader
      this.element.appendChild(this.loader = this.createLoader())

      // check for error

      // call rface.onload , wait for promise
      return rFace.onLoad()
    }).then(() => {
      if (this.loader) {
        this.element.removeChild(this.loader)
        rFace.element.style.opacity = 1
      }
    }).catch((err) => {
      console.warn('Error from catch', err)
      // remove current face
      this.element.appendChild(this.errorView = this.createErrorView(this.blockv, this.vatom, err))
      if (rFace && rFace.element && rFace.element.parentNode) {
        this.element.removeChild(rFace.element)
      }
      if (this.loader && this.loader.parentNode) {
        this.element.removeChild(this.loader)
      }
    })
  }

  set vatom (vAtom) {
    if (vAtom && vAtom.id === this.vatomObj.id) {
      this.vatomObj.payload = vAtom.payload
      if (this._currentFace) {
        this._currentFace.onVatomUpdated()
      }
    } else if (vAtom) {
      this.vatomObj = vAtom
      this.update()
    }
  }

  get vatom () {
    return this.vatomObj
  }

  free () {

    // Remove event listener
    this.region.removeEventListener('object.updated', this.onVatomUpdated)

    // Notify current face it's being unloaded
    if (this._currentFace && this._currentFace.onUnload) this._currentFace.onUnload()
    this._currentFace = null

    // Remove all views from our element
    const view = this.element
    while (view.firstChild) {
      view.removeChild(view.firstChild)
    }

  }

  onVatomUpdated (id) {
    // Stop if not our vatom
    if (id !== this.vatomObj.id) {
      return
    }

    // Fetch latest vatom from data pool
    var vatom = this.region.getItem(id, false)
    if (!vatom)
      return console.warn('DataPool indicated that an updated vatom was available, but we were unable to fetch it.')

    // Store new vatom and notify face
    this.vatom = vatom
  }

  // register our own face
  static registerFace (faceClass) {
    registeredFace[faceClass.url.toLowerCase()] = faceClass
  }

  /** Send a custom request to the face */
  async sendRequest(name, data) {

    // Pass on to the face code, if supported
    if (!this._currentFace) throw new Error('No face loaded.')
    if (!this._currentFace.sendRequest) throw new Error('Request not supported for this face.')
    return this._currentFace.sendRequest(name, data)

  }

}
