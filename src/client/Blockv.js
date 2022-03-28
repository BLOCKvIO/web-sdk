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
import DataPool from '../internal/DataPool'
import Store from '../internal/repo/Store'
import UserManager from './manager/UserManager'
import UserApi from '../internal/net/rest/api/UserApi'
import Vatoms from './manager/Vatoms'
import Activity from './manager/Activity'
import ActivityApi from '../internal/net/rest/api/ActivityApi'
import Client from '../internal/net/Client'
import MultiWebSockets from '../internal/net/websocket/MultiWebSockets'
import EventEmitter from '../internal/EventEmitter';
import Platform from '../internal/net/rest/Platform'
import ResourceManager from './manager/Resources';

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
    this.ResourceManager = new ResourceManager(this);


    if (this.UserManager.isLoggedIn) {
      this.dataPool.setSessionInfo({ userID: this.store.userID, client: this.client })
    }
  }
  
  getPlatformIds() {
    return this.platform.getIds();
  }
}
