
import { get } from 'lodash'

/**
 * A Filter exposes the same functions as a Region, except the returned data is filtered by the specified key.
 */
export default class Filter {

    /** Constructor */
    constructor(region, keyPath, value) {

        // Store values
        this.region = region
        this.keyPath = keyPath
        this.value = value

    }

    /** Passthrough */
    get objects() {
        return this.region.objects
    }

    /** Passthrough */
    synchronize() {
        return this.region.synchronize()
    }

    /** Passthrough */
    getItem(id, waitUntilStable = true) {
        return this.region.getItem(id, waitUntilStable)
    }

    /** Passthrough */
    map(object) {
        return this.region.map(object)
    }

    /**
     * Returns all the objects within this region, filtered by this filter.
     * 
     * @param {Boolean} waitUntilStable If true, will wait until all data objects have been retrieved. If false, will return immediately with current data.
     * @returns {Promise<Object[]>} An array of objects in this region. If `waitUntilStable` is false, returns the array immediately (without the promise).
     */
    get(waitUntilStable = true) {

        // Synchronize now
        if (waitUntilStable)
            return this.synchronize().then(e => this.get(false))

        // Create an array of all data objects
        let items = []
        for (let object of this.objects.values()) {

            // Check filtered value
            let value = get(object.data, this.keyPath)
            if (value != this.value)
                continue

            // Check for cached object
            if (object.cached) {
                items.push(object.cached)
                continue
            }

            // Map to the plugin's intended type
            let mapped = this.map(object)
            if (!mapped)
                continue

            // Cache it
            object.cached = mapped

            // Add to list
            items.push(mapped)

        }

        // Done
        return items

    }

    /** 
     * Create a filter.
     * 
     * @param {String} keyPath The data path to check
     * @param {*} value The value to check for
     * @returns {Filter} The filtered region
     */
    // TODO: Implement subfiltering
    // filter(keyPath, value) {
    //     return new Filter(this, keyPath, value)
    // }

}