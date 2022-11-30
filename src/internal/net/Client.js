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
import fetch from 'cross-fetch'
import jwtDecode from 'jwt-decode'
import EventEmitter from '../EventEmitter'

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

export default class Client extends EventEmitter {
  /** @private */
  constructor (bv) {
    super()
    this.Blockv = bv
    this.store = bv.store
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

    // Attach headers
    if (!headers) headers = {}
    headers['App-Id'] = this.store.appID
    if (auth) headers['Authorization'] = `Bearer ${this.store.token}`

    // Send request
    return this.authRequest(method, endpoint, payload, headers)
  }

  /** @private */
  async authRequest (method, endpoint, payload, headers) {
    
    // Send request start event
    let t0 = Date.now();
    let statekey = Math.random().toString(36).substr(2)
    this.emit('requestTimerStart', {
      url: this.store.server + endpoint,
      method,
      event: 'start',
      statekey,
      time: t0
    })

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
    
    // try get a response
    let response = null
    let json = null
    try {

      // Send request
      response = await fetch(this.store.server + endpoint, { method, body, headers })

      // Decode JSON
      json = await response.json()

      // Send timing event
      var t1 = Date.now();
      this.emit('requestTimerEnd', {
        url: this.store.server + endpoint,
        method,
        milliseconds: t1 - t0,
        statekey,
        event: 'end'
      })

    } catch (err) {

      // Request failed, send timing event
      var t1 = Date.now();
      this.emit('requestTimerEnd', {
        url: this.store.server + endpoint,
        method,
        milliseconds: t1 - t0,
        statekey,
        event: 'end'
      })

       throw err

    }
    
    
    // Check for server error
    if (json.payload === undefined && json.error === 2051) {

      // Check for the special login locked error
      // We need to pull the timestamp that is in the reponse.message to show when they
      // can login agin

      // HACK: Pull time from original server error string
      const dateString = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g.exec(response.message)
      let lockedUntil = new Date(dateString)

      // Throw error
      const error = new Error(`Too many login attempts, try again at ${lockedUntil}`)
      error.code = json.error || response.status || 0
      error.httpStatus = response.status
      error.requestID = json.request_id
      error.serverMessage = json.message
      error.lockedUntil = lockedUntil
      throw error

    } else if (json && json.payload === undefined && response.status == 200) {

      // Sometimes, just sometimes, the backend will send a response outside of the usual `payload` param.
      // In this case, just wrap it.
      json = {
        payload: json
      }
      
    } else if (json.payload === undefined) {

      // Throw the error returned by the server
      const error = new Error(ErrorCodes[response.error] || json.message || 'An unknown server error has occurred')
      error.code = json.error || response.status || 0
      error.httpStatus = response.status
      error.requestID = json.request_id
      error.serverMessage = json.message
      throw error
      
    }

    // Check for main reactor error payload
    if (json.payload && json.payload.main && json.payload.main.error) {
      // Reactor error
      var err = json.payload.main.error.Code || response.status || 0
      const error = new Error(ErrorCodes[err] || json.payload.main.error.Msg || 'An unknown server error occurred.')
      error.code = err
      error.serverMessage = json.payload.main.error.Msg || ''
      error.httpStatus = response.status
      error.requestID = json.request_id
      throw error
    }
    
    // No error, continue
    return json.payload
  }

  /**
  * Uses the refresh token to fetch and store a new access token from the backend.
  * @private
  */
  refreshToken () {

    // Check if currently fetching an access token
    if (this.tokenFetchPromise)
      return this.tokenFetchPromise

    // Start fetching
    this.tokenFetchPromise = this.request('POST', '/v1/access_token', '', false, {
      Authorization: `Bearer ${this.store.refreshToken}`
    }).then(data => {

      // Store it
      this.store.token = data.access_token.token
      this.tokenFetchPromise = null

    }).catch(err => {

      // Failed to fetch the token! Keep throwing the error up the chain
      console.warn('Failed to fetch a fresh access token from the backend.', err)
      this.tokenFetchPromise = null
      if (err.code == '2049' || err.message.includes('Bad token')) {
        this.Blockv.UserManager.logout(true)
      }
      throw err

    })

    // Return promise
    return this.tokenFetchPromise

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
