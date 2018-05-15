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
export default class Store {

    static get server(){
      return this.serverAddress // {{ SERVER }}
    }

    static set server(address){
      this.serverAddress = address;
    }
    static get appID(){
      return this.APPID //{{APPID}}
    }
    static set appID(appid){
      this.APPID = appid
    }

    static get websocketAddress(){
      return this.wssocketAddress
    }

    static set websocketAddress(websocAddress){
      this.wssocketAddress = websocAddress;
    }

    static set token(token){
      this.accessToken = token;
    }

    static get token(){
      return this.accessToken;
    }

    static set refreshToken(refresh){
      window.localStorage.setItem('refresh', refresh);
    }

    static get refreshToken(){
      let rT = window.localStorage.getItem('refresh');
      return rT;
    }

    static set assetProvider(provider){
      window.localStorage.setItem('asset_provider', JSON.stringify(provider));
    }

    static get assetProvider(){
      let aP = JSON.parse(window.localStorage.getItem('asset_provider') || 'undefined');
      return aP;
    }





}
