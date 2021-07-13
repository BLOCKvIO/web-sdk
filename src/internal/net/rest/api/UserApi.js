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

import urlParse from 'url-parse'
import User from '../../../../model/User'

export default class UserApi {
  constructor (bv) {
    this.Blockv = bv
    this.client = bv.client
    this.store = bv.store
    this.dataPool = bv.dataPool
  }

  /**
   * Registers a user on the Blockv platform.
   *
   * @param registration contains properties of the user.
   *                     Only the properties to be registered should be set.
   * @return new Observable<User> instance
   */

  getAccessToken () {
    return this.store.token
  }

  setAccessToken (token) {
    this.store.token = ''
    this.store.token = token
  }

  getRefreshToken () {
    return this.store.refreshToken
  }

  setRefreshToken (token) {
    this.store.token = ''
    this.store.refreshToken = token
  }

  register (registration) {
    return this.client.request('POST', '/v1/users', registration, false)
      .then(
        (data) => {
          this.store.token = data.access_token.token
          this.store.refreshToken = data.refresh_token.token
          this.store.assetProvider = data.asset_provider
          this.store.userID = data.user.id
          this.dataPool.setSessionInfo({
            userID: data.user.id
          })
          return data
        }
      ).then(data => new User(data.user))
  }

  /**
   * Logs a user into the Blockv platform. Accepts a user token (phone or email).
   *
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @param password the user's password.
   * @return JSON Object
   */

  login (token, tokenType, password) {
    const payload = {
      token,
      token_type: tokenType,
      auth_data: {
        password
      }
    }

    return this.client.request('POST', '/v1/user/login', payload, false).then(
      (data) => {
        if (!password) {
          const error = new Error('Login Failed, Password Reset')
          error.code = 'PASSWORD_RESET'
          throw error
        } else {
          this.store.token = data.access_token.token
          this.store.refreshToken = data.refresh_token.token
          this.store.assetProvider = data.asset_provider
          this.store.userID = data.user.id
          this.dataPool.setSessionInfo({
            userID: data.user.id,
            client: this.client
          })
          return data
        }
      }
    ).then(data => new User(data.user))
  }

  /**
   * Logs a user into the Blockv platform. Accepts a guest id
   *
   * @param guestId the user's guest id.
   * @return JSON Object
   */
  loginGuest (guestId) {
    const payload = {
      token: guestId,
      token_type: 'guest_id'
    }
    return this.client.request('POST', '/v1/user/login', payload, false).then(
      (data) => {
        this.store.token = data.access_token.token
        this.store.refreshToken = data.refresh_token.token
        this.store.assetProvider = data.asset_provider
        this.dataPool.setSessionInfo({
          userID: data.user.id
        })
        return data
      }
    ).then(data => new User(data.user))
  }

  uploadAvatar (request) {
    // get file
    // change to formData
    return this.client.request('POST', '/v1/user/avatar', request, true)
  }

  /**
   * Fetches the current user's profile information from the Blockv platform.
   *
   * @return JSON Object
   */

  getCurrentUser (payload) {
    // get the current authenticated in user
    return this.client.request('GET', '/v1/user', payload, true).then(data => new User(data))
  }

  /**
   * Updates the current user's profile on the Blockv platform.
   * @param update holds the properties of the user, e.g. their first name.
   * Only the properties to be updated should be set.
   * @return JSON Object
   */
  updateUser (update) {
    return this.client.request('PATCH', '/v1/user', update, true)
  }

  /**
   * Gets a list of the current users tokens
   * @return {Promise<object[]>} Array of token objects
   */

  getUserTokens () {
    return this.client.request('GET', '/v1/user/tokens', '', true).then(v => v || [])
  }

  /**
   * Verifies ownership of a token by submitting the verification code to the Blockv platform.
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @param code the verification code send to the user's token (phone or email).
   * @return JSON Object
   */
  verifyUserToken (verification) {
    return this.client.request('POST', '/v1/user/verify_token', verification, true)
  }

