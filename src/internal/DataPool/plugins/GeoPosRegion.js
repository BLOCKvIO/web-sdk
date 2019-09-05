/* gloabl Events */
import BLOCKvRegion from './BLOCKvRegion'
import DataObject from '../DataObject'
import Events from '../EventEmitter'

/**
 * This region plugin provides access to a collection of vatoms that has been dropped within the specified region on the map.
 *
 * To get an instance, call `DataPool.region('geopos', { top_right: { lat: ..., lon: ... }, bottom_left: { lat: ..., lon: ... } })`
 */
export default class GeoPosRegion extends BLOCKvRegion {
  /** Plugin ID */
  static get id () { return 'geopos' }

  /** Constructor */
  constructor (dataPool, coordinates) {
    super(dataPool)
    // Don't cache this content
    this.noCache = true

    // Fail if coordinates are invalid
    if (!coordinates || !coordinates.top_right || !coordinates.top_right.lat || !coordinates.top_right.lon || !coordinates.bottom_left || !coordinates.bottom_left.lat || !coordinates.bottom_left.lon) {
      throw new Error('Please specify the top_right and bottom_left coordinates in the region descriptor.')
    }

    // Store coordinates
    this.coordinates = coordinates

    // Send region command to the WebSocket
    this.sendRegionCommand()

    // Listen for events
    this.onWebSocketOpen = this.onWebSocketOpen.bind(this)
    this.socket.addEventListener('connected', this.onWebSocketOpen)
  }

  /** Called when this region is going to be shut down */
  close () {
    super.close()

    // Remove listeners
    this.socket.removeEventListener('connected', this.onWebSocketOpen)
  }

  /** Called when the WebSocket connection re-opens */
  onWebSocketOpen () {
    this.sendRegionCommand()
  }

  /** Sends the region command up the websocket to enable region monitoring */
  sendRegionCommand () {

    // Stop if WebSocket is not connected
    if (!this.socket.isOpen)
      return

    // Convert our coordinates into the ones needed by the command
    let topLeft = {
      lat: Math.max(this.coordinates.top_right.lat, this.coordinates.bottom_left.lat),
      lon: Math.min(this.coordinates.top_right.lon, this.coordinates.bottom_left.lon)
    }
    let bottomRight = {
      lat: Math.min(this.coordinates.top_right.lat, this.coordinates.bottom_left.lat),
      lon: Math.max(this.coordinates.top_right.lon, this.coordinates.bottom_left.lon)
    }

    // Create command payload
    let cmd = {
      id: '1',
      version: '1',
      type: 'command',
      cmd: 'monitor',
      payload: {
        top_left: topLeft,
        bottom_right: bottomRight
      }
    }

    // Send it up
    console.log('Sending WS command: ' + JSON.stringify(cmd))
    this.dataPool.Blockv.WebSockets.sendMessage(cmd)
  }

  /** Our state key is the region */
  get stateKey () {
    return 'geopos:' + this.coordinates.top_right.lat + ',' + this.coordinates.top_right.lon + ' ' + this.coordinates.bottom_left.lat + ',' + this.coordinates.bottom_left.lon
  }

  /** Check if a region request matches our region */
  matches (id, descriptor) {
    // Check all filters match
    if (id !== 'geopos') return false
    if (!descriptor || !descriptor.top_right || !descriptor.bottom_left) return false
    if (descriptor.top_right.lat !== this.coordinates.top_right.lat) return false
    if (descriptor.top_right.lon !== this.coordinates.top_right.lon) return false
    if (descriptor.bottom_left.lat !== this.coordinates.bottom_left.lat) return false
    if (descriptor.bottom_left.lon !== this.coordinates.bottom_left.lon) return false

    // Yes they do
    return true
  }

  /** Load current state from the server */
  async load () {
    // Pause websocket events
    this.pauseMessages()

    // Fetch data
    let response = await this.dataPool.Blockv.client.request('POST', '/v1/vatom/geodiscover', {
      top_right: this.coordinates.top_right,
      bottom_left: this.coordinates.bottom_left,
      filter: 'all',
      limit: 10000
    }, true)

    // Add vatom to new objects list
    let objects = []
    response.vatoms.map(v => new DataObject('vatom', v.id, v)).forEach(f => objects.push(f))

    // Add faces to new objects list
    response.faces.map(f => new DataObject('face', f.id, f)).forEach(f => objects.push(f))

    // Add actions to new objects list
    response.actions.map(a => new DataObject('action', a.name, a)).forEach(a => objects.push(a))

    // Add new objects
    this.addObjects(objects)

    // Resume websocket messages
    this.resumeMessages()

    // Return array of IDs
    return objects.map(o => o.id)
  }

  /** This region type should not be cached */
  save () {}

  /** Don't return vatoms which are not dropped */
  map (object) {
    // Check if dropped
    if (object.data && object.data['vAtom::vAtomType'] && object.data['vAtom::vAtomType'].dropped) {
      return super.map(object)
    }

    // Vatom is not dropped!
    return null
  }

  /**
   * Processes a WebSocket message.
   *
   * @private Called by BVWebSocketRegion.
   * @abstract Subclasses can override to process other WebSocket messages. Always call super.processMessage(msg) though.
   * @param {Object} msg The raw JSON from the websocket event message
   */
  async processMessage(msg) {
    super.processMessage(msg)

    // Check for map add event
    if (msg.msg_type === 'map' && msg.payload.op === 'add') {

      // A vatom was added to the map. Fetch vatom, add components to data pool
      let objects = []
      let response = await this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/get', { ids: [msg.payload.vatom_id] }, true)
      let vatom = new DataObject('vatom', response.vatoms[0].id, response.vatoms[0])
      objects.push(vatom)
      response.faces.map(f => new DataObject('face', f.id, f)).forEach(f => objects.push(f))
      response.actions.map(a => new DataObject('action', a.name, a)).forEach(a => objects.push(a))
      this.addObjects(objects)
      return

    } else if (msg.msg_type === 'map' && msg.payload.op === 'remove') {

      // A vatom was removed from the map. Undrop it
      this.preemptiveChange(msg.payload.vatom_id, 'vAtom::vAtomType.dropped', false)
      return

    } else if (msg.msg_type == 'state_update') {

      // Get vatom ID
      let vatomID = msg.payload && msg.payload.id
      if (!vatomID) {
        throw new Error(`Got websocket message with no vatom ID in it.`)
      }

      // Check if this is a newly dropped vatom
      let dropped = msg.payload.new_object && msg.payload.new_object['vAtom::vAtomType'] && msg.payload.new_object['vAtom::vAtomType'].dropped
      if (!dropped) {
        return
      }

      // Check if we already have this vatom
      if (this.objects.get(vatomID)) {
        return
      }

      // A new vatom was dropped! Pause WebSocket message processing
      this.pauseMessages()

      // Fetch vatom payload
      this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/get', { ids: [vatomID] }, true).then(response => {
        // Add vatom to new objects list
        let objects = []
        objects.push(new DataObject('vatom', response.vatoms[0].id, response.vatoms[0]))

        // Add faces to new objects list
        response.faces.map(f => new DataObject('face', f.id, f)).forEach(f => objects.push(f))

        // Add actions to new objects list
        response.actions.map(a => new DataObject('action', a.name, a)).forEach(a => objects.push(a))

        // Add new objects
        this.addObjects(objects)
      }).catch(err => {
        // Log it
        console.warn(`[DataPool > GeoPosRegion] A vatom was dropped, but we could not fetch it's payload! ` + err.message)
      }).then(e => {
        // Resume message processing
        this.resumeMessages()
      })

    }
  }
}
