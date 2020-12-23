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
  constructor(dataPool, descriptor) {

    super(dataPool)

    this.descriptor = descriptor;

    // Don't cache this content
    this.noCache = true

    // Store geo hash
    this.geoHash = descriptor.geohash;

    // Fail if coordinates are invalid
    if (!this.geoHash) {
      throw new Error('Please specify the geohash in the region descriptor.')
    }

    // check for other geo regions
    const other = dataPool.regions.find(r => {
      return r.stateKey.indexOf('geopos:') === 0;
    });

    if (other) {
      //geo hash match with different percisions
      if (this.matchGeoHash(other.geoHash)) {
        this.cachedRegions = other.platformRegions;
      }
      //can't recevie updates for multiple geo regions, close the old one
      other.close();
    }

  }

  /**
   * Returns true if geo hash match even with different precision
   */
  matchGeoHash(other) {
    if (!other) return false;

    let short = this.geoHash;
    let longer = other;
    if (this.geoHash.length > other.length) {
      short = other;
      longer = this.geoHash;
    }

    return longer.indexOf(short) === 0;
  }

  calculateGeoHash(coordinates) {
    let center = getCenter([coordinates.top_right, coordinates.bottom_left]);
    let height = getDistance({ lat: coordinates.top_right.lat, lon: coordinates.bottom_left.lon }, coordinates.bottom_left);
    let width = getDistance({ lat: coordinates.bottom_left.lat, lon: coordinates.top_right.lon }, coordinates.bottom_left);
    let dist = width > height ? width : height;
    const percisionHeight = [5000000, 625000, 156000, 19500, 4890, 610, 153, 19.1];
    const percisionWidth = [5000000, 1250000, 156000, 39100, 4890, 1220, 153, 38.2];
    const percision = [1, 2, 3, 4, 5, 6, 7, 8];
    let geoHash = Geohash.encode(center.latitude, center.longitude, 1);
    for (let i = percisionHeight.length - 1; i >= 0; i--) {
      if (dist < percisionHeight[i]) {
        const hash = Geohash.encode(center.latitude, center.longitude, percision[i]);
        const bounds = Geohash.bounds(hash);
        //check that selected percision covers viewing bounds
        if (bounds.ne.lat > coordinates.top_right.lat
          && bounds.sw.lat < coordinates.bottom_left.lat
          && bounds.sw.lon < coordinates.bottom_left.lon
          && bounds.ne.lon > coordinates.top_right.lon) {
          geoHash = hash;
          break;
        }
      }
    }

    return geoHash;
  }

  createRegion(datapool, platformId) {
    const region = this.cachedRegions && this.cachedRegions.find(region => region.platformId === platformId);
    let cached;
    if (region && region._objects) {
      const bounds = Geohash.bounds(this.geoHash);
      const values = region._objects.values();
      cached = Array.from(values).filter(object => {
        if (object.type !== "vatom") return true;
        const coords = object.data && object.data['vAtom::vAtomType'].geo_pos.coordinates;
        return coords && coords[0] >= bounds.sw.lon
          && coords[0] <= bounds.ne.lon
          && coords[1] >= bounds.sw.lat
          && coords[1] <= bounds.ne.lat

      });
    }
    return new PlatformGeoRegion(datapool, platformId, {
      geoHash: this.geoHash,
      matches: (id, descriptor) => {
        // Check all filters match
        if (id !== 'geopos-' + this.platformId) return false
        if (!descriptor || !descriptor.geohash) return false

        return descriptor.geohash === this.geoHash;
      },
      fqdn: this.descriptor.publisher_fqdn,
      cached
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
    if (!descriptor || !descriptor.geohash) return false

    return descriptor.geohash === this.geoHash;
  }
  /** This region type should not be cached */
  save() { }
}