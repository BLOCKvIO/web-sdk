import DataObject from './DataObject'
import LZUTF8 from 'lzutf8'
import LZUTF8WorkerScript from './LZUTF8WorkerScript.js'

/** 
 * A version of the built-in Map class, but which synchronizes to localStorage for offline access. Key must be a string,
 * and value must be a DataObject.
 */
export default class Database {

  constructor(id, noStore) {

    // Store ID
    this.id = id
    this.noStore = noStore

    // Local cache of objects
    this.cache = new Map()

  }

  /** Load documents from storage. This must be called before the map can be used correctly. */
  async load() {
    // Only do once
    if (this.loaded) return
    this.loaded = true

    try {

      // Stop if no store
      if (this.noStore)
        return

      // Fetch compressed data
      let uncompressed = localStorage['sync.' + this.id]
      if (!uncompressed)
        return

      // Apply worker script if possible
      // if (window.Blob && window.URL && window.Worker) {

      //     // Worker available
      //     let blob = new Blob([atob(LZUTF8WorkerScript)])
      //     let url = URL.createObjectURL(blob)
      //     LZUTF8.WebWorker.scriptURI = url

      // } else {

      //     // Worker not available
      //     console.warn(`[DataPool > LocalStorageMap] Web worker unavailable, app performance may suffer while saving or loading.`)

      // }

      // Decompress it
      // TODO: Ensure it's using a worker
      let startTime = Date.now()
      // let uncompressed = await new Promise((resolve, reject) => {
      //     LZUTF8.decompressAsync(compressed, { inputEncoding: "StorageBinaryString" }, (result, error) => {
      //         if (error) reject(error)
      //         else resolve(result)
      //     })
      // })

      // Store each item in the memory cache
      let rows = JSON.parse(uncompressed)
      for (let row of rows) {

        // Create and cache the DataObject
        let obj = new DataObject(row.type, row.id, row.data)
        this.cache.set(row.id, obj)

      }

      // Done!
      console.debug(`[DataPool > LocalStorageMap ${this.id}] Loaded ${rows.length} items from ${Math.floor(uncompressed.length / 1024)} KB of data in ${Date.now() - startTime} ms`)

    } catch (err) {

      // Failed to load cached items
      console.warn(`[DataPool > LocalStorageMap ${this.id}] Unable to load cached items: ${err.message}`)

    }

  }

  /** Passthrough getter functions, these don't modify the database */
  get size() { return this.cache.size }
  entries() { return this.cache.entries() }
  forEach(callback, thisValue) { return this.cache.forEach(callback, thisValue) }
  get(key) { return this.cache.get(key) }
  has(key) { return this.cache.has(key) }
  keys() { return this.cache.keys() }
  values() { return this.cache.values() }
  [Symbol.iterator]() { return this.cache[Symbol.iterator]() }

  clear() {

    // Clear the array
    this.cache.clear()

    // Save soon
    this.saveSoon()

  }

  delete(key) {

    // Delete item
    let found = this.cache.delete(key)

    // Save soon
    if (found)
      this.saveSoon()

    // Done
    return found

  }

  /** Set a value. `value` must be a DataObject. */
  set(key, value) {

    // Set it in the memory cache
    this.cache.set(key, value)

    // Save soon
    this.saveSoon()

  }

  /** Get a string extra value */
  getExtra(key) {

    // Get item
    let itm = this.get('extra:' + key)
    if (itm)
      return itm.data
    else
      return null

  }

  /** Set a string extra */
  setExtra(key, value) {

    // Set item if it's changed
    if (this.getExtra(key) != value)
      this.set('extra:' + key, { type: '_extra', data: value })

  }

  /** @private Save changes soon */
  saveSoon() {

    // If web workers are supported, save as quick as possible. If not, add a delay to prevent freezing the browser main thread.
    let saveInterval = window.Worker ? 100 : 2000

    // Start a timer to save soon, unless one exists already
    if (!this.saveTimer) {

      // Create save timer
      this.saveTimer = setTimeout(this.save.bind(this), saveInterval)

    } else {

      // Changes still occurring, schedule another save
      this.changesStillOccurring = true

    }

  }

  /** @private Save to local storage now */
  async save() {

    // Stop if changes are still occurring
    if (this.changesStillOccurring) {

      // Wait until it stops
      this.saveTimer = null
      this.saveSoon()
      this.changesStillOccurring = false
      return

    }

    // Catch errors
    try {

      // Stop if no store
      if (this.noStore)
        return

      // Serialize data
      let startedAt = Date.now()
      let items = []
      this.cache.forEach((obj, id) => {
        items.push({ id, type: obj.type, data: obj.data })
      })
      let uncompressed = JSON.stringify(items)

      // Compress it
      // let compressed = await new Promise((resolve, reject) => {
      //     LZUTF8.compressAsync(uncompressed, { outputEncoding: "StorageBinaryString" }, (result, error) => {
      //         if (error) reject(error)
      //         else resolve(result)
      //     })
      // })

      // Save to storage
      localStorage.removeItem('sync.' + this.id)
      localStorage.setItem('sync.' + this.id, uncompressed)

      // Done!
      console.debug(`[DataPool > LocalStorageMap] Saved ${items.length} items, using ${Math.floor(uncompressed.length / 1024)} KB of data in ${Date.now() - startedAt} ms`)

    } catch (err) {

      // Failed!
      console.warn(`[DataPool > LocalStorageMap] Failed to save! ${err.message}`)

    }

    // Remove save timer
    this.saveTimer = null

    // If changes occurred during the save, save again
    if (this.changesStillOccurring) {
      this.changesStillOccurring = false
      this.saveSoon()
    }

  }

}