  /**
   * Sends a One-Time-Pin (OTP) to the user's token (phone or email).
   * This OTP may be used in place of a password to login.
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @return JSON Object
   */
  resetPassword (token, tokenType) {
    const payload = {
      token,
      token_type: tokenType
    }
    return this.client.request('POST', '/v1/user/reset_token', payload, false)
  }

  /**
   * Sends a verification code to the user's token (phone or email).
   * This verification code should be used to verifiy the user's ownership
   * of the token (phone or email).
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @return JSON Object
   */
  sendTokenVerification (token, tokenType) {
    const payload = {
      token,
      token_type: tokenType
    }
    return this.client.request('POST', '/v1/user/reset_token_verification', payload, false)
  }

  /**
   * Returns a server generated guest id
   * @return Object payload containing a guest user generated by the server
   */

  getGuestToken () {
    return this.client.request('POST', '/v1/user/guest', '', false).then(data => data.properties.guest_id)
  }

  /**
   * Log out the current user.
   * The current user will not longer be authorized to perform user
   * scoped requests on the Blockv platfrom.
   * @return new JSON
   */
  logout (noRequest = false) {
    this.Blockv.emit('logout')
    this.Blockv.WebSockets.close()
    console.log('trying to logout')
    if (noRequest) {
      this.store.token = ''
      this.store.refreshToken = ''
      this.dataPool.setSessionInfo(null)
    } else {
      return this.client.request('POST', '/v1/user/logout', {}, true).then(() => {
        this.store.token = ''
        this.store.refreshToken = ''
        this.dataPool.setSessionInfo(null)
      }).catch((err) => {
        console.warn(err)
        this.store.token = ''
        this.store.refreshToken = ''
        this.dataPool.setSessionInfo(null)
        throw err
      })
    }
    
  }

  static mapString (o) {
    return Object.keys(o).map(key => `${key}=${o[key]}`).join('&')
  }

  encodeAssetProvider (url) {
    const aP = this.store.assetProvider
    const aPlen = aP.length
    const compare = urlParse(url)
    for (let i = 0; i < aPlen; i += 1) {
      const comparethis = urlParse(aP[i].uri)
      if (compare.hostname === comparethis.hostname) {
        // same uri so get the policy signature and key and append
        const queryString = UserApi.mapString(aP[i].descriptor)
        return `${url}?${queryString}`
      }
    }
    return url
  }

  addUserToken (payload) {
    /**
     * payload is
     * {
     * "token": "another.email@domain.com",
     * "token_type": "email",
     * "is_primary": false
     * }
     */
    return this.client.request('POST', '/v1/user/tokens', payload, true)
  }

  setDefaultToken (tokenId) {
    return this.client.request('PUT', `/v1/user/tokens/${tokenId}/default`, null, true)
  }

  /**
   * Deletes a Users Token
   * @param  {String} tokenId
   * @return {Promise<Object>} returns a success
   */
  deleteUserToken (tokenId) {
    return this.client.request('DELETE', `/v1/user/tokens/${tokenId}`, null, true)
  }

  /**
   * Adds a redeemable the users account
   * @param {Object} payload Object containing the redeemable information
   * @return {Promise<Object>} returns a Object containing the new redeemable
   */
  async addRedeemable (payload) {
    const { userID } = this.store
    return this.client.request('POST', `/v1/users/${userID}/redeemables`, payload, true)
  }

  async getPublicUserProfile (userID) {
    return this.client.request('GET', `/v1/users/${userID}`, '', true)
  }

