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
import BaseFace from './BaseFace';

export default class ImageFace extends BaseFace {
  // eslint-disable-next-line
  constructor(vatomView, vatom, face) {
    super(vatomView, vatom, face);
    this.onLoad();
  }

  onLoad() {
    // eslint-disable-next-line
    return this.updateImage();
  }

  updateImage() {
    // Set image display options
    this.element.style.backgroundSize = 'contain';
    this.element.style.backgroundPosition = 'center';
    this.element.style.backgroundRepeat = 'no-repeat';

    // Get resource name
    const resourceName = 'ActivatedImage';

    // Get resource
    const resource = this.vatom.properties.resources.find(r => r.name === resourceName);
    // TODO: Show warning if no resource found
    if (!resource) {
      return Promise.reject(new Error('No image found to display.'));
    }
    // Display URL
    const iurl = this.vatomView.blockv.UserManager.encodeAssetProvider(resource.value.value);
    this.element.style.backgroundImage = `url('${iurl}')`;

    // Return promise
    return this.showImage(iurl);
  }
  // eslint-disable-next-line
  showImage(url) {
    return new Promise((onSuccess, onFail) => {
      const img = document.createElement('img');
      img.src = url;
      img.onload = onSuccess;
      img.onerror = onFail;
    });
  }

  static get url() {
    return 'native://image';
  }
}
