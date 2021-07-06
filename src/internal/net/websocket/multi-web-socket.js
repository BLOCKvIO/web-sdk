//

import EventEmitter from '../../event-emitter'
import WebSockets from './web-socket'
// This is a wrapper around the WebSockets class, which allows for multiple sockets to be active at once.
// It matches the API of that class exactly.
export default class MultiWebSockets extends EventEmitter {

  constructor(store, client, platform) {
    super()
    this.store = store
    this.client = client
    this.sockets = []
    this.platform = platform;
  }

  /** This will be true if the connection is ready to send and receive messages */
  get isOpen() {

    // Return true if any of the websockets are open
    return !!this.sockets.find(s => s.isOpen)

  }

  /**
   * The connect function establishes a connection to the WebSocket.
   * @public
   * @return {Promise<MultiWebSockets>}
   */
  async connect() {
    if (this.connectPromise) {
      return this.connectPromise;
    }
    this.connectPromise = new Promise(async (resolve) => {
      // Create sockets if needed
      if (this.sockets.length == 0) {
        const platforms = await this.platform.getAll();
        Object.keys(platforms).forEach((platformId => {
          const platform = platforms[platformId];
          // Get array of socket addresses
          let addresses = platform.websocket;

          if (typeof addresses == 'string')
            addresses = [addresses]

          // Create sockets
          for (let address of addresses)
            this.sockets.push(new WebSockets(this.store, this.client, address, platformId))
        }));

        // Override the newly created socket's trigger() and emit() to instead trigger and emit on us
        for (let socket of this.sockets) {
          socket.trigger = this.trigger.bind(this)
          socket.triggerEvent = this.triggerEvent.bind(this)
          socket.emit = this.emit.bind(this)
        }

      }
      this.sockets.map(s => s.connect());
      resolve();
    });
    return this.connectPromise;
  }

  /**
   * This sends a message through the web socket
   * @param {*} cmd
   */
  sendMessage(cmd, id) {

    // Send message to all sockets
    for (let socket of this.sockets) {
      if (!id || socket.id === id) {
        socket.sendMessage(cmd)
      }
    }
  }

  /**
   * @public
   * Forcefully closes the Web socket.
   * Note: Socket will be set to null. Auto connect will be disabled.
   */
  close() {
    console.log('multi-websocket-close' + this.count);
    // Close all sockets
    for (let socket of this.sockets) socket.close()
    this.sockets = []

  }

}