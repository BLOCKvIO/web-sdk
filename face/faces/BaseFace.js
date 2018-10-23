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

/* eslint-disable class-methods-use-this */

module.exports = class BaseFace {
  constructor(vatomView, vatom, face) {
    // Store info
    this.vatomView = vatomView;
    this.vatom = vatom;
    this.face = face;

    // Create element
    this.element = document.createElement('div');
    this.element.style.position = 'relative';
    this.element.style.width = '100%';
    this.element.style.height = '100%';
  }


  onLoad() {}

  onUnload() {}

  onVatomUpdated() {}
}
