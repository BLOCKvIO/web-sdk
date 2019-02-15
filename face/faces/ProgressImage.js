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

const BaseFace = require('./BaseFace');

module.exports = class ProgressImage extends BaseFace {
  constructor(vatomView, vatom, face){
    super();
    this.face = face;
    this.vatom = vatom;
    this.vatomView = vatomView;
    this.biWidth = 0;
    this.biHeight = 0;
    this.fiWidth = 0;
    this.fiHeight = 0;
    
    this.onResize = this.onResize.bind(this)
    this.base = document.createElement('div');
    this.fill = document.createElement('div');
    this.fillContainer = document.createElement('div');
    this.percentContainer = document.createElement('div');
  }
  
  onLoad() {
    window.addEventListener("resize", this.onResize);
    // Set our element style
    this.element.style.overflow = 'hidden';

    // Create base image
    this.base.style.cssText = 'position: relative; background-position: center; background-size: contain; background-repeat: no-repeat; ';
    this.element.appendChild(this.base);

    // Create fill container element
    this.fillContainer.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%; overflow: hidden;';
    this.element.appendChild(this.fillContainer);

    // Create fill image
    this.fill.style.cssText = 'position: relative; background-position: center; background-size: contain; background-repeat: no-repeat;';
    this.fillContainer.appendChild(this.fill);

    // Create Image Percent Container
    this.percentContainer.style.cssText = 'position:absolute; top: 0px; right: 0px; width:auto; height:auto; padding:5px; font-size:9px; color: rgba(0,0,0,0.5)';
    this.element.appendChild(this.percentContainer);


    // Reload images
    return this.refresh();
  }

  onVatomUpdated() {
    return this.refresh();
  }

  

  static calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {

    let ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);

    return { width: srcWidth*ratio, height: srcHeight*ratio };
  }

  /** Refresh the face position and images. @returns Promise */
  refresh() {
    // Apply base image
    const baseImg = (this.face.properties.config && this.face.properties.config.empty_image && this.vatom.properties.resources.find(r => r.name === this.face.properties.config.empty_image)) || this.vatom.properties.resources.find(r => r.name === 'BaseImage');
    if (!baseImg) return Promise.reject(new Error('No BaseImage found.'));
    
    // get image then get dimensions and aspect ratio
    const maxwidth = this.element.clientWidth;
    const maxheight = this.element.clientHeight;
    let bi = new Image();
    bi.onload = function(){
      this.biWidth = bi.width;
      this.biHeight = bi.height;
      let resp = ProgressImage.calculateAspectRatioFit(bi.width, bi.height, maxwidth, maxheight);
      this.base.style.cssText += `width:${resp.width}px; height: ${resp.height}px; top:0; bottom:0; left:0; right:0; margin:auto;`;
    }.bind(this);
    bi.src = this.vatomView.blockv.UserManager.encodeAssetProvider(baseImg.value.value);
    this.base.style.backgroundImage = `url(${bi.src})`;
    
    
    // Apply fill image
    const activatedImg = (this.face.properties.config && this.face.properties.config.full_image && this.vatom.properties.resources.find(r => r.name === this.face.properties.config.full_image)) || this.vatom.properties.resources.find(r => r.name === 'ActivatedImage');
    if (!activatedImg) return Promise.reject(new Error('No ActivatedImage found.'));
    
    // get image then get dimensions and aspect ratio
    // get image then get dimensions and aspect ratio
    let fi = new Image();
    fi.onload = function(){
      this.fiWidth = fi.width;
      this.fiHeight = fi.height;
      let resp = ProgressImage.calculateAspectRatioFit(fi.width, fi.height, maxwidth, maxheight);
      this.fill.style.cssText += `width:${resp.width}px; height: ${resp.height}px;  top:0; bottom:0; left:0; right:0; margin: auto;`;
    }.bind(this);
    fi.src = this.vatomView.blockv.UserManager.encodeAssetProvider(activatedImg.value.value);
    this.fill.style.backgroundImage = `url(${fi.src})`;

    // Load images
    return Promise.all([
      ProgressImage.waitForImage(this.vatomView.blockv.UserManager.encodeAssetProvider(baseImg.value.value)),
      ProgressImage.waitForImage(this.vatomView.blockv.UserManager.encodeAssetProvider(activatedImg.value.value)),
    ]).then((imgs) => {
      // Get info
      const score = Math.floor(Math.min(1, Math.max(0, parseFloat(this.vatom.properties.cloning_score) || 0)) * 100);
      let paddingStart = parseFloat( this.face.properties.config && this.face.properties.config.padding_start || this.vatom.private.padding_start) || 0;
      let paddingEnd = parseFloat(this.face.properties.config && this.face.properties.config.padding_end || this.vatom.private.padding_end) || 0;
      const direction = (this.face.properties.config && this.face.properties.config.direction || this.vatom.private.direction || '').toLowerCase();

      // Adjust padding to be percents instead of pixels of base image
      if (direction === 'up' || direction === 'down') {
        paddingStart = paddingStart / imgs[0].height * 100;
        paddingEnd = paddingEnd / imgs[0].height * 100;
      } else {
        paddingStart = paddingStart / imgs[0].width * 100;
        paddingEnd = paddingEnd / imgs[0].width * 100;
      }

      // Apply padding
      const range = 100 - paddingStart - paddingEnd;
      const paddedScore = Math.floor(score / 100 * range + paddingStart);
      if(this.face.properties.config && this.face.properties.config.show_percentage || this.vatom && this.vatom.private.show_percentage) {
        this.percentContainer.innerText = score + '%';
      }
       
      // Apply styles to make it fill up
      const invertedScore = 100 - paddedScore;
      if (direction === 'up') {
        // Filling from the bottom up
        this.fillContainer.style.top = `${invertedScore}%`;
        this.fill.style.top = `${(-1 * invertedScore)}%`;
      } else if (direction === 'down') {
        // Filling from the top down
        this.fillContainer.style.top = `${(-1 * invertedScore)}%`;
        this.fill.style.top = `${invertedScore}%`;
      } else if (direction === 'right') {
        // Filling from the left to the right
        this.fillContainer.style.left = `${(-1 * invertedScore)}%`;
        this.fill.style.left = `${invertedScore}%`;
      } else if (direction === 'left') {
        // Filling from the right to the left
        this.fillContainer.style.left = `${invertedScore}%`;
        this.fill.style.left = `${(-1 * invertedScore)}%`;
      }
    });
  }

  /** This returns a promise which resolves when the specified 
   * image URL has been downloaded by the browser. */
  static waitForImage(url) {
    return new Promise((onSuccess, onFail) => {
      // Create new image tag to do the loading. Browsers cache requests together, so by
      // creating a new image tag and loading the same image in it, we can track the load
      // event of the background-image in the div above.
      const img = document.createElement('img');
      img.src = url;

      // Add event handlers
      img.onerror = onFail;
      img.onload = () => {
        onSuccess(img);
      }
    });
  }

  onResize() {
    // get aspect ratios and resize accordingly
    let baseAspectRatio = ProgressImage.calculateAspectRatioFit(this.biWidth, this.biHeight, this.element.clientWidth,this.element.clientHeight)
    let fillAspectRatio = ProgressImage.calculateAspectRatioFit(this.fiWidth, this.fiHeight, this.element.clientWidth, this.element.clientHeight);
    // set width and height of containers
    this.base.style.cssText += `width: ${Math.floor(baseAspectRatio.width)}px; height: ${Math.floor(baseAspectRatio.height)}px`;
    this.fill.style.cssText += `width: ${Math.floor(fillAspectRatio.width)}px; height: ${Math.floor(fillAspectRatio.height)}px`;
  }
};
