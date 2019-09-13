/* global localStorage */
import EventEmitter from './EventEmitter'
import DataObject from './DataObject'
import Filter from './Filter'
import LZString from 'lz-string'
import { merge, get, set } from 'lodash'
import Delayer from './Delayer'
import DatabaseMap from './DatabaseMap'

/**
 * Base class for a region.
 *
 * @event updated When any data in the region changes. This also indicates that there is no longer an error.
 * @event object.updated When a data object changes. Called with the ID of the changed object.
 * @event object.removed When a data object is removed. Called with the ID of the removed object.
 * @event error When an error occurs.
 * @event closed When the inventory is closed. eg. When the user is logged out
 */
export default class Region extends EventEmitter {
  /** @private Subclasses should use this to update and start monitoring the region */
  constructor (dataPool) {
    super()

    /** If true, this region will not be cached to disk. */
    this.noCache = false

    /** Store reference to the data pool */
    this.dataPool = dataPool

    /** True if data in this region is entirely in sync with the backend */
    this.synchronized = false

    /** If there's an error, this contains the current error. */
    this.error = null

    // Try to make region stable immediately
    this._syncPromise = null
    Delayer.run(e => this.synchronize())
  }

  /** Lazy load the objects database */
  get objects() {

    // Check if loaded already
    if (this._objects)
      return this._objects

    // Create DB
    this._objects = new DatabaseMap(this.stateKey, this.noCache)
    return this._objects

  }

  /**
     * Re-synchronizes the region by manually fetching everything from the server again.
     */
  forceSynchronize () {
    this.synchronized = false
    return this.synchronize()
  }

  /**
     * This will try to make the region stable by querying the backend for all data.
     *
     * @private Called by the Region superclass.
     * @returns {Promise} Resolves once the region is in sync with the backend.
     */
  synchronize () {
    // Stop if already running
    if (this._syncPromise) { return this._syncPromise }

    // Remove pending error
    this.error = null
    this.emit('updated')

    // Stop if already in sync
    if (this.synchronized) { return Promise.resolve() }

    // Do the sync
    this._syncPromise = this._synchronize().catch(err => {
      // Error handling, notify listeners of an error
      this._syncPromise = null
      this.error = err
      console.error(err)
      this.emit('error', err)
    })

    // Return promise
    return this._syncPromise

  }

  async _synchronize() {

    // Sync start
    console.log(`[DataPool > Region] Starting synchronization for region ${this.stateKey}`)

    // Create and load the database
    await this.objects.load()
    this.emit('updated')

    // Allow plugin to start loading content
    let loadedIDs = await this.load()

    // If the subclass load() returned an array of IDs, we can remove everything which is not in that list.
    if (loadedIDs && typeof loadedIDs.length === 'number') {
      let keysToRemove = []
      for (let id of this.objects.keys()) {
        // Check if it's in our list
        if (!loadedIDs.includes(id)) { keysToRemove.push(id) }
      }

      // Remove vatoms
      this.removeObjects(keysToRemove)
    }

    // All data is up to date!
    this.synchronized = true
    this._syncPromise = null
    this.emit('updated')
    console.log(`[DataPool > Region] Region '${this.stateKey}' is now in sync!`)
    
  }

  /**
     * A key which is unique for this exact region. This is used when saving/restoring state to disk.
     *
     * @abstract Subclasses should override this.
     * @returns {String} The state key.
     */
  get stateKey () {
    throw new Error(`Subclasses must override 'get stateKey()' in order to correctly handle saving/restoring state to disk.`)
  }

  /**
     * Start initial load. This should resolve once the region is up to date.
     *
     * @private Called by the Region superclass.
     * @abstract Subclasses should override this.
     * @returns {Promise<>} Once this promise resolves, the region should be stable.
     */
  async load () {
    throw new Error(`Subclasses must override Region.load()`)
  }

  /**
     * Stop and destroy this region.
     *
     * @abstract Subclasses should override this, but call super.close()
     */
  close () {
    // Notify data pool we have closed
    this.dataPool.removeRegion(this)
    this.emit('closed')
  }

  /**
     * Checks if the specified query matches our region. This is used to identify if a region request
     * can be satisfied by this region, or if a new region should be created.
     *
     * @private Called by DataPool.
     * @abstract Subclasses should override this.
     * @param {string} id The region plugin ID
     * @param {*} descriptor The region-specific filter data.
     */
  matches (id, descriptor) {
    throw new Error('Subclasses must override Region.matches()')
  }

