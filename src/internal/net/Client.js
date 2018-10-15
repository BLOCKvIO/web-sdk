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
const popsicle = require('popsicle');
const jwtDecode = require('jwt-decode');
const BaseResponse = require('./rest/response/BaseResponse');

class Client {
  constructor(store) {
    this.store = store;
  }

  request(method, endpoint, payload, auth, headers) {
    if (auth) {
      return this.checkToken().then(() => this.authRequest(method, endpoint, payload, headers));
      // eslint-disable-next-line no-else-return
    } else {
      return this.authRequest(method, endpoint, payload, headers);
    }
  }


  authRequest(method, endpoint, payload, headers) {
    const header = Object.assign({
      'App-Id': this.store.appID,
      Authorization: `Bearer ${this.store.token}`,
      'Content-Type': 'application/json',
    }, headers);

    return popsicle.request({
      method,
      url: this.store.server + endpoint,
      body: payload,
      headers: header,

    }).use(popsicle.plugins.parse('json'))
      .then((res) => {
        const response = Object.assign(new BaseResponse(), res.body);
        response.httpStatus = res.status;
        return response;
      }).then((response) => {
        // Check for server error
        if (!response.payload) {
          const ErrorCodes = {
            2: 'Blank App ID',
            11: 'Problem with payload',
            17: 'invalid App ID',
            401: 'Token has Expired',
            516: 'Invalid Payload',
            517: 'Invalid Payload',
            521: 'Token Unavailable',
            527: 'Invalid Date Format',
            1004: 'Invalid Request Payload',
            1701: 'vAtom Unrecognized',
            1708: 'vAtom Unvailable',
            2030: 'No user found, Please register an account first.',
            2031: 'Authentication Failed',
            2032: 'Login Failed, Please try again',
            2034: 'Invalid Token',
            2037: 'Upload Avatar Failed',
            2049: 'Refresh Token Expired / Not Whitelisted',
            2051: 'Too many login attempts, Please try again later.',
            2552: 'Unable To Retrieve Token',
            2553: 'Token ID Invalid',
            2562: 'Cannot Delete Primary Token',
            2563: 'Token Already Confirmed',
            2564: 'Invalid Verification Code',
            2566: 'Token Already Confirmed',
            2567: 'Invalid Verification Code',
            2569: 'Invalid Token Type',
            2571: 'Invalid Email',
            2572: 'Invalid Phone Number',
          };

          if (response.error === 2051) {
            // Check for the special login locked error
            // We need to pull the timestamp that is in the reponse.message to show when they
            // can login agin

            // HACK: Pull time from original server error string
            const dateString = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g.exec(response.message);
            response.lockedUntil = new Date(dateString);

            // Replace duration in the error message
            let duration = response.lockedUntil.getTime() - Date.now();
            if (duration < 2000) duration = 2000;
            const seconds = Math.floor(duration / 1000);
            const minutes = Math.floor(duration / 1000 / 60);
            if (seconds <= 90) {
              response.message = response.message.replace('%DURATION%', seconds === 1 ? '1 second' : `${seconds}  seconds`);
            } else {
              response.message = response.message.replace('%DURATION%', minutes === 1 ? '1 minute' : `${minutes} minutes`);
            }
            // Rethrow error
            const error = new Error(`Too many login attempts, Try again at : ${response.lockedUntil}`);
            error.code = response.error || 0;
            throw error;
          } else {
            const error = new Error(ErrorCodes[response.error] || response.message || 'An unknown server error has occurred');
            error.code = response.error || response.httpStatus || 0;
            error.httpStatus = response.httpStatus;
            throw error;
          }
        }

        // No error, continue
        return response.payload;
      });
  }

  /**
  * Refresh's the users access token
  * @return JSON save the token with the bearer.
  */
  refreshToken() {
    const options = {
      Authorization: `Bearer ${this.store.refreshToken}`,
    };
    return this.request('POST', '/v1/access_token', '', false, options).then((data) => {
      this.store.token = data.access_token.token;
    });
  }

  checkToken() {
    // define our vars
    let decodedToken;
    let nowDate;
    let expirationTime;

    try {
      decodedToken = jwtDecode(this.store.token);
      expirationTime = (decodedToken.exp * 1000);
      nowDate = Date.now();

      // quick calc to determine if the token has expired
      if ((nowDate + 5000) > expirationTime) {
        return this.refreshToken();
        // eslint-disable-next-line no-else-return
      } else {
        return Promise.resolve(true);
      }
    } catch (e) {
      return this.refreshToken();
    }
  }
}
export default Client;
