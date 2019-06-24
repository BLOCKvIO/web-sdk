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

import BaseFace from './BaseFace'

/** This face displays an image depending on the policy defined in the vatom's properties. */
export default class ImagePolicy extends BaseFace {
/** @override On load, refresh image */
  onLoad () {
    return this.refreshImage()
  }

  /** @override On vatom properties changed, refresh image */
  onVatomUpdated () {
    this.refreshImage()
  }

  /** Refresh the image displayed */
  refreshImage () {
    // Set image display options
    this.element.style.backgroundSize = (this.face.properties.config && this.face.properties.config.image_mode) || this.vatomView.vatom.properties['image_mode'] || 'contain'
    this.element.style.backgroundPosition = 'center'
    this.element.style.backgroundRepeat = 'no-repeat'

    // Fetch vatom children
    var children = this.vatomView.blockv.dataPool.region('inventory').get(false).filter(v => v.properties.parent_id == this.vatom.id)
    
    // Fetch policy
    // Log.debug("ImagePolicyFace", "Refreshing image, found " + children.length + " child vatoms...")
    let policies = (this.face.properties.config && this.face.properties.config.image_policy) || this.vatom.private['image_policy'] || this.vatom.properties['icon_stages'] || []
    // Find matching policy
    for (let policy of policies) {
      // Check policy type
      if (typeof policy.count_max !== 'undefined') {
        // Child count policy, check if count matches
        if (children.length > policy.count_max) {
          continue
        }
      } else if (policy.field) {
        // Field value policy, get key path
        let keyPath = policy.field.split('.')
        // Follow key path and get the value
        let keyValue = this.vatom.payload
        while (keyPath.length > 0) {
          keyValue = keyValue[keyPath[0]]
          keyPath.splice(0, 1)
          if (!keyValue) {
            break
          }
        }
        // Check if value matches
        if (policy.value !== keyValue) {
          continue
        }
      }

      // Found a match, get resource
      var res = this.vatom.properties.resources.find(r => r.name === policy.resource)
      if (!res) {
        continue
      }
      var _url = this.vatomView.blockv.UserManager.encodeAssetProvider(res.value.value)
      // Display URL
      this.element.style.backgroundImage = `url('${_url}')`
      this.element.style.backgroundSize = policy.mode || 'contain'
      // Return promise
      return ImagePolicy.waitForImage(_url)
    }
    // None found! Use the ActivatedImage
    // Found a match, get resource
    var resource = this.vatom.properties.resources.find(r => r.name === 'ActivatedImage')
    if (!resource) {
      throw new Error('No policy found, and no ActivatedImage resource available.')
    }
    var _uri = this.vatomView.blockv.UserManager.encodeAssetProvider(resource.value.value)
    // Display URL
    this.element.style.backgroundImage = `url(${_uri})`
    this.element.style.backgroundSize = 'contain'

    // Return promise
    return ImagePolicy.waitForImage(_uri)
  }

  /** This returns a promise which resolves when the specified image URL has been downloaded by the browser. */
  static waitForImage (url) {
    return new Promise((resolve, reject) => {
      // Create new image tag to do the loading. Browsers cache requests together, so by
      // creating a new image tag and loading the same image in it, we can track the load
      // event of the background-image in the div above.
      var img = document.createElement('img')
      img.src = url

      // Add event handlers
      img.onerror = reject
      img.onload = resolve
    })
  }
}
