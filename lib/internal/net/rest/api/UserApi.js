import Client from '../../Client';
import Store from '../../../repo/Store';
import User from '../../../../model/User';

export default class UserApi {

  /**
   * Registers a user on the Blockv platform.
   *
   * @param registration contains properties of the user. Only the properties to be registered should be set.
   * @return new Observable<User> instance
   */

  static getAccessToken() {
    let a = Store.token;
    let ra = window.localStorage.getItem('refresh');
    return Store.token;
  }

  static setAccessToken(token) {
    Store.token = '';
    Store.token = token;
    console.log("Access Token changed to  :" + token);
  }

  static getRefreshToken() {
    return Store.refreshToken;
  }

  static setRefreshToken(token) {
    Store.token = '';
    Store.refreshToken = token;
    console.log('Refresh Token changed to : ' + token);
  }

  static register(registration) {

    return Client.request('POST', '/v1/users', registration, false).then(data => {
      Store.token = data.access_token.token;
      Store.refreshToken = data.refresh_token.token;
      return data;
    }).then(data => new User(data));
  }

  /**
   * Logs a user into the Blockv platform. Accepts a user token (phone or email).
   *
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @param password the user's password.
   * @return JSON Object
   */

  static login(token, tokenType, password) {

    let payload = {
      token: token,
      token_type: tokenType,
      auth_data: {
        password: password
      }
    };

    return Client.request('POST', '/v1/user/login', payload, false).then(data => {

      if (!password) {
        let error = new Error('Login Failed, Password Reset');
        error.code = "PASSWORD_RESET";
        throw error;
      } else {
        console.log(data);
        Store.token = data.access_token.token;
        Store.refreshToken = data.refresh_token.token;
        Store.assetProvider = data.asset_provider;
        return data;
      }
    }).then(data => new User(data));
  }

  /**
  * Logs a user into the Blockv platform. Accepts a guest id
  *
  * @param guestId the user's guest id.
  * @return JSON Object
  */
  static loginGuest(guestId) {
    let payload = {
      "token": guestId,
      "token_type": "guest_id"
    };
    return Client.request('POST', '/v1/user/login', payload, false).then(data => {

      console.log(data);
      Store.token = data.access_token.token;
      Store.refreshToken = data.refresh_token.token;
      Store.assetProvider = data.asset_provider;
      return data;
    }).then(data => new User(data));
  }

  /**
  * Logs a user into the Blockv platform. Accepts an OAuth token.
  *
  * @param provider the OAuth provider, e.g. Facebook.
  * @param oauthToken the OAuth token issued by the OAuth provider.
  * @return JSON Object
  */
  static loginOAuth(provider, oauthToken) {
    //waiting for a server fix before this one gets any more work!

  }

  static uploadAvatar(request) {

    //get file
    //change to formData
    //submit formData with new header
    let avatarHeader = {
      'Content-Type': 'multipart/form-data'
    };
    Client.request('POST', '/v1/user/avatar', request, true, avatarHeader);
  }

  /**
  * Fetches the current user's profile information from the Blockv platform.
  *
  * @return JSON Object
  */

  static getCurrentUser(payload) {

    //get the current authenticated in user

    return Client.request('GET', '/v1/user', payload, true).then(data => {
      console.log(data);
      return data;
    });
  }

  /**
  * Updates the current user's profile on the Blockv platform.
  *
  * @param update holds the properties of the user, e.g. their first name. Only the properties to be updated should be set.
  * @return JSON Object
  */
  static updateUser(update) {

    return Client.request("PATCH", '/v1/user', update, true);
  }

  /**
   * Gets a list of the current users tokens
   * @return JSON Object
   */

  static getUserTokens() {

    Client.request('GET', '/v1/user/tokens', '', true);
  }

  /**
   * Verifies ownership of a token by submitting the verification code to the Blockv platform.
   *
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @param code the verification code send to the user's token (phone or email).
   * @return JSON Object
   */
  static verifyUserToken(verification) {

    return Client.request('POST', '/v1/user/verify_token', verification, true);
  }

  /**
  * Sends a verification code to the user's token (phone or email).
  *
  * This verification code should be used to verifiy the user's ownership of the token (phone or email).
  *
  * @param token the user's phone(E.164) or email
  * @param tokenType the type of the token (phone or email)
  * @return JSON Object
  */
  static resendVerification(token, tokenType) {

    let payload = {
      "token": token,
      "token_type": tokenType
    };

    Client.request('POST', '/v1/user/reset_token', payload, true);
  }
  /**
   * Sends a One-Time-Pin (OTP) to the user's token (phone or email).
   *
   * This OTP may be used in place of a password to login.
   *
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @return JSON Object
   */
  static resetToken(token, tokenType) {

    let payload = {
      "token": token,
      "token_type": tokenType
    };

    Client.request('POST', '/v1/user/reset_token', payload, true);
  }

  static resetTokenVerification(token, tokenType) {

    let payload = {
      "token": token,
      "token_type": tokenType
    };
    Client.request('POST', '/v1/user/reset_token_verification', payload, true);
  }

  /**
   * Log out the current user.
   *
   * The current user will not longer be authorized to perform user scoped requests on the Blockv platfrom.
   *
   * @return new JSON
   */
  static logout(params) {
    Client.request('POST', '/v1/user/logout', params, true).then(function () {
      console.log('User has been logged out!');
      Store.token = '';
      Store.refreshToken = '';
    });
  }

  static extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
      hostname = url.split('/')[2];
    } else {
      hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
  }

  static encodeAssetProvider(url) {
    let aP = JSON.parse(JSON.stringify(Store.assetProvider));
    let aPlen = aP.length;
    let compare = this.extractHostname(url);

    for (let i = 0; i < aPlen; i++) {
      let comparethis = this.extractHostname(aP[i].uri);
      if (compare === comparethis) {
        let total = 0;
        //same uri so get the policy signature and key and append
        for (let a in aP[i].descriptor) {
          if (total === 0) {
            url += '?' + a + "=" + aP[i].descriptor[a];
          } else {
            url += '&' + a + "=" + aP[i].descriptor[a];
          }
          total++;
        }
        return url;
      }
    }
  }

  static addUserToken(payload) {
    /**
     * payload is
     * {
     * "token": "another.email@domain.com",
     * "token_type": "email",
     * "is_primary": false
     * }
     */
    return Client.request('POST', 'v1/user/tokens', payload, true);
  }

}