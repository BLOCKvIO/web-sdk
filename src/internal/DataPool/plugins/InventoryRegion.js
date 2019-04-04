
import BLOCKvRegion from './BLOCKvRegion'
import DataObject from '../DataObject'
/**
 * This region plugin provides access to the current user's inventory.
 *
 * To get an instance, call `DataPool.region('inventory')`
 */
export default class InventoryRegion extends BLOCKvRegion {
  /** Plugin ID */
  static get id () { return 'inventory' }

  /** Constructor */
  constructor (dataPool) {
    super(dataPool)
    // Make sure we have a valid current user
    if (!this.dataPool.sessionInfo || !this.dataPool.sessionInfo.userID) {
      throw new Error('You cannot query the inventory region without being logged in.')
    }
    // Store current user ID
    this.currentUserID = this.dataPool.sessionInfo.userID
  }

  /** Our state key is the current user's ID */
  get stateKey () {
    return 'inventory:' + this.currentUserID
  }

  /** There should only be one inventory region */
  matches (id, descriptor) {
    return id === 'inventory'
  }

  /** Shut down this region if the current user changes */
  onSessionInfoChanged () {
    this.close()
  }

  /** Load current state from the server */
  async load () {
    // Pause websocket events
    this.pauseMessages()

    // Go through all pages on the server, we want _everything_
    let pageCount = 1
    let loadedIDs = []
    while (true) {
      // Fetch all vatoms the user owns, via a Discover call
      console.debug(`[DataPool > InventoryRegion] Fetching owned vatoms, page ${pageCount}...`)
      let filter = {
        'scope': {
          'key': 'vAtom::vAtomType.owner',
          'value': '$currentuser'
        },
        'limit': 1000,
        'page': pageCount,
        'return': {
          'type': '*',
          'fields': []
        }
      }
      let response = await this.dataPool.Blockv.client.request('POST', '/v1/vatom/discover', filter, true)

      // Create list of new objects
      let newObjects = []

      // Add vatoms to the list
      for (let v of response.results) {
        loadedIDs.push(v.id)
        newObjects.push(new DataObject('vatom', v.id, v))
      }

      // Add faces to the list
      for (let f of response.faces) {
        loadedIDs.push(f.id)
        newObjects.push(new DataObject('face', f.id, f))
      }

      // Add actions to the list
      for (let a of response.actions) {
        loadedIDs.push(a.name)
        newObjects.push(new DataObject('action', a.name, a))
      }
      // Update the pool
      this.addObjects(newObjects)

      // Increase page index for next iteration
      pageCount += 1

      // Stop if no items were returned
      if (newObjects.length === 0) {
        break
      }
    }

    // Resume websocket events
    this.resumeMessages()

    // Return array of all items
    return loadedIDs
  }

  /** @override Called on WebSocket message. */
  async processMessage (msg) {
    // Call super
    super.processMessage(msg)

    console.log("WE got a message from the inventory region and it needs to process in here!!!!!! =-=-=-=-=-=-=-=-=- ", msg)

    // We only handle inventory update messages after this.
    if (msg.msg_type !== 'inventory') {
      return
    }

    // Get vatom ID
    let vatomID = msg.payload && msg.payload.id
    if (!vatomID) {
      return console.warn(`[DataPool > BVWebSocketRegion] Got websocket message with no vatom ID in it: `, msg)
    }
    // Check if this is an incoming or outgoing vatom
    if (msg.payload.old_owner === this.currentUserID && msg.payload.new_owner !== this.currentUserID) {
      console.log("THIS IS A OUTGOING VATOM AND SHOULD BE REMOVED FROM OUR INVENTORY")
      // Vatom is no longer owned by us
      this.removeObjects([vatomID])
    } else if (msg.payload.old_owner !== this.currentUserID && msg.payload.new_owner === this.currentUserID) {

      // Vatom is now our inventory! Fetch vatom payload
      let response = await this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/get', { ids: [vatomID] })
      
      let objects = []
      console.log('THIS IS THE VATOM THAT IS RETURNED : ', response)
      // Add vatom to new objects list
          
      objects.push(new DataObject('vatom', response.vatoms[0].id, response.vatoms[0]))

      // Add faces to new objects list
      response.faces.map(f => new DataObject('face', f.id, f)).forEach(f => objects.push(f))

      // Add actions to new objects list
      response.actions.map(a => new DataObject('action', a.name, a)).forEach(a => objects.push(a))
      // Add new objects
      this.addObjects(objects)
    } else {
      // Logic error, old owner and new owner cannot be the same
      console.warn(`[DataPool > BVWebSocketRegion] Logic error in WebSocket message, old_owner and new_owner shouldn't be the same: ${vatomRef.id}`)
    }
  }
}
