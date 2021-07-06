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
import DataPool from '../internal/data-pool'
import Store from '../internal/repo/storage'
import UserManager from './manager/user-manager'
import UserApi from '../internal/net/rest/api/user-api'
import Vatoms from './manager/vatom-manager'
import Activity from './manager/activity-manager'
import ActivityApi from '../internal/net/rest/api/activity-api'
import Client from '../internal/net/network'
import MultiWebSockets from '../internal/net/websocket/multi-web-socket'
import EventEmitter from '../internal/event-emitter';
import Platform from '../internal/net/rest/platform'

export default class Blockv extends EventEmitter {
  constructor(payload) {
    super()
    const prefix = payload.prefix || payload.appID

    this.store = new Store(prefix)
    this.store.appID = payload.appID
    this.store.server = payload.server || 'https://api.blockv.io'
    this.store.websocketAddress = payload.websocketAddress || 'wss://newws.blockv.io'
    this.client = new Client(this)
    this.platform = new Platform(this.client, this.store, payload.connectAllPlatforms);

    this.dataPool = new DataPool(this)
    this.dataPool.disableSyncV2 = payload.disableSyncV2
    
    const userApi = new UserApi(this)
    const activityApi = new ActivityApi(this.client)

    this.Activity = new Activity(activityApi)
    this.WebSockets = new MultiWebSockets(this.store, this.client, this.platform)
    this.UserManager = new UserManager(userApi, this.store)
    this.Vatoms = new Vatoms(this)


    if (this.UserManager.isLoggedIn) {
      this.dataPool.setSessionInfo({ userID: this.store.userID, client: this.client })
    }
  }
  
  getPlatformIds() {
    return this.platform.getIds();
  }
}
