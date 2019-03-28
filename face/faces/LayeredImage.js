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

export default class LayeredImage extends BaseFace {
  /** @private @override Called on startup */
  onLoad () {
    // Reload images
    return this.reloadImages()
  }

  encodeUrl (vatom, name) {
    let res = vatom.properties.resources.find(r => r.name === name)
    if (!res) {
      return null
    }
    // url is not null
    return this.vatomView.blockv.UserManager.encodeAssetProvider(res.value.value)
  }

  /** @override On vatom properties changed, refresh images */
  onVatomUpdated () {
    return this.reloadImages()
  }

  /** @private Gets the image resource to use for the specified vAtom */
  getLayerImage (vatom) {
    // Find vatom's layered image face
    // Check for the image config field
    return this.encodeUrl(vatom, this.face.properties.config && this.face.properties.config.layerImage) || this.encodeUrl(vatom, 'LayeredImage') || this.encodeUrl(vatom, 'ActivatedImage')
  }

  /** @private Recreates the layered images */
  reloadImages () {
    // Get resource
    var resource = this.getLayerImage(this.vatom)

    // Create base image
    var img = this.createImageNode(resource)
    var newImages = [img]

    // Load image promises
    var imagePromises = [LayeredImage.waitForImage(resource)]

    // List children
    return this.vatomView.blockv.Vatoms.getVatomChildren(this.vatom.id).then(children => {
      // Go through each child vatom
      for (let child of children) {
        // Get activated image resource
        let res = this.getLayerImage(child)
        if (!res) {
          continue
        }
        // Create new image layer
        newImages.push(this.createImageNode(res))

        // Add to image loader array
        imagePromises.push(LayeredImage.waitForImage(res))
      }
    }).then(e => {
      // All done, remove old images
      for (let img of this.images || []) {
        img.parentNode.removeChild(img)
      }
      // Add new images
      this.images = newImages
      for (let imgs of newImages) {
        this.element.appendChild(imgs)
      }
    }).then(e => {
      // Wait for all images to load
      return Promise.all(imagePromises)
    })
  }

  /** Creates the dom node to display an image */
  createImageNode (url) {
    // Create it
    let div = document.createElement('div')
    div.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; background-position: center; background-size: contain; background-repeat: no-repeat; '
    div.style.backgroundImage = `url(${url})`
    return div
  }

  /** This returns a promise which resolves when the specified image URL has been downloaded by the browser. */
  static waitForImage (url) {
    return new Promise((resolve, reject) => {
      // Create new image tag to do the loading. Browsers cache requests together, so by
      // creating a new image tag and loading the same image in it, we can track the load
      // event of the background-image in the div above.
      let img = document.createElement('img')
      img.src = url

      // Add event handlers
      img.onerror = reject
      img.onload = resolve
    })
  }
}
