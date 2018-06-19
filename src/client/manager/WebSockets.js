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


export default class WebSockets{

  constructor(store){
    this.store = store;
    this.socketserver = this.store.websocketAddress;

  }

  start(){
    console.log("starting the web sockets....");

    let connection = new WebSocket(this.socketserver);

    connection.onopen =  () =>  {
      let payload = {
            "action": "login",
            "appID": this.store.appID,
            "token": "Bearer "+ this.store.token
      }
      console.log(payload);
      connection.send(JSON.stringify(payload));
    };

    // Log errors
    connection.onerror =  (error) => {
      console.log('WebSocket Error ' + error);
    };

    // Log messages from the server
    connection.onmessage = (e) => {
      console.log('Server: ' + e.data);
    };
  }

  close()
  {
    this.connection.close();
  }





}
