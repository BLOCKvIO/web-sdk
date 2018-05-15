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
import Client from '../../internal/net/Client'

class Vatoms{

  /**
   * [performAction description]
   * @param  {String} vatomId id of the vatom to perform action
   * @param  {String} action  can be either of the following : Drop, Pickup , Transfer , Require
   * @param  {Object} payload contains geo-coordianates or anything else sent along with vatomid
   * @return {JSON}   json payload nested
   */

  performAction(vatomId, action, payload){

    //check that payload is set
    payload = payload || {}
    //assigns this.id
    payload["this.id"] = vatomId;

    return Client.request('POST', '/v1/user/vatom/action/'+action, payload, true).then(data => {data.main.output});

  }

  getUserInventory(){
    let payload = {
      "parent_id": ".",
      "page": 1,
      "limit": 1000
    }

     return Client.request('POST', '/v1/user/vatom/inventory', payload, true).then(data => data.vatoms);


  }


  getUserVatoms(vatomId){
    let payload = {
      "ids": [
        vatomId
      ]
    }

    return Client.request('POST', '/v1/user/vatom/get', payload, true).then(data => data)
  }


}

export default new Vatoms();
