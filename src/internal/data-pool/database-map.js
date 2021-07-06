
import PouchDB from 'pouchdb'
import DataObject from './data-object'

/** 
 * A version of the built-in Map class, but which synchronizes to a local database for offline access. Key must be a string,
 * and value must be a DataObject.
 */
export default class Database {

    constructor(id, noStore) {

        // Store ID
        this.id = id
        this.noStore = noStore

        // Create PouchDB instance
        this.pouch = this.setupPouchDB()

        // Local cache of objects
        this.cache = new Map()

        // Database queue
        this.queue = new Queue()

    }

    setupPouchDB() {

        // Catch errors, eg. if in private browsing mode
        try {

            // Stop if only in memory
            if (this.noStore)
                return null

            // Create database
            return new PouchDB({

                // Database name
                name: 'datapool_' + this.id

            })

        } catch (err) {

            // Failed to load
            console.warn(err)
            return null

        }

    }

    /** Load documents from storage. This must be called before the map can be used correctly. */
    async load() {

        // Only do once
        if (this.loaded) return
        this.loaded = true

        // Stop if no database
        if (!this.pouch)
            return

        // Queue this operation
        return this.queue.run(async e => {

            // Fetch all documents
            let results = await this.pouch.allDocs({ include_docs: true })

            // Store each item in the memory cache
            for (let row of results.rows) {

                // Ignore deleted and errors
                if (!row.id || !row.value.rev)
                    continue

                // Create and cache the DataObject
                let obj = new DataObject(row.doc.type, row.id, row.doc.data)
                obj.rev = row.value.rev
                this.cache.set(row.id, obj)

            }

            // Compact database in background (ie don't wait for promise)
            // TODO: Why u take so long?
            // Promise.resolve().then(async e => {
            //     let time = Date.now()
            //     await this.pouch.viewCleanup()
            //     await this.pouch.compact()
            //     console.log(`[DataPool > DatabaseMap] Compacting database took ${Math.round(Date.now() - time)} ms`)
            // })

            // Done
            console.log(`[DataPool > DatabaseMap] Loaded ${this.cache.size} items from ${this.pouch.name}`)

        }).catch(err => {

            // Failed to load from PouchDB
            console.warn('Unable to load items from PouchDB.', err)

        })

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

        // Stop if no database
        if (!this.pouch)
            return

        // Execute on database queue
        this.queue.run(async e => {

            // Delete database
            await this.pouch.destroy()

            // Create database again
            this.pouch = this.setupPouchDB()

        })

    }

    delete(key) {

        // Stop if no database
        if (!this.pouch)
            return this.cache.delete(key)

        // Delete item
        let found = this.cache.delete(key)

        // Execute on database queue
        this.queue.run(async e => {

            // Fetch doc info, stop if already removed
            let revision = await this.getRevision(key)
            if (!revision)
                return

            // Remove document
            await this.pouch.remove(key, revision)

        })

        // Done
        return found

    }

    /** Set a value. `value` must be a DataObject. */
    set(key, value) {

        // Stop if no database
        if (!this.pouch)
            return this.cache.set(key, value)

        // Set it in the memory cache
        this.cache.set(key, value)

        // Execute on database queue
        this.queue.run(async e => {

            // Fetch doc info
            let revision = await this.getRevision(key)
            if (!revision) {

                // Create new document
                await this.pouch.put({
                    _id: key,
                    type: value.type,
                    data: value.data
                })

            } else {

                // Updating existing document
                await this.pouch.put({
                    _id: key,
                    _rev: revision,
                    type: value.type,
                    data: value.data
                })

            }

        })

    }

    /** Get revision for ID */
    async getRevision(id) {

        try {

            // Stop if no database
            if (!this.pouch)
                return null

            // Load document
            let results = await this.pouch.get(id)
            return results && results._rev

        } catch (err) {

            // Check if not found
            if (err.status == 404)
                return null

            // Any other error, throw
            throw err

        }

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

}




//
// This class simply executes async functions one after another. This is useful for ensuring the order of function calls remain the same
// for async functions.
class Queue {

    constructor() {

        /** List of functions to execute on the next run loop */
        this.pending = []

        /** True if currently executing an action */
        this.isRunning = null

        // this.timer = setInterval(this.log.bind(this), 250)

    }

    /** Schedule an action */
    run(func) {

        // Create promise
        return new Promise((onSuccess, onFail) => {

            // Add to list
            this.pending.push({
                func,
                onSuccess,
                onFail
            })

            // Start timer if needed
            if (!this.isRunning)
                this.executePendingActions()

        })

    }

    /** @private Called to execute pending actions */
    executePendingActions() {

        // Stop if already running
        if (this.isRunning) return
        this.isRunning = true

        // Get next action
        let action = this.pending.shift()
        if (!action) {
            
            // Queue is complete
            this.isRunning = false
            return

        }

        // Run action
        action.func().then(e => {

            // Completed
            action.onSuccess(e)

        }).catch(err => {

            // Log errors
            console.error(err)
            action.onFail(err)

        }).then(e => {

            // Run next one
            this.isRunning = false
            this.executePendingActions()

        })

    }

    log() {
        console.log(`[DataPool > DatabaseMap] Database queue has ${this.pending.length} items pending`)
    }

}