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
module.exports = class Store {
  constructor(prefix) {
    this.prefix = prefix;
  }

  get server() {
    return this.serverAddress;
  }

  set server(address) {
    this.serverAddress = address;
  }

  set userID(userid) {
    this.USERID = userid;
  }

  get userID() {
    return this.USERID;
  }

  get appID() {
    return this.APPID;
  }

  set appID(appid) {
    this.APPID = appid;
  }

  get websocketAddress() {
    return this.wssocketAddress;
  }

  set websocketAddress(websocAddress) {
    this.wssocketAddress = websocAddress;
  }

  set token(token) {
    this.accessToken = token;
  }

  get token() {
    return this.accessToken;
  }

  set refreshToken(refresh) {
    this.privateRefreshToken = refresh;
    if (typeof localStorage !== 'undefined') {
      // eslint-disable-next-line no-undef
      localStorage.setItem(`${this.prefix}_refresh`, refresh);
    }
  }

  get refreshToken() {
    if (this.privateRefreshToken) {
      return this.privateRefreshToken;
    }
    if (typeof localStorage !== 'undefined') {
      // eslint-disable-next-line no-undef
      const rT = localStorage.getItem(`${this.prefix}_refresh`);
      if (rT) {
        return rT;
      }
    }
    return null;
  }

  set assetProvider(provider) {
    this.privateAssetProvider = provider;
    if (typeof localStorage !== 'undefined') {
      // eslint-disable-next-line no-undef
      localStorage.setItem(`${this.prefix}_asset_provider`, JSON.stringify(provider));
    }
  }

  get assetProvider() {
    if (this.privateAssetProvider) {
      return this.privateAssetProvider;
    }
    if (typeof localStorage !== 'undefined') {
      // eslint-disable-next-line no-undef
      const aP = JSON.parse(localStorage.getItem(`${this.prefix}_asset_provider`) || 'undefined');
      if (aP) {
        return aP;
      }
    }
    return null;
  }
};
