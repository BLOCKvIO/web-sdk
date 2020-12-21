import Region from '../CompositeRegion'
import PlatformGeoRegion from './PlatformRegion'

/**
 * This region plugin provides access to a collection of vatoms that has been dropped within the specified region on the map.
 *
 * To get an instance, call `DataPool.region('geopos', { top_right: { lat: ..., lon: ... }, bottom_left: { lat: ..., lon: ... } })`
 */
export default class GeoPosRegion extends Region {

  /** Plugin ID */
  static get id() { return 'geopos' }

  /** Constructor */
  constructor(dataPool, coordinates) {
    super(dataPool)

    // Don't cache this content
    this.noCache = true

    // Fail if coordinates are invalid
    if (!coordinates || !coordinates.top_right || !coordinates.top_right.lat || !coordinates.top_right.lon || !coordinates.bottom_left || !coordinates.bottom_left.lat || !coordinates.bottom_left.lon) {
      throw new Error('Please specify the top_right and bottom_left coordinates in the region descriptor.')
    }

    // Store coordinates
    this.coordinates = coordinates
  }

  createRegion(datapool, platformId) {
    return new PlatformGeoRegion(datapool, platformId, {
      coordinates: this.coordinates,
      matches: (id, descriptor) => {
        // Check all filters match
        if (id !== 'geopos-' + this.platformId) return false
        if (!descriptor || !descriptor.top_right || !descriptor.bottom_left) return false
        if (descriptor.top_right.lat !== this.coordinates.top_right.lat) return false
        if (descriptor.top_right.lon !== this.coordinates.top_right.lon) return false
        if (descriptor.bottom_left.lat !== this.coordinates.bottom_left.lat) return false
        if (descriptor.bottom_left.lon !== this.coordinates.bottom_left.lon) return false

        // Yes they do
        return true

      },
      fqdn: this.coordinates.publisher_fqdn
    });
  }

  /** Our state key is the region */
  get stateKey() {
    return 'geopos:' + this.coordinates.top_right.lat + ',' + this.coordinates.top_right.lon + ' ' + this.coordinates.bottom_left.lat + ',' + this.coordinates.bottom_left.lon
  }

  /** Check if a region request matches our region */
  matches(id, descriptor) {
    // Check all filters match
    if (id !== 'geopos') return false
    if (!descriptor || !descriptor.top_right || !descriptor.bottom_left) return false
    if (descriptor.top_right.lat !== this.coordinates.top_right.lat) return false
    if (descriptor.top_right.lon !== this.coordinates.top_right.lon) return false
    if (descriptor.bottom_left.lat !== this.coordinates.bottom_left.lat) return false
    if (descriptor.bottom_left.lon !== this.coordinates.bottom_left.lon) return false

    // Yes they do
    return true

  }
  /** This region type should not be cached */
  save() { }
}