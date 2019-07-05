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
  Icon: vatom => vatom.faces.find(v => v.properties.constraints.view_mode === 'icon'),
  Engaged: vatom => vatom.faces.find(v => v.properties.constraints.view_mode === 'engaged') || vatom.faces.find(v => v.properties.constraints.view_mode === 'icon'),
  Fullscreen: vatom => vatom.faces.find(v => v.properties.constraints.view_mode === 'fullscreen'),
  Card: vatom => vatom.faces.find(v => v.properties.constraints.view_mode === 'card')
}
