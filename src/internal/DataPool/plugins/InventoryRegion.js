
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

  /** 
   * Load current state from the server. The process is as follows:
   * 
   * 1. Call /hash API to get the current inventory hash, if it matches our local copy then stop.
   * 2. Call /sync API to fetch all vatom sync numbers
   * 3. For all vatoms in our db which is not returned by /sync, remove
   * 4. For all vatoms which are not in our dbb, or whose sync number is different, fetch via individual GET (batched)
   * 
   * If at any point the above process throws an error, fall back to the v1 approach:
   * 
   * 1. Fetch all vatoms from the /inventory API
   * 2. For any vatoms in our db not returned by /inventory, remove
   * 
   */
  async load () {

    // Pause websocket events
    this.pauseMessages()

    let ids = null
    try {

      // Load via new method
      await this.loadV2()

      // Synchronize faces and actions
      await this.loadV2FacesActions()

    } catch (err) {

      // Failed! Try via the v1 method
      console.warn('[DataPool > InventoryRegion] Unable to sync via the new method! Attempting the old method now. Reason:', err)
      ids = await this.loadV1()

    }

    // Resume websocket events
    this.resumeMessages()
    return ids

  }

  /** Fetches changed faces and actions since the last vatom was modified. */
  async loadV2FacesActions() {

    // Get details
    let templateIDs = []
    let lastStableSync = this.objects.getExtra('last-stable-sync')
    for (let vatom of this.get(false))
      if (!templateIDs.includes(vatom.properties.template))
        templateIDs.push(vatom.properties.template)

    console.debug(`[DataPool > InventoryRegion] Synchronizing faces using v2 method... Starting from date ${new Date(lastStableSync).toLocaleString()} and using ${templateIDs.length} templates.`)

    // Server only supports a few at a time, so batch these.
    // Convert the server's data to an array of:
    //
    // { 
    //     operation: "create" | "update" | "delete",
    //     type: "face" | "action",
    //     id: "...",
    //     template: "...",
    //     data: {...}
    // }
    // 
    let maxPerRequest = 100
    let allChanges = []
    for (let i = 0 ; i < templateIDs.length ; i += maxPerRequest) {

      // Load next page
      let data = await this.dataPool.Blockv.client.request('POST', '/v1/vatom/actions/changes', {
        templates: templateIDs.slice(i, Math.min(i + maxPerRequest, templateIDs.length)),
        since: lastStableSync
      }, true)

      // Add changes for each key
      for (let templateID in data.actions_changes)
        for (let change of data.actions_changes[templateID])
          allChanges.push({ operation: change.operation, template: templateID, id: change.action.name, type: "action", data: change.action })

      console.debug(`[DataPool > InventoryRegion] Fetched action changes for templates ${i} to ${Math.min(i + maxPerRequest, templateIDs.length)}`)

    }
    
    for (let i = 0 ; i < templateIDs.length ; i += maxPerRequest) {

      // Load next page
      let data = await this.dataPool.Blockv.client.request('POST', '/v1/vatom/faces/changes', {
        templates: templateIDs.slice(i, Math.min(i + maxPerRequest, templateIDs.length)),
        since: lastStableSync
      }, true)

      // Add changes for each key
      for (let templateID in data.faces_changes)
        for (let change of data.faces_changes[templateID])
          allChanges.push({ operation: change.operation, template: templateID, id: change.face.id, type: "face", data: change.face })

      console.debug(`[DataPool > InventoryRegion] Fetched face changes for templates ${i} to ${Math.min(i + maxPerRequest, templateIDs.length)}`)

    }

    // Apply changes
    console.debug(`[DataPool > InventoryRegion] Applying ${allChanges.length} face/action changes`)
    let clearCacheForTemplates = []
    for (let change of allChanges) {

      // Check if delete or update
      if (change.operation == 'delete') {

        // Remove it
        console.log('Removing ' + change.id)
        this.removeObjects([change.id])

      } else {

        // Create or update it
        console.log('Creating or updating ' + change.id)
        this.addObjects([new DataObject(change.type, change.id, change.data)])

      }

      // Add template
      if (!clearCacheForTemplates.includes(change.template))
        clearCacheForTemplates.push(change.template)

    }

    // Clear cache for all affected vatoms
    for (let object of this.objects.values()) {

      // Skip if not modified
      let objectTemplate = object.data && object.data['vAtom::vAtomType'] && object.data['vAtom::vAtomType'].template
      if (!clearCacheForTemplates.includes(objectTemplate))
        continue

      // Stop if no cached vatom
      if (!object.cached)
        continue
        
      // Remove cached vatom and notify
      object.cached = null
      this.emit('object.updated', object.id)

    }

    // Notify region updated, if there were changes
    if (clearCacheForTemplates.length > 0) {
      this.emit('updated')
    }
    
    // Store latest sync date
    this.objects.setExtra('last-stable-sync', Date.now())

  }

  /** Synchronize inventory using the v2 sync method, ie checking the hash, using sync numbers, etc. */
  async loadV2() {

    // Check SDK config to see if the new sync method is disabled
    if (this.dataPool.disableSyncV2)
      throw new Error('V2 synchronization algorithm is disabled in the config.')

    // Stop if no vatoms
    if (!Array.from(this.objects.values()).find(obj => obj.type == 'vatom'))
      throw new Error(`V2 synchronization is disabled if the inventory is empty, since it's faster to use the old method for initial sync.`)

    // Stop if faces and actions sync date has not bee set
    let lastStableSync = this.objects.getExtra('last-stable-sync')
    if (!lastStableSync)
      throw new Error(`V2 synchronization is disabled, since we don't know when the last stable sync was.`)

    // Get current inventory hash and compare with server's
    let currentHash = this.objects.getExtra('hash')
    let serverHashReq = await this.dataPool.Blockv.client.request('GET', '/v1/user/vatom/inventory/hash', null, true)
    if (!serverHashReq.hash)
      throw new Error('The server did not return a hash for our current inventory.')
    if (currentHash && currentHash == serverHashReq.hash)
      return console.log('[DataPool > InventoryRegion] Sync complete, our hash matches the server, no changes needed.')
    
    // We are not in sync with the server. Fetch all vatom IDs and their sync numbers
    var allSyncs = []
    var page = 0
    var nextToken = null
    while (true) {

      // Fetch next page of IDs
      page += 1
      console.log(`[DataPool > InventoryRegion] Fetching page ${page} of sync statuses...`)
      let res = await this.dataPool.Blockv.client.request('GET', '/v1/user/vatom/inventory/index?limit=1000' + (nextToken ? `&next_token=${nextToken}` : ''), null, true)

      // Add to array
      allSyncs = allSyncs.concat(res.vatoms || [])

      // Get next token
      nextToken = res.next_token
      if (!nextToken)
        break

    }

    // Remove vatoms which are no longer here
    let keysToRemove = Array.from(this.objects.values()).filter(obj => obj.type == 'vatom' && !allSyncs.find(sync => sync.id == obj.id)).map(obj => obj.id)
    this.removeObjects(keysToRemove)
    if (keysToRemove.length > 0)
      console.log(`DataPool > InventoryRegion] Removed ${keysToRemove.length} vatoms which are no longer in the inventory`)

    // Check which vatoms are out of sync
    var idsToFetch = []
    for (let syncInfo of allSyncs) {

      // Get local vatom
      let vatom = this.getItem(syncInfo.id, false)
      if (!vatom || vatom.sync != syncInfo.sync)
        idsToFetch.push(syncInfo.id)

    }

    // Fetch vatoms in bulk
    let VatomsPerPage = 100
    let remainingIds = idsToFetch
    while (remainingIds.length > 0) {

      // Fetch next 100 vatoms
      let ids = remainingIds.slice(0, VatomsPerPage)
      remainingIds = remainingIds.slice(VatomsPerPage)
      console.log(`[DataPool > InventoryRegion] Fetching ${ids.length} updates, ${remainingIds.length} vatoms left...`)
      let response = await this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/get', { ids }, true)

      // Create list of new objects
      let newObjects = []

      // Add vatoms to the list
      for (let v of response.vatoms)
        newObjects.push(new DataObject('vatom', v.id, v))

      // Add faces to the list
      for (let f of response.faces)
        newObjects.push(new DataObject('face', f.id, f))

      // Add actions to the list
      for (let a of response.actions)
        newObjects.push(new DataObject('action', a.name, a))

      // Update the pool
      this.addObjects(newObjects)

    }

    // Done! Store the inventory hash for next sync
    this.objects.setExtra('hash', serverHashReq.hash)
    console.log(`[DataPool > InventoryRegion] Sync complete! We fetched ${idsToFetch.length} vatoms, and removed ${keysToRemove.length} vatoms.`)

  }

  /** Synchronize inventory using the v1 method, ie fetching everything using /user/vatom/inventory. */
  async loadV1() {

    // Go through all pages on the server, we want _everything_
    let pageCount = 1
    let loadedIDs = []
    while (true) {
      
      // Fetch all vatoms the user owns, via a Discover call
      console.debug(`[DataPool > InventoryRegion] Fetching owned vatoms, page ${pageCount}...`)
      let response = await this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/inventory', { 
        parent_id: "*",
        limit: 1000,
        page: pageCount
      }, true)

      // Create list of new objects
      let newObjects = []

      // Add vatoms to the list
      for (let v of response.vatoms) {
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

    // We have completed a full sync! Store this date.
    this.objects.setExtra('last-stable-sync', Date.now())

    // Return array of all items
    return loadedIDs

  }

  /** @override Called on WebSocket message. */
  async processMessage (msg) {
    // Call super
    super.processMessage(msg)
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
      // Vatom is no longer owned by us
      this.removeObjects([vatomID])
    } else if (msg.payload.old_owner !== this.currentUserID && msg.payload.new_owner === this.currentUserID) {

      // Vatom is now our inventory! Fetch vatom payload
      let response = await this.dataPool.Blockv.client.request('POST', '/v1/user/vatom/get', { ids: [vatomID] }, true)
      
      // Add vatom to new objects list
      let objects = []
      response.vatoms.map(v => new DataObject('vatom', v.id, v)).forEach(v => objects.push(v))

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

  /** 
   * Override the get() function to not return vatoms with a different owner. This can happen during a preemptive transfer,
   * where the vatom is given a new owner ID but not removed entirely from this region. The host app should still see it as removed though.
   */
  get(waitUntilStable = true) {

    // Pass on if we should wait
    if (waitUntilStable)
      return super.get(true)

    // Filter array of vatoms
    return super.get(false).filter(v => v.properties.owner == this.currentUserID)

  }

  // When a preemptive change occurs, clear our stored hash so that the next inventory refresh will query with the server.
  // Normally this should not be needed since the hash on the server should change as well, but sometimes if an action fails
  // and we fail to rollback the DB we'll be stuck with an outdated vatom.
  willAdd (object) {
    super.willAdd(object)
    this.onObjectPreemptivelyChanged(object) 
  }
  
  willUpdateFields (object, newData) {
    super.willUpdateFields(object, newData)
    this.onObjectPreemptivelyChanged(object) 
  }

  willUpdateField (object, keyPath, oldValue, newValue) {
    super.willUpdateField(object, keyPath, oldValue, newValue)
    this.onObjectPreemptivelyChanged(object)
  }
  
  willRemove (objectOrID) {
    super.willRemove(objectOrID)
    this.objects.setExtra('hash', '')
  }
  
  onObjectPreemptivelyChanged(object) {

    // Update object's sync # so that on the next refresh we fetch it's state from the server.
    object.data.sync = -1

    // Clear our hash
    this.objects.setExtra('hash', '')

  }

}
