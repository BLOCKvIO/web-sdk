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

export default class VideoFace extends BaseFace {
  // eslint-disable-next-line
  constructor(vatomView, vatom, face) {
    super(vatomView, vatom, face);
    this.onLoad();
  }

  onLoad() {
    // eslint-disable-next-line
    return this.updateVideo();
  }

  updateVideo() {
    // Set video display options
    // this.element.style.backgroundSize = 'contain';
    // this.element.style.backgroundPosition = 'center';
    // this.element.style.backgroundRepeat = 'no-repeat';

    // Get resource name
    const resourceName = 'Video';
    // Get resource
    const resource = this.vatom.properties.resources.find(r => r.name === resourceName);
    // TODO: Show warning if no resource found
    if (!resource) {
      return Promise.reject(new Error('No video found to display.'));
    }
    // Display URL
    const iurl = this.vatomView.blockv.UserManager.encodeAssetProvider(resource.value.value);

    // Return promise
    return this.showVideo(iurl);
  }
  // eslint-disable-next-line
  showVideo(url) {
    return new Promise((onSuccess, onFail) => {
      const videlem = document.createElement('video');
      const sourceMP4 = document.createElement('source');
      videlem.controls = true;
      videlem.autoplay = true;
      sourceMP4.type = 'video/mp4';
      sourceMP4.src = url;
      videlem.appendChild(sourceMP4);
      this.element.appendChild(videlem);
      videlem.onload = onSuccess;
      videlem.onerror = onFail;
    });
  }

  static get url() {
    return 'native://video';
  }
}
