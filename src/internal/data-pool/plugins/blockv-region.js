
import Region from '../region'
import Vatom from '../../../model/vatom'
import DataObjectAnimator from '../data-object-animator'
import { merge } from 'lodash'
import Delayer from '../delayer'

/**
 * Intermediate class which handles updates via the BLOCKv websocket and returning Vatom objects. Regions can subclass this to automatically
 * get updates via WebSocket.
 */
export default class  BLOCKvRegion extends Region {
  constructor(dataPool, platformId) {
    super(dataPool)
    // Vatom network id this region is interacting with
    this.platformId = platformId;
    // Queue of pending WebSocket messages
    this.queuedMessages = []
    this.socketPaused = false
    this.socketProcessing = false

    // Bind functions
    this.onWebSocketMessage = this.onWebSocketMessage.bind(this)

    // Add listeners for the WebSocket
    this.socket = this.dataPool.Blockv.WebSockets
    this.socket.connect()
    this.socket.addEventListener('websocket.raw', this.onWebSocketMessage)

    // Monitor for timed updates
    DataObjectAnimator.withBlockv(dataPool.Blockv).addRegion(this)
  }

  /** Called when this region is going to be shut down */
  close() {
    super.close()
    // Remove listeners
    this.socket.removeEventListener('websocket.raw', this.onWebSocketMessage)

    DataObjectAnimator.withBlockv(this.dataPool.Blockv).removeRegion(this)
  }

  /**
   * Called to pause processing of websocket messages
   * @private Called by subclasses.
   */
  pauseMessages() {
    this.socketPaused = true
  }

  /**
   * Called to resume processing of websocket messages
   *
   * @private Called by subclasses.
   */
  resumeMessages() {
    // Unpause
    this.socketPaused = false

    // Process next message if needed
    if (!this.socketProcessing) {
      this.processNextMessage()
    }
  }

  /**
   * Called when there's a new event message via the WebSocket.
   *
   * @private
   * @param {Object} msg The raw JSON from the websocket event message
   */
  onWebSocketMessage(msg, id) {
    if (!this.platformId || id === this.platformId) {

      // Add to queue
      this.queuedMessages.push(msg)

      // Process it if necessary
      if (!this.socketPaused && !this.socketProcessing) {
        this.processNextMessage()
      }
    }
  }

  /**
   * Called to process the next WebSocket message.
   */
  async processNextMessage() {
    // Stop if socket is paused
    if (this.socketPaused) {
      return
    }

    // Stop if already processing
    if (this.socketProcessing) {
      return
    }
    this.socketProcessing = true

    // Get next msg to process
    let msg = this.queuedMessages.shift()
    if (!msg) {

      // No more messages!
      this.socketProcessing = false
      return

    }

    // Process message
    try {

      // Process message
      await this.processMessage(msg)

    } catch (err) {

      // Error!
      console.warn('[DataPool > BVWebSocketRegion] Error processing WebSocket message! ' + err.message, msg)

    }

    // Done, process next message
    this.socketProcessing = false
    this.processNextMessage()
  }

  /**
    * Processes a WebSocket message.
    *
    * @private Called by BVWebSocketRegion.
    * @abstract Subclasses can override to process other WebSocket messages. Always call super.processMessage(msg) though.
    * @param {Object} msg The raw JSON from the websocket event message
    */
  async processMessage(msg) {

    // We only handle state_update messages here
    if (msg.msg_type != 'state_update')
      return

    // Get vatom ID
    let vatomID = msg.payload && msg.payload.id
    if (!vatomID) {
      throw new Error(`Got websocket message with no vatom ID in it.`)
    }

    // Ensure it's formatted correctly
    if (!msg.payload.new_object) {
      throw new Error(`WebSocket message had no new object payload.`)
    }

    // Update existing objects
    this.updateObjects([{
      id: msg.payload.id,
      new_data: msg.payload.new_object
    }])
  }

  /** Map our data objects to Vatom objects */
  map(object) {
    // Only handle vatoms
    if (object.type !== 'vatom') {
      return null
    }

    // Fetch all faces linked to this vatom
    let faces = Array.from(this.objects.values()).filter(o => o.type === 'face' && o.data.template === object.data['vAtom::vAtomType'].template).map(o => o.data)

    // Fetch all actions linked to this vatom
    let actions = Array.from(this.objects.values()).filter(o => o.type === 'action' && o.data.name.startsWith(object.data['vAtom::vAtomType'].template + '::Action::')).map(o => o.data)

    // Create vatom object
    return new Vatom(object.data, faces, actions, this.platformId)
  }

  /**
   * Called when an object is about to be added.
   *
   * @private
   * @abstract Can be overridden by subclasses which need to get these events.
   * @param {DataObject} object The object which will be added.
   */
  willAdd(object) {
    // Notify parent as well
    let parent = object.data && object.data['vAtom::vAtomType'] && object.data['vAtom::vAtomType'].parent_id
    if (parent) {
      Delayer.run(e => this.emit('object.updated', parent))
    }
    // If our DataObjectAnimator has a scheduled update for this object, include that change now. This is to work around map objects jumping around when a new region is created.
    let nextUpdate = DataObjectAnimator.withBlockv(this.dataPool.Blockv).changes.find(u => u.id === object.id)
    if (nextUpdate) {
      merge(object.data, nextUpdate.new_data)
    }
  }

  /**
    * Called when an object is about to be updated.
    *
    * @private
    * @abstract Can be overridden by subclasses which need to get these events.
    * @param {DataObject} object The object which will be updated.
    * @param {Object} newData The sparse object containing the changed fields
  */
  willUpdateFields(object, newData) {
    // Notify parent as well
    let oldParent = object.data && object.data['vAtom::vAtomType'] && object.data['vAtom::vAtomType'].parent_id
    let newParent = newData && newData['vAtom::vAtomType'] && newData['vAtom::vAtomType'].parent_id
    if (newParent) { Delayer.run(e => this.emit('object.updated', oldParent)) }
    if (newParent) { Delayer.run(e => this.emit('object.updated', newParent)) }
  }

  /**
   * Called when an object is about to be updated.
   *
   * @private
   * @abstract Can be overridden by subclasses which need to get these events.
   * @param {DataObject} object The object which will be updated.
   * @param {String} keyPath The field which will be changed.
   * @param {*} oldValue The current field value.
   * @param {*} newValue The new field value.
   */
  willUpdateField(object, keyPath, oldValue, newValue) {
    // Only do if modifying the parent ID field
    if (keyPath !== 'vAtom::vAtomType.parent_id') {
      return
    }
    // Notify parent
    Delayer.run(e => this.emit('object.updated', oldValue))
    Delayer.run(e => this.emit('object.updated', newValue))
  }

  /**
   * Called when an object is about to be removed.
   *
   * @private
   * @abstract Can be overridden by subclasses which need to get these events.
   * @param {DataObject|String} objectOrID The object (or ID) which will be updated.
   */
  willRemove(objectOrID) {
    // Get object if needed
    let object = objectOrID
    if (typeof objectOrID === 'string') {
      object = this.objects.get(objectOrID)
    }
    // Notify parent as well
    let parent = object && object.data && object.data['vAtom::vAtomType'] && object.data['vAtom::vAtomType'].parent_id
    if (parent) {
      Delayer.run(e => this.emit('object.updated', parent))
    }
  }
}
