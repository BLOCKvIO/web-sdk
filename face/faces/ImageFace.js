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

export default class ImageFace extends BaseFace {
  onLoad () {
    // eslint-disable-next-line
    return this.updateImage();
  }

  updateImage () {
    // Set image display options
    this.element.style.backgroundSize = this.face.properties.constraints.view_mode === 'card' ? 'cover' : 'contain'
    this.element.style.backgroundPosition = 'center'
    this.element.style.backgroundRepeat = 'no-repeat'


    // If face config specifies the scale mode, set it now
    if (this.face.properties.config && this.face.properties.config.scale === 'fill') {
      this.element.style.backgroundSize = 'cover'
    } else if (this.face.properties.config && this.face.properties.config.scale === 'fit') {
      this.element.style.backgroundSize = 'contain'
    }

    // Get resource name
    const resourceName = (this.face.properties.config && this.face.properties.config.image) || (this.face.properties.resources && this.face.properties.resources[0]) || 'ActivatedImage'

    // Get resource
    const resource = this.vatom.properties.resources.find(r => r.name === resourceName)
    // TODO: Show warning if no resource found
    if (!resource) {
      return Promise.reject(new Error('No image found to display.'))
    }
    // Display URL
    const iurl = this.vatomView.blockv.UserManager.encodeAssetProvider(resource.value.value)
    this.element.style.backgroundImage = `url('${iurl}')`

    // Return promise
    return this.showImage(iurl)
  }
  // eslint-disable-next-line
  showImage(url) {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.src = url
      img.onload = resolve
      img.onerror = e => reject(new Error("Couldn't load image"))
    })
  }

  static get url () {
    return 'native://image'
  }
}
