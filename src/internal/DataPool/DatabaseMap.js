
import PouchDB from 'pouchdb'
import DataObject from './DataObject'

/** 
 * A version of the built-in Map class, but which synchronizes to a local database of offline access. Key must be a string,
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

        // Stop if only in memory
        if (this.noStore)
            return null

        // Create database
        return new PouchDB({

            // Database name
            name: 'datapool_' + this.id

        })

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
                if (!row.id || !row.value.rev || row.value.deleted)
                    continue

                // Create and cache the DataObject
                let obj = new DataObject(row.doc.type, row.id, row.doc.data)
                obj.rev = row.value.rev
                this.cache.set(row.id, obj)

            }

            // Done
            console.log(`[DataPool > DatabaseMap] Loaded ${this.cache.size} items from ${this.pouch.name}`)

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

        // Get existing item
        let object = this.cache.get(key)

        // Delete item
        let found = this.cache.delete(key)

        // Execute on database queue
        this.queue.run(async e => {

            // Fetch doc info, stop if already removed
            let revision = await this.getRevision(key)
            if (!revision)
                return

            // Remove document
            await this.pouch.remove(result._id, result._rev)

        })

        // Done
        return found

    }

    set(key, value) {

        // Stop if no database
        if (!this.pouch)
            return this.cache.set(key, value)

        // Get previous object
        let previousObject = this.cache.get(key)

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