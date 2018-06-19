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
import Store from '../internal/repo/Store'
import UserManager from './manager/UserManager'
import UserApi from '../internal/net/rest/api/UserApi'
import VatomApi from '../internal/net/rest/api/VatomApi'
import Vatoms from './manager/Vatoms'
import Client from '../internal/net/Client'
import WebSockets from './manager/WebSockets'


/**
 * Created by LordCheddar on 2018/03/05.
 */

class Blockv {

  constructor(payload){
      let prefix = payload.prefix || payload.appID;
      this.store = new Store(prefix);
      this.store.appID = payload.appID;
      this.store.server = payload.server || "https://api.blockv.io";
      this.store.websocketAddress = payload.websocketAddress || "wss://ws.blockv.io";
      this.client = new Client(this.store);
      

      let userApi = new UserApi(this.client, this.store);
      let vatomApi = new VatomApi(this.client);

      this.WebSockets = new WebSockets(this.store);
      this.UserManager = new UserManager(userApi,this.store);
      this.Vatoms = new Vatoms(vatomApi);

  }


}

export default Blockv;
