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
const Store = require('../internal/repo/Store')
const UserManager = require('./manager/UserManager')
const UserApi = require('../internal/net/rest/api/UserApi')
const VatomApi = require('../internal/net/rest/api/VatomApi')
const Vatoms = require('./manager/Vatoms')
const Activity = require('./manager/Activity')
const ActivityApi = require('../internal/net/rest/api/ActivityApi')
const Client = require('../internal/net/Client')
const WebSockets = require('./manager/WebSockets')


module.exports = class Blockv {
  constructor (payload) {
    const prefix = payload.prefix || payload.appID
    this.store = new Store(prefix)
    this.store.appID = payload.appID
    this.store.server = payload.server || 'https://api.blockv.io'
    this.store.websocketAddress = payload.websocketAddress || 'wss://newws.blockv.io'
    this.client = new Client(this.store)

    const userApi = new UserApi(this.client, this.store)
    const vatomApi = new VatomApi(this.client)
    const activityApi = new ActivityApi(this.client)

    this.Activity = new Activity(activityApi)
    this.WebSockets = new WebSockets(this.store, this.client)
    this.UserManager = new UserManager(userApi, this.store)
    this.Vatoms = new Vatoms(vatomApi)
  }
}
