import Geohash from 'latlon-geohash';
import { getDistance, getCenter } from 'geolib';
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
    this.geoHash = this.calculateGeoHash(coordinates);
  }

  calculateGeoHash(coordinates) {
    let center = getCenter([coordinates.top_right, coordinates.bottom_left]);
    let height = getDistance({ lat: coordinates.top_right.lat, lon: coordinates.bottom_left.lon }, coordinates.bottom_left);
    let width = getDistance({ lat: coordinates.bottom_left.lat, lon: coordinates.top_right.lon }, coordinates.bottom_left);
    let dist = width > height ? width : height;
    const percisionHeight = [5000000, 625000, 156000, 19500, 4890, 610, 153, 19.1];
    const percision = [1, 2, 3, 4, 5, 6, 7, 8];
    let selectedPercision = 1;
    for (let i = percisionHeight.length - 1; i >= 0; i--) {
      if (dist < percisionHeight[i]) {
        selectedPercision = percision[i];
        break;
      }
    }
    return Geohash.encode(center.latitude, center.longitude, selectedPercision);
  }

  createRegion(datapool, platformId) {
    console.log(this.geoHash);
    return new PlatformGeoRegion(datapool, platformId, {
      geoHash: this.geoHash,
      matches: (id, descriptor) => {
        // Check all filters match
        if (id !== 'geopos-' + this.platformId) return false
        if (!descriptor || !descriptor.top_right || !descriptor.bottom_left) return false

        return this.calculateGeoHash(descriptor) === this.geoHash;
      },
      fqdn: this.coordinates.publisher_fqdn
    });
  }

  /** Our state key is the region */
  get stateKey() {
    return 'geopos:' + this.geoHash
  }

  /** Check if a region request matches our region */
  matches(id, descriptor) {
    // Check all filters match
    if (id !== 'geopos') return false
    if (!descriptor || !descriptor.top_right || !descriptor.bottom_left) return false

    return this.calculateGeoHash(descriptor) === this.geoHash;
  }
  /** This region type should not be cached */
  save() { }
}
