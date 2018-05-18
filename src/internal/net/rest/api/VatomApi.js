//
//  BlockV AG. Copyright (c) 2018, all rights reserved.
//
//  Licensed under the BlockV SDK License (the "License"); you may not use this file or
//  the BlockV SDK except in compliance with the License accompanying it. Unless
//  required by applicable law or agreed to in writing, the BlockV SDK distributed under
//  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
//  ANY KIND, either express or implied. See the License for the specific language
//  governing permissions and limitations under the License.


export default class VatomApi{

  constructor(client){
    this.client = client
  }


  performAction(action, payload){

    return this.client.request('POST', '/v1/user/vatom/action/'+action, payload, true).then(data => {data.main.output});

  }

  getUserInventory(payload){
     return this.client.request('POST', '/v1/user/vatom/inventory', payload, true).then(data => data.vatoms);
  }


  getUserVatoms(payload){
    return this.client.request('POST', '/v1/user/vatom/get', payload, true).then(data => data)
  }




}
