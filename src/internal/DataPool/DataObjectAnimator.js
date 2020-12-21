

/**
 * Singleton. Responsible for storing and exeucting changes to objects over time.
 */
export default class DataObjectAnimator {
  static withBlockv(bv) {
    if (!bv.animator)
      bv.animator = new DataObjectAnimator(bv)
    return bv.animator
  }
  /** Constructor */
  constructor(bv) {
    // blockv
    this.blockv = bv

    // Store regions
    this.regions = []

    // List of changes
    this.changes = []

    // Update timer
    this.updateTimer = null

    // Time skew, for syncing server time to client time. This time is added to the device's "current time".
    this.timeSkew = 0

    // Add listeners for the WebSocket
    this.onWebSocketMessage = this.onWebSocketMessage.bind(this)
    this.blockv.WebSockets.addEventListener('websocket.raw', this.onWebSocketMessage)


  }

  /** Called when a new message comes down the WebSocket */
  onWebSocketMessage(msg) {

    // We only handle state update messages here.
    if (msg.msg_type != 'state_update')
      return

    // Only handle brain updates
    if (msg.payload.action_name != 'brain-update')
      return

    // Check if the brain has given us a set of next positions
    let nextPositions = msg.payload.new_object.next_positions
    if (nextPositions) {

      // Map coordinates to sparse object updates
      let updates = nextPositions.map(p => {
        return {
          id: msg.payload.id,
          time: p.time,
          new_data: {
            'when_modified':new Date(p).toISOString(),
            'vAtom::vAtomType': {
              'geo_pos': {
                'coordinates': p.geo_pos
              }
            }
          }
        }
      })

      // Fetch earliest time
      let earliestTime = updates[0].time
      for (let update of updates)
        if (earliestTime > update.time)
          earliestTime = update.time

      // Clear old data from animator
      this.clearUpdatesFor(msg.payload.id, earliestTime)

      // Hand off to the animator
      this.add(updates)

    }

  }

  /** Add a region */
  addRegion(region) {
    this.regions.push(region)
  }

  /** Remove a region */
  removeRegion(region) {
    this.regions = this.regions.filter(r => r != region)
  }

  /** Check if any of our regions has this data object */
  isMonitoringID(id) {

    for (let region of this.regions)
      if (region.objects.get(id)) {
        return true;
      }

    // No, we don't care about this object
    return false

  }

  /** Add updates to be executed */
  add(updates) {

    // Add updates to the array
    let now = Date.now() + this.timeSkew
    for (let u of updates) {

      // Ensure we care about this object
      if (!this.isMonitoringID(u.id))
        continue

      // Ensure this time entry has not passed already
      if (!u.time || u.time < now)
        continue

      // Add it
      this.changes.push(u)

    }

    // Sort changes oldest to newest
    this.changes.sort((a, b) => a.time - b.time)

    // Start update timer if needed
    if (!this.updateTimer)
      this.updateTimer = setInterval(this.doNextUpdate.bind(this), 50)

  }

  /** Remove pending updates for the specified object ID */
  clearUpdatesFor(id, afterTime = 0) {

    // Remove items
    for (let i = 0; i < this.changes.length; i++)
      if (this.changes[i].id == id && this.changes[i].time > afterTime)
        this.changes.splice(i--, 1)

  }

  /** @private Run the next update */
  doNextUpdate() {

    // Stop if no more entries
    if (this.changes.length == 0) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
      return
    }

    // Check if the first entry has passed yet
    let now = Date.now() + this.timeSkew
    if (this.changes[0].time > now)
      return

    // Get change to execute
    let change = this.changes.shift()

    // Do it on all regions
    for (let region of this.regions)
      region.updateObjects([change])

    // If next entry time has also passed already, don't wait, just execute
    if (this.changes.length > 0 && this.changes[0].time < now)
      this.doNextUpdate()

  }

}