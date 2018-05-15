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
/**
 * Created by LordCheddar on 2018/03/05.
 */

class Blockv {

  static init(init){
    //const APPID = appID;
    //const SERVER = 'https://apidev.blockv.net/';
    Store.appID = init.appID;
    Store.server = init.server;
    Store.websocketAddress = init.websocketAddress;

  }

}

export default Blockv;
