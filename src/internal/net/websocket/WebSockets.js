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

import EventEmitter from '../../EventEmitter'

export default class WebSockets extends EventEmitter {
  constructor(store, client, address, id) {
    super()
    this.store = store
    this.client = client
    this.address = address

    /** The WebSocket connection */
    this.socket = null

    /** Time until the next retry */
    this.delayTime = 1000

    /** If true, the websocket will continue to retry the connection if it fails */
    this.shouldRetry = false

    this.id = id;

    this.commandQueue = [];
    this.sendingCommands = false;
    this.messageId = 1;
  }

  /** This will be true if the connection is ready to send and receive messages */
  get isOpen() {
    return this.socket && this.socket.readyState === 1
  }

  /**
   * The connect function establishes a connection to the WebSocket.
   * @public
   * @return {Promise<WebSockets>}
   */
  async connect() {
    // Stay connected after this point
    this.shouldRetry = true

    // if the websocket is connected or connecting already, then stop
    if (this.socket) {
      return this
    }

    // before we connect, make sure the token is valid, or else retry again soon
    try {
      await this.client.checkToken()
    } catch (err) {
      console.warn('WebSocket unable to get client token! Will retry soon...')
      this.retryConnection()
      return this
    }

    // if the websocket is connected or connecting already, then stop
    if (this.socket) {
      return this
    }

    // Create the websocket
    const url = `${this.address}?app_id=${encodeURIComponent(this.store.appID)}&token=${encodeURIComponent(this.store.token)}`
    this.socket = new WebSocket(url)
    this.socket.addEventListener('open', this.handleConnected.bind(this))
    this.socket.addEventListener('message', this.handleMessage.bind(this))
    this.socket.addEventListener('error', this.handleError.bind(this))
    this.socket.addEventListener('close', this.handleClose.bind(this))

    // Done
    return this
  }

  /**
   * This sends a message through the web socket
   * @param {*} cmd
   */
  sendMessage(cmd) {
    cmd.id = "" + this.messageId;
    this.messageId++;
    this.commandQueue.push(cmd);
    this.sendNextCommand();
  }

  async sendNextCommand() {
    if (!this.sendCommands) {
      this.sendCommands = true;
      if (this.socket && this.socket.readyState === 1) {
        const cmd = this.commandQueue.shift();
        if (cmd) {
          this.socket.send(JSON.stringify(cmd));
          this.sendCommands = false;
          this.sendNextCommand();
          console.log('Sending WS command: ' + JSON.stringify(cmd))
        }
      } else {
        console.warn('WebSocket: Attempted to send message up, but the socket is not ready.');
      }
      this.sendCommands = false;
    }
  }
  /**
   * The handleMessage function allows the different types of messages to be returned:
   * stateUpdate, inventory, activity, and, info.
   * @private
   * @param  {JSON<Object>} e A JSON Object that is passed into the function from connect()
   * @return {JSON<Object>}  A JSON Object is returned containing the list of chosen message types
   */
  handleMessage(e) {
    const ed = JSON.parse(e.data)
    this.trigger('websocket.raw', ed, this.id)

    // if the message is a RPC message
    if (ed.msg_type === 'rpc') {
      this.trigger('websocket.rpc', ed, this.id)
    }
    // if the user only wants state updates
    if (ed.msg_type === 'state_update') {
      this.trigger('stateUpdate', ed, this.id)
    }

    // if the user only wants inventory updates
    if (ed.msg_type === 'inventory') {
      this.trigger('inventory', ed, this.id)
    }

    // if the user only wants activity updates
    if (ed.msg_type === 'my_events') {
      this.trigger('activity', ed, this.id)
    }

    // if the user only wants info updates
    if (ed.msg_type === 'info') {
      this.trigger('info', ed, this.id)
    }

    if (ed) {
      this.trigger('all', ed, this.id)
    }
  }

  /**
   * Lets the User know that the connection is connected
   * @private
   * @param  {Event<SocketStatus>} e no need for inputting the parameter
   * @return {Function<connected>} triggers the connected function
   */
  handleConnected(e) {
    this.delayTime = 1000
    this.trigger('connected', e, this.id)
    console.log("websocekt connected " + this.id);
    this.sendNextCommand();
  }

  /**
   * When the connection drops or the Websocket is closed.
   * This function will auto-retry connection until successfully connected
   * @private
   * @return {Promise<WebSockets>} returns the connection function
   */
  retryConnection() {
    // Clear previous retry timer
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }

    // Create a new retry timer
    this.retryTimer = setTimeout(() => {
      // Clear timer
      this.retryTimer = null

      // Check if we want to be connected
      if (!this.shouldRetry) {
        return
      }

      // Increase retry delay for next time
      if (this.delayTime < 4000) {
        this.delayTime += 1000
      }

      // connect again
      this.connect()
    }, this.delayTime)
  }

  /**
   * Handles the Web socket error event. We don't need to retry, because handleClose is also called on errors.
   * @private
   * @param {Error} err The error that happened
   */
  handleError(err) {
    this.socket = null
    console.warn('[WebSocket] Connection failed: ' + err.message)
  }

  /**
   * Handles the Web socket close event
   * @private
   * @param  {Event} e no need for inputting, It is a Websocket Event
   */
  handleClose() {
    console.warn('[WebSocket] closed')
    this.socket = null
    this.retryConnection()
  }

  /**
   * @public
   * Forcefully closes the Web socket.
     Note: Socket will be set to null. Auto connect will be disabled.
   */
  close() {
    // Prevent retrying
    this.shouldRetry = false

    // Cancel retry timer if there is one
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }

    // Close socket if it's open
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }
}
