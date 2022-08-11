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
import { ResizeSensor } from 'css-element-queries'

export default class ProgressImage extends BaseFace {
  onLoad() {
    // Set our element style
    this.element.style.overflow = 'hidden'

    // Create base image
    this.base = document.createElement('div')
    this.base.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; background-position: center; background-size: contain; background-repeat: no-repeat; '
    this.element.appendChild(this.base)

    this.container = document.createElement('div')
    this.container.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; overflow: hidden;'
    this.element.appendChild(this.container)

    // Create fill container element
    this.fillContainer = document.createElement('div')
    this.fillContainer.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; overflow: hidden;'
    this.container.appendChild(this.fillContainer)

    // Create fill image
    this.fill = document.createElement('div')
    this.fill.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; background-position: center; background-size: contain; background-repeat: no-repeat;'
    this.fillContainer.appendChild(this.fill)

    // Create Image Percent Container
    this.percentContainer = document.createElement('div')
    this.percentContainer.style.cssText = 'position:absolute; top: 0px; right: 0px; width:auto; height:auto; padding:5px; font-size:9px; color: rgba(0,0,0,0.5)';
    this.element.appendChild(this.percentContainer)

    this.resizeSensor = new ResizeSensor(this.element, () => {
      this.onResize();
    });

    // Reload images
    return this.refresh()
  }

  onResize() {
    if (this.images) {
      const containerWidth = this.element.clientWidth;
      const containerHeight = this.element.clientHeight;
      const imageWidth = this.images[0].width;
      const imageHeight = this.images[0].height;
      const aspect = imageWidth / imageHeight;
      let resizeWidth = containerWidth;
      let resizeHeight = containerHeight;
      if (containerHeight < containerWidth) {
        resizeHeight = containerHeight;
        resizeWidth = resizeHeight * aspect;
        if (resizeWidth > containerWidth) {
          resizeWidth = containerWidth;
          resizeHeight = resizeWidth / aspect;
        }
      }
      else {
        resizeWidth = containerWidth;
        resizeHeight = resizeWidth / aspect;
        if (resizeHeight > containerHeight) {
          resizeHeight = containerHeight;
          resizeWidth = resizeHeight * aspect;
        }
      }
      this.base.style.width = resizeWidth + 'px';
      this.base.style.height = resizeHeight + 'px';
      this.base.style.top = ((containerHeight - resizeHeight) / 2) + 'px';
      this.base.style.left = ((containerWidth - resizeWidth) / 2) + 'px';
      this.container.style.width = resizeWidth + 'px';
      this.container.style.height = resizeHeight + 'px';
      this.container.style.top = ((containerHeight - resizeHeight) / 2) + 'px';
      this.container.style.left = ((containerWidth - resizeWidth) / 2) + 'px';

      // Get info
      const score = Math.min(1, Math.max(0, parseFloat(this.vatom.properties.cloning_score) || 0)) * 100
      let paddingStart = parseFloat((this.face.properties.config && this.face.properties.config.padding_start) || this.vatom.private.padding_start) || 0
      let paddingEnd = parseFloat((this.face.properties.config && this.face.properties.config.padding_end) || this.vatom.private.padding_end) || 0
      const direction = ((this.face.properties.config && this.face.properties.config.direction) || this.vatom.private.direction || '').toLowerCase()

      // Adjust padding to be percents instead of pixels of base image
      if (direction === 'up' || direction === 'down') {
        paddingStart = paddingStart / this.images[0].height * 100
        paddingEnd = paddingEnd / this.images[0].height * 100
      } else {
        paddingStart = paddingStart / this.images[0].width * 100
        paddingEnd = paddingEnd / this.images[0].width * 100
      }

      // Apply padding
      const range = 100 - paddingStart - paddingEnd
      const paddedScore = Math.floor(score / 100 * range + paddingStart)

      // Apply styles to make it fill up
      const invertedScore = 100 - paddedScore
      if (direction === 'up') {
        // Filling from the bottom up
        this.fillContainer.style.top = `${invertedScore}%`
        this.fill.style.top = `${(-1 * invertedScore)}%`
      } else if (direction === 'down') {
        // Filling from the top down
        this.fillContainer.style.top = `${(-1 * invertedScore)}%`
        this.fill.style.top = `${invertedScore}%`
      } else if (direction === 'right') {
        // Filling from the left to the right
        this.fillContainer.style.left = `${(-1 * invertedScore)}%`
        this.fill.style.left = `${invertedScore}%`
      } else {
        // Filling from the right to the left
        this.fillContainer.style.left = `${invertedScore}%`
        this.fill.style.left = `${(-1 * invertedScore)}%`
      }
    }
  }
  onUnload() {
    if (this.resizeSensor) {
      this.resizeSensor.detach();
    }
  }
  onVatomUpdated() {
    return this.refresh()
  }

  static calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    let ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
    return { width: srcWidth * ratio, height: srcHeight * ratio }
  }


  /** Refresh the face position and images. @returns Promise */
  refresh() {
    // Apply base image
    const baseImg = (this.face.properties.config && this.face.properties.config.empty_image && this.vatom.properties.resources.find(r => r.name === this.face.properties.config.empty_image)) || this.vatom.properties.resources.find(r => r.name === 'BaseImage')
    if (!baseImg) return Promise.reject(new Error('No BaseImage found.'))
    this.base.style.backgroundImage = `url(${this.vatomView.blockv.UserManager.encodeAssetProvider(baseImg.value.value)})`

    // Apply fill image
    const activatedImg = (this.face.properties.config && this.face.properties.config.full_image && this.vatom.properties.resources.find(r => r.name === this.face.properties.config.full_image)) || this.vatom.properties.resources.find(r => r.name === 'ActivatedImage')
    if (!activatedImg) return Promise.reject(new Error('No ActivatedImage found.'))

    // Load images
    return Promise.all([
      ProgressImage.waitForImage(this.vatomView.blockv.UserManager.encodeAssetProvider(baseImg.value.value)),
      ProgressImage.waitForImage(this.vatomView.blockv.UserManager.encodeAssetProvider(activatedImg.value.value))
    ]).then((imgs) => {
      this.images = imgs;
      this.onResize();
      this.fill.style.backgroundImage = `url(${this.vatomView.blockv.UserManager.encodeAssetProvider(activatedImg.value.value)})`
    })
  }

  /** This returns a promise which resolves when the specified
   * image URL has been downloaded by the browser. */
  static waitForImage(url) {
    return new Promise((resolve, reject) => {
      // Create new image tag to do the loading. Browsers cache requests together, so by
      // creating a new image tag and loading the same image in it, we can track the load
      // event of the background-image in the div above.
      const img = document.createElement('img')

      // Add event handlers
      img.onerror = reject
      img.onload = () => resolve(img)

      img.src = url
    })
  }
}
