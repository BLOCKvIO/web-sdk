
/**
 * This is Version 2 of the Mempool. This version supports region monitoring, as well as timed updates.
 * Once this class is generic enough and the Data Pool Protocol is implemented, we can split this out into it's own npm module.
 *
 * This aims to follow what is described in https://github.com/BLOCKvIO/Data-Pool-Protocol/blob/master/Data%20Pool%20Protocol.md
 *
 */
export default class DataPool {
  constructor () {
    // Region plugins
    this.plugins = [
      require('./plugins/InventoryRegion').default,
      require('./plugins/VatomIDRegion').default,
      require('./plugins/VatomChildrenRegion').default,
      require('./plugins/GeoPosRegion').default
    ]

    // Currently active regions
    this.regions = []

    // Session information
    this.sessionInfo = {}
  }

  /**
   * Fetches or creates a vatom region.
   *
   * @param {string} id The plugin ID.
   * @param {*} descriptor Region-specific filtering information. See plugins for more info.
   */
  region (id, descriptor) {
    // Find existing region
    let region = this.regions.find(r => r.matches(id, descriptor))
    if (region) {
      return region
    }
    // We need to create a new region. Find region plugin
    let Region = this.plugins.find(p => p.id === id)
    if (!Region) {
      throw new Error(`Region with ID '${id}' not found.`)
    }
    // Create and store region
    region = new Region(this, descriptor)
    this.regions.push(region)

    // Return new region
    return region
  }

  /** Removes the specified region */
  removeRegion (region) {
    for (let i = 0; i < this.regions.length; i++) {
      if (this.regions[i] === region) {
        return this.regions.splice(i, 1)
      }
    }
  }

  /**
   * Update session-specific information used by plugins.
   */
  setSessionInfo (info) {
    // Store it
    this.sessionInfo = info

    // Notify regions
    for (let r of this.regions) {
      r.onSessionInfoChanged(info)
    }
  }

  /** Retrieve information about storage etc */
  stats() {

    // Calculate size of local storage
    let sizeBytes = 0
    for (let key in localStorage)
      if (key.startsWith('sync.'))
        sizeBytes += localStorage[key].length

    // Done
    return {
      estimatedSize: sizeBytes
    }

  }

  /** Clear cached items */
  clearCache() {

    // Remove local storage cached items
    for (let key in localStorage)
      if (key.startsWith('sync.'))
        localStorage.removeItem(key)

  }

}