  /**
   * Logs the user in via OAuth in a browser popup window.
   * NOTE: This is a private method, subject to change once more OAuth flows have been fully implemented on the backend.
   * @private
   * @returns {Promise<boolean>} `true` if login completed, or `false` if login was cancelled by the user.
   */
  async loginOAuthPopup () {
    // Ensure SDK has been initialized
    if (!this.store.appID) throw new Error('Please initialize the SDK and set your App ID first.')

    // Generate random state ID
    const stateID = Math.random().toString(36).substr(2)

    // Generate the oauth URL
    const redirectURI = 'https://login.blockv.io/send-event.html'
    const uri = `https://login.blockv.io/?response_type=code&client_id=${this.store.appID}&redirect_uri=${encodeURIComponent(redirectURI)}&scope=all&state=${stateID}`

    // Create popup window
    const newWindow = window.open(uri, '_blank', 'left=200,top=200,width=360,height=480,chrome,centerscreen')
    if (!newWindow) {
      throw new Error('Unable to login, popups have been blocked')
    }
    // Create pending promise
    let promiseResolved = false
    let promiseSuccess = null
    let promiseFail = null
    const promise = new Promise((resolve, reject) => {
      promiseSuccess = resolve
      promiseFail = reject
    })

    // Create window close checker
    const closeChecker = setInterval(() => {
      // Check if window was closed
      if (!newWindow.closed) return false

      // It was, cancel timer
      clearInterval(closeChecker)

      // If promise was never resolved, the user must have closed the popup before logging in. Resolve the promise.
      if (!promiseResolved) promiseSuccess(false)
    }, 250)

    // Create message listener
    const messageListener = async (e) => {
      // Ensure it's from the correct origin
      if (e.origin !== 'https://login.blockv.io') return false

      // Ensure the state matches
      if (e.data.state !== stateID) return false

      // Ensure the action matches
      if (e.data.action !== 'oauth-response') return false
      console.log(e.data)
      // Check response type
      if (e.data.code) {
        let oauthObj = {
          'grant_type': 'authorization_code',
          'client_id': this.Blockv.store.appID,
          'code': e.data.code,
          'redirect_uri': redirectURI
        }
        let oa = await this.Blockv.client.request('POST', '/v1/oauth/token', oauthObj, false)
        // We have our user data, store it
        this.setRefreshToken(oa.refresh_token.token)
        this.store.token = oa.access_token.token

        // Get user info and set the store properties
        const profile = await this.getCurrentUser()
        this.store.userID = profile.id

        // Get asset provider info and store it
        const assetProviders = await this.client.request('GET', '/v1/user/asset_providers', null, true)
        this.store.assetProvider = assetProviders.asset_provider

        // Inform data pool that the current user changed
        this.dataPool.setSessionInfo({
          userID: profile.id
        })

        // Done
        promiseResolved = true
        promiseSuccess(true)
      } else {
        // Login failed, return error
        const err = new Error(e.data.error_text || 'Unable to login.')
        err.code = e.data.error
        promiseResolved = true
        promiseFail(err)
      }

      // Cleanup, remove event listener
      newWindow.close()
      window.removeEventListener('message', messageListener)
      clearInterval(closeChecker)
      return true
    }

    // Attach message listener
    window.addEventListener('message', messageListener)

    // Done, return promise
    return promise
  }

  // Used for manual OAuth Login flow
  async loginOauthCode (redirectURI, code) {
    let oauthObj = {
      'grant_type': 'authorization_code',
      'client_id': this.store.appID,
      'code': code,
      'redirect_uri': redirectURI
    }
    let oa = await this.Blockv.client.request('POST', '/v1/oauth/token', oauthObj, false)
    // We have our user data, store it
    this.setRefreshToken(oa.refresh_token.token)
    this.store.token = oa.access_token.token

    // Get user info and set the store properties
    const profile = await this.getCurrentUser()
    this.store.userID = profile.id

    // Get asset provider info and store it
    const assetProviders = await this.client.request('GET', '/v1/user/asset_providers', null, true)
    this.store.assetProvider = assetProviders.asset_provider

    // Inform data pool that the current user changed
    this.dataPool.setSessionInfo({
      userID: profile.id
    })
  }
}
