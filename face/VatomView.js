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
import FaceSelection from './FaceSelection';
import ImageFace from './faces/ImageFace';


// list registered faces
let registeredFace = {
  'native://image': ImageFace,
};

export default class VatomView {
  constructor(bv, vAtom, FSP, config) {
    this.blockv = bv;
    this.vatomObj = vAtom;
    this.fsp = FSP || FaceSelection.Icon;
    this.config = config || {};
    // eslint-disable-next-line
    this._currentFace = {};

    // create a default view with a div container
    // eslint-disable-next-line
    this.element = document.createElement('div');
    this.element.style.position = 'relative';
    this.element.style.width = this.config.width || '64px';
    this.element.style.height = this.config.height || '64px';

    // create loader
    if (this.config.loader) {
      this.loader = this.config.loader;
    } else {
      this.loader = document.createElement('div');
      this.loader.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;';
      this.loader.innerHTML = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-double-ring"><circle cx="50" cy="50" ng-attr-r="{{config.radius}}" ng-attr-stroke-width="{{config.width}}" ng-attr-stroke="{{config.c1}}" ng-attr-stroke-dasharray="{{config.dasharray}}" fill="none" stroke-linecap="round" r="40" stroke-width="4" stroke="#456caa" stroke-dasharray="62.83185307179586 62.83185307179586" transform="rotate(305.714 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle><circle cx="50" cy="50" ng-attr-r="{{config.radius2}}" ng-attr-stroke-width="{{config.width}}" ng-attr-stroke="{{config.c2}}" ng-attr-stroke-dasharray="{{config.dasharray2}}" ng-attr-stroke-dashoffset="{{config.dashoffset2}}" fill="none" stroke-linecap="round" r="35" stroke-width="4" stroke="#88a2ce" stroke-dasharray="54.97787143782138 54.97787143782138" stroke-dashoffset="54.97787143782138" transform="rotate(-305.714 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;-360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>';
    }

    this.update();
  }

  update() {
    // Check if ready to be displayed
    if (!this.vatomObj) {
      console.warn('No vAtom supplied');
    } else {
      this.free();
      this.load();
    }
  }

  load() {
    let rFace = null;
    Promise.resolve(() => null).then(() => {
    // start the face selection procedure
      const st = this.fsp(this.vatomObj.faces);
      // check if face is registered
      const du = st.properties.display_url.toLowerCase();
      let FaceClass = registeredFace[du];
      // if there is no face registered in the array but we have a http link, show the web face
      if (FaceClass === undefined && du.indexOf('http') !== -1) {
        FaceClass = ImageFace;
      } else if (FaceClass === undefined) {
        // display activated Image in the case that the face is undefined!
        FaceClass = ImageFace;
      }
      // create a new instance of the chosen face class and pass through the information
      rFace = new FaceClass(this, this.vatomObj, st);
      this._currentFace = rFace;
      // make rface opaque
      rFace.element.style.opacity = 0;

      // add face to element
      this.element.appendChild(rFace.element);

      // add the loader
      this.element.appendChild(this.loader);
      // call rface.onload , wait for promise
      return rFace.onLoad();
    }).then(() => {
      this.element.removeChild(this.loader);
      rFace.element.style.opacity = 1;
    }).catch((err) => {
      // remove current face
      if (rFace && rFace.element) {
        this.element.removeChild(rFace.element);
      }
      console.warn(err);
      const iFace = new ImageFace(this, this.vatomObj, null);
      this._currentFace = iFace;
      this.element.appendChild(iFace.element);
      if (this.loader.parentNode) {
        this.element.removeChild(this.loader);
      }
    });
  }

  set vatom(vAtom) {
    if (vAtom) {
      this.vatomObj = vAtom;
      this.update();
    }
  }

  get vatom() {
    return this.vatomObj;
  }

  free() {
    if (this._currentFace && this._currentFace.onUnload) {
      this._currentFace.onUnload();
    }

    const view = this.element;
    while (view.firstChild) {
      view.removeChild(view.firstChild);
    }
  }

  // register our own face
  static registerFace(faceClass) {
    registeredFace[faceClass.url.toLowerCase()] = faceClass;
  }
}