  /**
     * Stores a collection of data objects which have been added to the pool.
     *
     * @private Called by subclasses.
     * @param {DataObject[]} objects List of new data objects added to the pool.
     */
  addObjects (objects) {

    // Go through each object
    for (let obj of objects) {

      // Check if object exists already
      let existingObject = this.objects.get(obj.id)
      if (existingObject) {

        // Notify
        this.willUpdateFields(existingObject, obj.data)

        // It exists already, update the object
        existingObject.data = obj.data
        existingObject.cached = null

        // Update database copy
        this.objects.set(obj.id, obj)

      } else {

        // Notify
        this.willAdd(obj)

        // It does not exist, add it
        this.objects.set(obj.id, obj)

      }

      // Emit event, on next run loop so all objects are added first
      Delayer.run(e => this.emit('object.updated', obj.id))

    }

    // Notify updated
    if (objects.length > 0) 
      this.emit('updated')

  }

  /**
     * Updates data objects within our pool.
     *
     * @private Called by subclasses
     * @param {Object[]} objects An array of changes. Each object contains an `id` string and a `new_data` sparse object containing the changed fields.
     */
  updateObjects (objects) {
    // Go through each object
    let didUpdate = false
    for (let obj of objects) {
      // Fetch existing object
      let existingObject = this.objects.get(obj.id)
      if (!existingObject) { continue }

      // Stop if existing object doesn't have the full data
      if (!existingObject.data) { continue }

      // Notify
      this.willUpdateFields(existingObject, obj.new_data)

      // Update fields
      merge(existingObject.data, obj.new_data)

      // Clear cached values
      existingObject.cached = null

      // Emit event, on next run loop so all objects are updated first
      Delayer.run(e => this.emit('object.updated', obj.id))
      didUpdate = true
    }

    // Notify updated
    if (didUpdate) { this.emit('updated') }
  }

  /**
     * Removes the specified objects from our pool.
     *
     * @private Called by subclasses.
     * @param {String[]} ids An array of object IDs to remove.
     */
  removeObjects (ids) {
    // Remove all data objects with the specified IDs
    let didUpdate = false
    for (let id of ids) {
      // Notify
      this.willRemove(id)

      // Remove it
      if (this.objects.delete(id)) {
        // Emit event, on next run loop so all objects are updated first
        Delayer.run(e => this.emit('object.removed', id))
        didUpdate = true
      }
    }

    // Notify updated
    if (didUpdate) { this.emit('updated') }
  }

  /**
     * If a region plugin depends on the session data, it may override this method and `this.close()` itself if needed.
     *
     * @private Called by DataPool.
     * @abstract Subclasses can override this if they want.
     * @param {*} info The new session info.
     */
  onSessionInfoChanged (info) {}

  /**
     * If the plugin wants, it can map DataObjects to another type. This takes in a DataObject and returns a new type.
     * If you return null, the specified data object will not be returned.
     *
     * The default implementation simply returns the DataObject.
     *
     * @param {DataObject} object The input raw object
     * @returns {*} The output object.
     */
  map (object) {
    return object
  }

  /**
     * Iterate over each object in this region. Return `false` from the callback to stop. This does not wait
     * for the region to synchronize. This is a synchronous function.
     *
     * @param {Function(*)} callback Gets called once for each objbect in the region.
     */
  forEach (callback) {
    // Go through all data objects
    for (let object of this.objects.values()) {
      // Check for cached object
      let mapped = object.cached

      // Check if no cached object
      if (!mapped) {
        // Map to the plugin's intended type
        object.cached = mapped = this.map(object)
      }

      // Stop if no mapped object
      if (!mapped) { continue }

      // Call callback, stop if they returned false
      if (callback(mapped) === false) { break }
    }
  }

