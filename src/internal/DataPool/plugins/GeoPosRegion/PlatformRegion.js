/* gloabl Events */
import BLOCKvRegion from '../BLOCKvRegion'
import DataObject from '../../DataObject'

/**
 * This region plugin provides access to a collection of vatoms that has been dropped within the specified region on the map.
 *
 * To get an instance, call `DataPool.region('geopos', { top_right: { lat: ..., lon: ... }, bottom_left: { lat: ..., lon: ... } })`
 */
export default class GeoPosRegion extends BLOCKvRegion {

  /** Plugin ID */
  get id() { return 'geopos-' + this.platformId }

  /** Constructor */
  constructor(dataPool, platformId, config) {
    super(dataPool, platformId)

    this.matches = config.matches;
    // Don't cache this content
    this.noCache = true

    // Store geo hash
    this.geoHash = config.geoHash;

    this.fqdn = config.fqdn;

    // Send region command to the WebSocket
    this.sendRegionCommand()

    if (config.cached) {
      //adding cached objects
      this.addObjects(config.cached);
    }
    // Listen for events
    this.onWebSocketOpen = this.onWebSocketOpen.bind(this)
    this.socket.addEventListener('connected', this.onWebSocketOpen)

  }

  /** Called when this region is going to be shut down */
  close() {
    super.close()

    // Remove listeners
    this.socket.removeEventListener('connected', this.onWebSocketOpen)

  }

  /** Called when the WebSocket connection re-opens */
  onWebSocketOpen(_, id) {
    if (!this.platformId || id === this.platformId) {

      // Full refresh this region, in case any messages were missed
      this.forceSynchronize()

      // Send region command again
      this.sendRegionCommand()
    }
  }

  /** Sends the region command up the websocket to enable region monitoring */
  sendRegionCommand() {

    if (this.geoHash.length < 4) {
      console.warn('Region is to large to monitor ' + this.geoHash);
      return;
    }
    if (this.geoHash.length > 8) {
      console.warn('Region is to small to monitor ' + this.geoHash);
      return;
    }

    // Create command payload
    let cmd = {
      id: '1',
      version: '1',
      type: 'command',
      cmd: 'monitor',
      payload: {
        geohash: this.geohash
      }
    }
    // Send it up
    this.dataPool.Blockv.WebSockets.sendMessage(cmd, this.platformId)
  }

  /**
   * Returns true if the object with the specified ID exists in the cache.
   *
   * @param {*} id The object's ID
   * @returns {boolean} True if the object exists.
   */
  has(id) {

    // Check super implementation
    if (!super.has(id))
      return false

    // Check if dropped
    let object = this.objects.get(id)
    let props = object.data['vAtom::vAtomType'] || {}
    if (props.dropped && props.geo_pos && props.geo_pos.coordinates && props.geo_pos.coordinates[0])
      return true

  }

  /** Our state key is the region */
  get stateKey() {
    return 'geopos-' + this.platformId + ":" + this.geoHash;
  }

  /** Load current state from the server */
  async load() {
    // Pause websocket events
    this.pauseMessages()

    let payload = {
      geohash: this.geoHash,
      filter: 'all',
      limit: 10000
    }

    if (this.fqdn)
      payload['publisher_fqdn'] = this.fqdn
    // Fetch data
    let response = await this.dataPool.Blockv.client.request('POST', '/v1/vatom/geodiscover', payload, true, undefined, this.platformId)

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
  save() { }

  /** Override to only return dropped vatoms */
  map(object) {

    // Check FQDN filter
    if (this.fqdn && object.data && object.data['vAtom::vAtomType'] && object.data['vAtom::vAtomType'].publisher_fqdn !== this.fqdn)
      return null

    // Check if dropped
    let props = object.data['vAtom::vAtomType'] || {}
    if (props.parent_id === '.' && props.dropped && props.geo_pos && props.geo_pos.coordinates && props.geo_pos.coordinates[0])
      return super.map(object)

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
      let response = await this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/get', { ids: [msg.payload.vatom_id] }, true, undefined, this.platformId)
      let vatom = new DataObject('vatom', response.vatoms[0].id, response.vatoms[0])
      objects.push(vatom)
      response.faces.map(f => new DataObject('face', f.id, f)).forEach(f => objects.push(f))
      response.actions.map(a => new DataObject('action', a.name, a)).forEach(a => objects.push(a))
      this.addObjects(objects)
      return

    } else if (msg.msg_type === 'map' && msg.payload.op === 'remove') {
      // A vatom was removed from the map.
      this.preemptiveRemove(msg.payload.vatom_id)
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
      this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/get', { ids: [vatomID] }, true, undefined, this.platformId).then(response => {
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
