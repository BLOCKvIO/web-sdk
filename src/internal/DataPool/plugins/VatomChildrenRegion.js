
import BLOCKvRegion from './BLOCKvRegion'
import Discover from '../../../client/Discover'
import DataObject from '../DataObject'

/**
 * This region plugin provides access to a collection of vatoms that are children of another vatom.
 * The 'inventory' region is much mor reliable, so if you know that your vatoms are owned by the current user,
 * use the inventory region with a filter rather.
 *
 * To get an instance, call `DataPool.region('children', "parent-id")`
 */
export default class VatomChildrenRegion extends BLOCKvRegion {
  /** Plugin ID */
  static get id () { return 'children' }

  /** Constructor */
  constructor (dataPool, parentID) {
    super(dataPool)

    // Store ID
    this.parentID = parentID
  }

  /** Our state key is the list of IDs */
  get stateKey () {
    return 'children:' + this.parentID
  }

  /** Check if a region request matches our region */
  matches (id, descriptor) {
    return id === 'children' && descriptor === this.parentID
  }

  /** Load current state from the server */
  async load () {
    // Pause websocket events
    this.pauseMessages()

    // Fetch data
    let payload = new Discover().setScope(Discover.FieldParentID, this.parentID).getPayload()
    let response = await this.dataPool.Blockv.client.request('POST', '/vatom/discover', payload, true)

    // Add vatom to new objects list
    let objects = []
    response.results.map(v => new DataObject('vatom', v.id, v)).forEach(f => objects.push(f))

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
}
