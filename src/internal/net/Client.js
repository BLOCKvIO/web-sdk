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
const fetch = require('@brillout/fetch')
const jwtDecode = require('jwt-decode')

/* global FormData */

/** List of known error messages to replace the server-supplied ones */
const ErrorCodes = {
  2: 'Blank App ID',
  17: 'Invalid App ID',
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
  2572: 'Invalid Phone Number'
}

module.exports = class Client {
  /** @private */
  constructor (store) {
    this.store = store
  }

  /**
   * Sends a request to the backend.
   * @param {string} method The HTTP method, ie. "GET", "POST"
   * @param {string} endpoint The backend API endpoint, ie. "/v1/user"
   * @param {string|object|FormData} payload The request body. Can be null.
   * @param {boolean} auth `true` if this request should contain the current user's access token.
   * @param {object} headers Optional extra HTTP headers to add to the request.
   * @returns {Promise<object>} The server's response payload.
   */
  async request (method, endpoint, payload, auth, headers) {
    // Ensure our access token is up to date, if this is an authenticated request
    if (auth) await this.checkToken()

    // Send request
    return this.authRequest(method, endpoint, payload, headers)
  }

  /** @private */
  async authRequest (method, endpoint, payload, extraHeaders) {
    // Setup headers
    const headers = Object.assign({
      'App-Id': this.store.appID,
      Authorization: `Bearer ${this.store.token}`
    }, extraHeaders)

    // Check payload type
    let body = null
    if (!payload) {
      // If no body, make it undefined so that fetch() doesn't complain about having a payload on GET requests
      body = undefined
    } else if (typeof FormData !== 'undefined' && payload instanceof FormData) {
      // Don't add Content-Type header, fetch() adds it's own, which is required because it specifies the form data boundary
      body = payload
    } else if (typeof body === 'object') {
      // Convert to JSON
      body = JSON.stringify(payload)
      headers['Content-Type'] = 'application/json'
    } else {
      // Unknown payload type, assume application/json content type, unless specified in extra headers
      body = payload
      if (!extraHeaders['Content-Type']) headers['Content-Type'] = 'application/json'
    }

    // Send request
    const response = await fetch(this.store.server + endpoint, { method, body, headers })

    // Decode JSON
    const json = await response.json()

    // Check for server error
    if (!json.payload && json.error === 2051) {
      // Check for the special login locked error
      // We need to pull the timestamp that is in the reponse.message to show when they
      // can login agin

      // HACK: Pull time from original server error string
      const dateString = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g.exec(response.message)
      response.lockedUntil = new Date(dateString)

      // Replace duration in the error message
      let duration = response.lockedUntil.getTime() - Date.now()
      if (duration < 2000) duration = 2000
      const seconds = Math.floor(duration / 1000)
      const minutes = Math.floor(duration / 1000 / 60)
      if (seconds <= 90) {
        response.message = response.message.replace('%DURATION%', seconds === 1 ? '1 second' : `${seconds}  seconds`)
      } else {
        response.message = response.message.replace('%DURATION%', minutes === 1 ? '1 minute' : `${minutes} minutes`)
      }
      // Throw error
      const error = new Error(`Too many login attempts, Try again at : ${response.lockedUntil}`)
      error.code = json.error || response.status || 0
      error.httpStatus = response.status
      throw error
    } else if (!json.payload) {
      // Throw the error returned by the server
      const error = new Error(ErrorCodes[response.error] || json.message || 'An unknown server error has occurred')
      error.code = json.error || response.status || 0
      error.httpStatus = response.status
      throw error
    }

    // No error, continue
    return json.payload
  }

  /**
  * Uses the refresh token to fetch and store a new access token from the backend.
  * @private
  */
  async refreshToken () {
    // Fetch new access token
    const data = await this.request('POST', '/v1/access_token', '', false, {
      Authorization: `Bearer ${this.store.refreshToken}`
    })

    // Store it
    this.store.token = data.access_token.token
  }

  /**
   * Checks if the current access token is still valid and has not expired yet. If it is, it will fetch a new one.
   * @private
   * @returns {Promise} Resolves when the access token is valid.
   */
  async checkToken () {
    // define our vars
    let decodedToken
    let nowDate
    let expirationTime

    // Catch errors with decoding the current access token
    try {
      decodedToken = jwtDecode(this.store.token)
      expirationTime = (decodedToken.exp * 1000)
      nowDate = Date.now()

      // quick calc to determine if the token has expired
      if ((nowDate + 5000) > expirationTime) throw new Error('Token expired.')
    } catch (e) {
      // There was an error with the access token. Fetch a new one.
      return this.refreshToken()
    }

    // Done
    return true
  }
}
