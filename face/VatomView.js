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
const FaceSelection = require('./FaceSelection');
const ProgressImage = require('./faces/ProgressImage');
const ImageFace = require('./faces/ImageFace');

// list registered faces
let registeredFace = {
  'native://image': ImageFace,
  'native://progress-image-overlay': ProgressImage,
};

module.exports = class VatomView {
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
    this.createLoader = this.config.loader || function()  {
      let loader = document.createElement('div');
      loader.style.cssText = 'position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;';
      loader.innerHTML = '<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid" class="lds-double-ring"><circle cx="50" cy="50" ng-attr-r="{{config.radius}}" ng-attr-stroke-width="{{config.width}}" ng-attr-stroke="{{config.c1}}" ng-attr-stroke-dasharray="{{config.dasharray}}" fill="none" stroke-linecap="round" r="40" stroke-width="4" stroke="#456caa" stroke-dasharray="62.83185307179586 62.83185307179586" transform="rotate(305.714 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle><circle cx="50" cy="50" ng-attr-r="{{config.radius2}}" ng-attr-stroke-width="{{config.width}}" ng-attr-stroke="{{config.c2}}" ng-attr-stroke-dasharray="{{config.dasharray2}}" ng-attr-stroke-dashoffset="{{config.dashoffset2}}" fill="none" stroke-linecap="round" r="35" stroke-width="4" stroke="#88a2ce" stroke-dasharray="54.97787143782138 54.97787143782138" stroke-dashoffset="54.97787143782138" transform="rotate(-305.714 50 50)"><animateTransform attributeName="transform" type="rotate" calcMode="linear" values="0 50 50;-360 50 50" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animateTransform></circle></svg>';
      return loader
    }

    this.createErrorView = this.config.errorView || function (bvi, v, err) {
      
      let con = document.createElement('div');
      const rN = 'ActivatedImage';
      const rs = v.properties.resources.find(r => r.name === rN);
      const du = rs && bvi.UserManager.encodeAssetProvider(rs.value.value);
      con.style.backgroundSize = 'contain';
      con.style.backgroundPosition = 'center';
      con.style.backgroundRepeat = 'no-repeat';
      con.style.backgroundImage = `url('${du}')`;
      con.style.width = '100%';
      con.style.height = '100%';

      let errorView = document.createElement('div');
      
      errorView.style.cssText = 'position: absolute; top: 0px; right: 0px; padding-right: 5px; padding-top: 5px;';
      errorView.innerHTML = '<img width="20" height="20" src="data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ5Ny40NzIgNDk3LjQ3MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDk3LjQ3MiA0OTcuNDcyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjUxMnB4IiBoZWlnaHQ9IjUxMnB4Ij4KPGcgdHJhbnNmb3JtPSJtYXRyaXgoMS4yNSAwIDAgLTEuMjUgMCA0NSkiPgoJPGc+CgkJPGc+CgkJCTxwYXRoIHN0eWxlPSJmaWxsOiNGRkNDNEQ7IiBkPSJNMjQuMzc0LTM1Ny44NTdjLTIwLjk1OCwwLTMwLjE5NywxNS4yMjMtMjAuNTQ4LDMzLjgyNkwxODEuNDIxLDE3LjkyOCAgICAgYzkuNjQ4LDE4LjYwMywyNS40NjMsMTguNjAzLDM1LjEyMywwTDM5NC4xNC0zMjQuMDMxYzkuNjcxLTE4LjYwMywwLjQyMS0zMy44MjYtMjAuNTQ4LTMzLjgyNkgyNC4zNzR6Ii8+CgkJCTxwYXRoIHN0eWxlPSJmaWxsOiMyMzFGMjA7IiBkPSJNMTczLjYwNS04MC45MjJjMCwxNC44MTQsMTAuOTM0LDIzLjk4NCwyNS4zOTUsMjMuOTg0YzE0LjEyLDAsMjUuNDA3LTkuNTEyLDI1LjQwNy0yMy45ODQgICAgIFYtMjE2Ljc1YzAtMTQuNDYxLTExLjI4Ny0yMy45ODQtMjUuNDA3LTIzLjk4NGMtMTQuNDYxLDAtMjUuMzk1LDkuMTgyLTI1LjM5NSwyMy45ODRWLTgwLjkyMnogTTE3MS40ODktMjg5LjA1NiAgICAgYzAsMTUuMTY3LDEyLjM0NSwyNy41MTEsMjcuNTExLDI3LjUxMWMxNS4xNjcsMCwyNy41MjMtMTIuMzQ1LDI3LjUyMy0yNy41MTFjMC0xNS4xNzgtMTIuMzU2LTI3LjUyMy0yNy41MjMtMjcuNTIzICAgICBDMTgzLjgzNC0zMTYuNTc5LDE3MS40ODktMzA0LjIzNCwxNzEuNDg5LTI4OS4wNTYiLz4KCQk8L2c+Cgk8L2c+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPGc+CjwvZz4KPC9zdmc+Cg==" />';
      
      errorView.addEventListener('click', e => alert(err.message), false);

     
      con.appendChild(errorView);

      return con;
    
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
    // reset errorview and loader
    if (this.loader && this.loader.parentNode) {
      this.loader.parentNode.removeChild(this.loader);
    }
    if (this.errorView && this.errorView.parentNode) {
      this.errorView.parentNode.removeChild(this.errorView);
    }
    this.loader = null;
    this.errorView = null;

    let rFace = null;
    Promise.resolve(() => null).then(() => {
    // start the face selection procedure
      const st = this.fsp(this.vatomObj);
      // check if face is registered
      const du = st.properties.display_url.toLowerCase();
      let FaceClass = registeredFace[du];
     
      // if there is no face registered in the array but we have a http link, show the web face
      if (FaceClass === undefined && du.indexOf('http') !== -1) {
        FaceClass = ImageFace;
      } else if (FaceClass === undefined) {
        throw new Error('No Face Registered');
      }
      // create a new instance of the chosen face class and pass through the information
      rFace = new FaceClass(this, this.vatomObj, st);
      this._currentFace = rFace;
      // make rface opaque
      rFace.element.style.opacity = 0;

      // add face to element
      this.element.appendChild(rFace.element);

      // add the loader
      this.element.appendChild(this.loader = this.createLoader());

      // check for error
      
      // call rface.onload , wait for promise
      return rFace.onLoad();
    }).then(() => {
      if(this.loader) {
        this.element.removeChild(this.loader);
        rFace.element.style.opacity = 1;
      }
     
    }).catch((err) => {
      // remove current face
      this.element.appendChild(this.errorView = this.createErrorView(this.blockv, this.vatom, err));
      if (rFace && rFace.element) {
        this.element.removeChild(rFace.element);
      }
      if (this.loader && this.loader.parentNode) {
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
