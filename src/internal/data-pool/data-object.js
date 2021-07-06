
/**
 * Represents a raw data object, potentially without any data, which is monitored by a region.
 */
export default class DataObject {

    constructor(type, id, data) {

        /** Object type */
        this.type = type

        /** Object identifier */
        this.id = id

        /** Object revision, if any */
        this.rev = null

        /** Object payload, if any */
        this.data = data

        /** 
         * Cached object. Plugins map this raw data object to their own types, this is used to cache
         * those types if there have been no changes.
         */
        this.cached = null

    }

}