  /**
     * Returns all the objects within this region.
     *
     * @param {Boolean} waitUntilStable If true, will wait until all data objects have been retrieved. If false, will return immediately with current data.
     * @returns {Promise<Object[]>} An array of objects in this region. If `waitUntilStable` is false, returns the array immediately (without the promise).
     */
  get (waitUntilStable = true) {
    // Synchronize now
    if (waitUntilStable) {
      return this.synchronize().then(e => this.get(false))
    }

    // Create an array of all data objects
    let items = []
    for (let object of this.objects.values()) {
      // Check for cached object
      if (object.cached) {
        items.push(object.cached)
        continue
      }

      // Map to the plugin's intended type
      let mapped = this.map(object)
      if (!mapped) {
        continue
      }

      // Cache it
      object.cached = mapped

      // Add to list
      items.push(mapped)
    }

    // Done
    return items
  }

  /**
     * Returns an object within this region by it's ID.
     *
     * @param {Boolean} waitUntilStable If true, will wait until all data objects have been retrieved. If false, will return immediately with current data.
     * @returns {Promise<Object>} An object in this region. If `waitUntilStable` is false, returns immediately (without the promise).
     */
  getItem (id, waitUntilStable = true) {
    // Synchronize now
    if (waitUntilStable) {
      return this.synchronize().then(e => this.getItem(id, false))
    }

    // Get object
    let object = this.objects.get(id)
    if (!object) {
      return null
    }

    // Check for cached object
    if (object.cached) { return object.cached }

    // Map to the plugin's intended type
    let mapped = this.map(object)
    if (!mapped) { return null }

    // Cache it
    object.cached = mapped

    // Done
    return mapped
  }

  /**
     * Returns true if the object with the specified ID exists in the cache.
     *
     * @param {*} id The object's ID
     * @returns {boolean} True if the object exists.
     */
  has (id) {
    return this.objects.has(id)
  }

  /**
     * Change a field, and return a function which can be called to undo the change.
     *
     * @param {String} id Object ID
     * @param {String} keyPath The key to change
     * @param {*} value The new value
     * @returns {Function} An undo function
     */
  preemptiveChange (id, keyPath, value) {
    // Get object. If it doesn't exist, do nothing and return an undo function which does nothing.
    let object = this.objects.get(id)
    if (!object) { return function () {} }

    // Get current value
    let oldValue = get(object.data, keyPath)

    // Notify
    this.willUpdateField(object, keyPath, oldValue, value)

    // Update to new value
    set(object.data, keyPath, value)
    object.cached = null
    this.emit('object.updated', id)
    this.emit('updated')

    // Notify database of change
    this.objects.set(id, object)

    // Return undo function
    return e => {
      // Notify
      this.willUpdateField(object, keyPath, value, oldValue)

      // Revert
      set(object.data, keyPath, oldValue)
      object.cached = null
      this.emit('object.updated', id)
      this.emit('updated')

      // Notify database of change
      this.objects.set(id, object)
    }
  }

  /**
     * Remove an object, and return an undo function.
     *
     * @param {String} id The ID of the object to remove.
     * @returns {Function} An undo function
     */
  preemptiveRemove (id) {
    // Get object. If it doesn't exist, do nothing and return an undo function which does nothing.
    let object = this.objects.get(id)
    if (!object) { return function () {} }

    // Notify
    this.willRemove(object)

    // Remove object
    this.objects.delete(id)
    this.emit('updated')

    // Return undo function
    return e => {
      // Check that a new object wasn't added in the mean time
      if (this.objects.has(id)) { return }

      // Notify
      this.willAdd(object)

      // Revert
      this.addObjects([object])
    }
  }

  /**
     * Create a filter
     *
     * @param {String} keyPath The data path to check
     * @param {*} value The value to check for
     * @returns {Filter} The filtered region
     */
  filter (keyPath, value) {
    return new Filter(this, keyPath, value)
  }

  /**
     * Called when an object is about to be added.
     *
     * @private
     * @abstract Can be overridden by subclasses which need to get these events.
     * @param {DataObject} object The object which will be added.
     */
  willAdd (object) {}

  /**
     * Called when an object is about to be updated.
     *
     * @private
     * @abstract Can be overridden by subclasses which need to get these events.
     * @param {DataObject} object The object which will be updated.
     * @param {Object} newData The sparse object containing the changed fields
     */
  willUpdateFields (object, newData) {}

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
  willUpdateField (object, keyPath, oldValue, newValue) {}

  /**
     * Called when an object is about to be removed.
     *
     * @private
     * @abstract Can be overridden by subclasses which need to get these events.
     * @param {DataObject|String} objectOrID The object (or ID) which will be updated.
     */
  willRemove (objectOrID) {}
}
