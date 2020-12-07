import Region from '../CompositeRegion'
import PlatformInventoryRegion from './PlatformRegion'
/**
 * This region plugin provides access to the current user's inventory.
 *
 * To get an instance, call `DataPool.region('inventory')`
 */
export default class InventoryRegion extends Region {
  /** Plugin ID */
  static get id() { return 'inventory' }

  /** Constructor */
  constructor(dataPool) {
    super(dataPool)
    // Make sure we have a valid current user
    if (!this.dataPool.sessionInfo || !this.dataPool.sessionInfo.userID) {
      throw new Error('You cannot query the inventory region without being logged in.')
    }
    // Store current user ID
    this.currentUserID = this.dataPool.sessionInfo.userID

    // Remove cached items of users that are not logged in
    for (let key in localStorage) {
      if (key.startsWith('sync.inventory:')
        || (key.startsWith('sync.inventory-') && !key.endsWith(':' + this.currentUserID))) {
        localStorage.removeItem(key);
      }
    }
  }

  createRegion(datapool, platformId)
  {
    return new PlatformInventoryRegion(datapool, platformId);
  }

  /** Our state key is the current user's ID */
  get stateKey() {
    return 'inventory:' + this.currentUserID
  }

  /** There should only be one inventory region */
  matches(id, descriptor) {
    return id === 'inventory'
  }

  /** Shut down this region if the current user changes */
  onSessionInfoChanged() {
    this.close()
  }
}
