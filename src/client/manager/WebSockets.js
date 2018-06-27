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

import EventEmitter from '../../internal/EventEmitter'

export default class WebSockets extends EventEmitter{

  constructor(store, client){
    super();
    this.store = store;
    this.client = client;
    this.socket = null;
    this.isOpen = false;
    this.delayTime = 1000;


  }

  /**
   * The connection function establishes a connection to the websockets
   * @return {Promise<WebSocket>}
   */
  connect() {
    //before we connect, make sure the token is valid
    if(this.socket && this.socket.readyState !== 3)
      //if the websocket is connected already
      return Promise.resolve(this);


    return this.client.checkToken(this.store.accessToken).then(() => {
      let url = this.store.wssocketAddress+"/ws?app_id="+encodeURIComponent(this.store.appID)+"&token="+encodeURIComponent(this.store.token)
      this.socket = new WebSocket(url);
      this.isOpen = true;
      this.socket.addEventListener('open', this.handleConnected.bind(this));
      this.socket.addEventListener('message', this.handleMessage.bind(this));
      this.socket.addEventListener('close', this.handleClose.bind(this));
      //return class
      return this
    }).catch(err =>{
      this.retryConnection()
    })

  }

  /**
   * The handleMessage allows the different types of messages to be returned, stateUpdate,inventory,activity,info
   * @param  {JSON<Object>} e A JSON Object that is passed into the function automatically from connect()
   * @return {JSON<Object>}  A JSON Object is returned containing the list of chosen message types
   */
  handleMessage(e){

    let ed = JSON.parse(e.data);

    //if the user only wants state updates
    if(ed.msg_type == "state_update")
      this.trigger('stateUpdate', ed);

    //if the user only wants inventory updates
    if(ed.msg_type == "inventory")
      this.trigger('inventory', ed);

    //if the user only wants activity updates
    if(ed.msg_type == "my_events")
      this.trigger('activity', ed);

    //if the user only wants info updates
    if(ed.msg_type == "info")
      this.trigger('info', ed);

    if(ed)
      this.trigger('all', ed);

  }

  /**
   * Lets the User know that the connection is connected
   * @param  {Event<SocketStatus>} e no need for inputting the parameter
   * @return {Function<connected>} triggers the connected function
   */
  handleConnected(e){

    this.delayTime = 1000;
    this.trigger('connected', e);
  }


  /**
   * When the connection drops or the Websocket is closed, this function will auto-retry connection until successfully connected
   * @return {Promise<WebSockets>} returns the connection function
   */
  retryConnection(){
    //set Time x 2
    //
    setTimeout(()=>{
      if(!this.isOpen)
        return;
      if(this.socket.readyState == 3)
        this.connect();
    }, this.delayTime)

    if(this.delayTime < 8000)
      this.delayTime *= 2
  }

  /**
   * Handles the WebSocket close event
   * @param  {Event} e no need for inputting, It is a Websocket Event
   */
  handleClose(e){

    this.retryConnection();

  }

  /**
   * Forcefully close the WebSocket, It will null the socket and stop the auto connect
   */
  close(){
      if(!this.socket)
        return
      this.isOpen = false;
      this.socket.close();
      this.socket = null;

  }
}
