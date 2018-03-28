const REFRESH_TOKEN_STORAGE_KEY = "blockv.web_sdk.refresh_token";
const ASSET_PROVIDER_STORAGE_KEY = "blockv.web_sdk.asset_provider";

export default class Store {

  static get server() {
    return this.serverAddress; // {{ SERVER }}
  }

  static set server(address) {
    this.serverAddress = address;
  }
  static get appID() {
    return this.APPID; //{{APPID}}
  }
  static set appID(appid) {
    this.APPID = appid;
  }

  static get websocketAddress() {
    return this.wssocketAddress;
  }

  static set websocketAddress(websocAddress) {
    this.wssocketAddress = websocAddress;
  }

  static set token(token) {
    this.accessToken = token;
  }

  static get token() {
    return this.accessToken;
  }

  static set refreshToken(refresh) {
    window.localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refresh);
  }

  static get refreshToken() {
    let rT = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
    return rT;
  }

  static set assetProvider(provider) {
    window.localStorage.setItem(ASSET_PROVIDER_STORAGE_KEY, JSON.stringify(provider));
  }

  static get assetProvider() {
    let assetProviderObjStr = window.localStorage.getItem(ASSET_PROVIDER_STORAGE_KEY);

    // return `undefined` as the asset provider object if it has not
    // previously been saved in localStorage
    if (assetProviderObjStr === null) {
      return undefined;
    }

    return JSON.parse(assetProviderObjStr);
  }

}