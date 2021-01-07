import Region from '../Region'
/**
 * Intermediate class which handles updates maintaining multiple regions for the different blockv platforms
 *
 */
export default class CompositeRegion extends Region {

  get objects() {
    return null;
  }

  getPlatformRegions() {
    if (this.getPlatformsPromise)
      return this.getPlatformsPromise;

    if (this.platformRegions)
      return Promise.resolve(this.platformRegions);

    this.getPlatformsPromise = this.dataPool.Blockv.platform.getIds()
      .then(platformIds => {
        const regions = [];
        platformIds.forEach(platformId => {
          const region = this.createRegion(this.dataPool, platformId);
          region.trigger = this.trigger.bind(this);
          region.triggerEvent = this.triggerEvent.bind(this);
          region.emit = this.emit.bind(this);
          regions.push(region);
        });
        this.getPlatformsPromise = null;
        this.platformRegions = regions;
        return regions;
      })

    return this.getPlatformsPromise;
  }

  createRegion(datapool, platformId) {
    throw new Error(`Subclasses must override 'get createRegion()'.`)
  }

  /** Called when this region is going to be shut down */
  async close() {
    super.close()
    if (this.platformRegions || this.getPlatformsPromise) {
      const regions = await this.getPlatformRegions();
      for (let region of regions) {
        region.close();
      }
    }
  }

  load() {
  }

  async _synchronize() {
    this.emit('synchronize.start');
    const regions = await this.getPlatformRegions();
    for (let region of regions) {
      try {
        await region.forceSynchronize();
      } catch (error) {
        console.warn(error);
      }
    }
    // All data is up to date!
    this.synchronized = true;
    this._syncPromise = null;
    this.emit('synchronize.complete');
    this.emit('updated');
    console.log(`[DataPool > Region] Region '${this.stateKey}' is now in sync!`);
  }

  async forEach(callback) {
    const regions = await this.getPlatformRegions();
    for (let region of regions) {
      await region.forEach(callback);
    }
  }

  async map(object) {
    const regions = await this.getPlatformRegions();
    return regions[0].map(object);
  }

  async get(waitUntilStable = true) {
    // Synchronize now
    if (waitUntilStable) {
      return this.synchronize().then(e => this.get(false))
    }
    // Create an array of all data objects
    let items = [];
    const regions = await this.getPlatformRegions();
    for (let region of regions) {
      const temp = region.get(false);
      items = items.concat(temp);
    }
    // Done
    return items
  }


  async getItem(id, waitUntilStable = true) {
    // Synchronize now
    if (waitUntilStable) {
      return this.synchronize().then(e => this.getItem(id, false))
    }

    const regions = await this.getPlatformRegions();
    for (let region of regions) {
      const item = region.getItem(id, false);
      if (item) {
        return item;
      }
    }
  }

  async has(id) {
    const regions = await this.getPlatformRegions();
    for (let region of regions) {
      if (region.has(id)) {
        return true;
      }
    }
    return false;
  }

  async preemptiveChange(id, keyPath, value) {
    const regions = await this.getPlatformRegions();
    for (let region of regions) {
      if (region.has(id)) {
        return region.preemptiveChange(id, keyPath, value);
      }
    }
    // Get object. If it doesn't exist, do nothing and return an undo function which does nothing.
    return function () { };
  }

  async preemptiveRemove(id) {
    const regions = await this.getPlatformRegions();
    for (let region of regions) {
      if (region.has(id)) {
        return region.preemptiveRemove(id);
      }
    }
    // Get object. If it doesn't exist, do nothing and return an undo function which does nothing.
    return function () { };
  }

  addObjects(objects) {

  }

  updateObjects(objects) {

  }
  removeObjects(ids) {
  }

  filter(keyPath, value) {
    return null;
  }

}
