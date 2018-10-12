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
/* eslint-disable no-use-before-define */
export default {
  Icon: vatom => start(vatom, 'icon'),
  Engaged: vatom => start(vatom, 'engaged'),
  Fullscreen: vatom => start(vatom, 'fullscreen'),
  Card: vatom => start(vatom, 'card'),
};

function start(vatom, viewmode) {
  // get the faces & vatoms array
  // create a best face array
  const bf = [];
  // define what is native
  const native = 'web';
  const farray = vatom.faces;
  // loop through the faces
  // eslint-disable-next-line
    for(let face of farray) {
    // set base rating
    let rate = 0;
    // set default viewmode
    // const viewmode = this.viewMode.toLowerCase() || 'icon';
    // create a rating switch
    switch (face.properties.constraints.platform) {
      case native:
        rate += 2;
        break;
      case 'generic':
        rate += 1;
        break;
      default:
        rate -= 1;
        break;
    }
    // additional rating bonus
    if (face.properties.constraints.view_mode === viewmode) {
      rate += 2;
    } else {
      rate -= 1;
    }
    // filter out non-rated items or items that are not benificial for our platform
    if (rate > 0) {
      bf.push({ face, rate });
    }
  }
  // return the best face available
  // eslint-disable-next-line
  let best = bf.reduce((max, p) => p.rate > max.rate ? p : max, bf[0]);
  console.log(best);
  return best && best.face;
}
