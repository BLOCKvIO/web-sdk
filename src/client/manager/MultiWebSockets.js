//

import EventEmitter from '../../internal/EventEmitter'
import WebSockets from './WebSockets'

// This is a wrapper around the WebSockets class, which allows for multiple sockets to be active at once.
// It matches the API of that class exactly.
export default class MultiWebSockets extends EventEmitter {

    constructor (store, client) {
        super()

        this.store = store
        this.client = client
        this.sockets = []

    }

    /** This will be true if the connection is ready to send and receive messages */
    get isOpen () {

        // Return true if any of the websockets are open
        return !!this.sockets.find(s => s.isOpen)

    }

    /**
     * The connect function establishes a connection to the WebSocket.
     * @public
     * @return {Promise<WebSockets>}
     */
    async connect() {

        // Create sockets if needed
        if (this.sockets.length == 0) {

            // Create sockets
            if (typeof this.store.websocketAddress == 'string') {
                
                // Config supplied a single websocket address
                this.sockets.push(new WebSockets(this.store, this.client, this.store.websocketAddress))
            
            } else if (Array.isArray(this.store.websocketAddress)) {

                // Config supplied an array of addresses
                for (let address of this.store.websocketAddress)
                this.sockets.push(new WebSockets(this.store, this.client, address))

            }

            // Override the newly created socket's trigger() and emit() to instead trigger and emit on us
            for (let socket of this.sockets) {
                socket.trigger = this.trigger.bind(this)
                socket.triggerEvent = this.triggerEvent.bind(this)
                socket.emit = this.emit.bind(this)
            }

        }

        // Connect them all
        return Promise.all(this.sockets.map(s => s.connect())).then(e => this)

    }

    /**
     * This sends a message through the web socket
     * @param {*} cmd
     */
    sendMessage (cmd) {
        
        // Send message to all sockets
        for (let socket of this.sockets)
            socket.sendMessage(cmd)

    }

    /**
     * @public
     * Forcefully closes the Web socket.
     * Note: Socket will be set to null. Auto connect will be disabled.
     */
    close () {
        
        // Close all sockets
        for (let socket of this.sockets) socket.close()
        this.sockets = []
        
    }

}