import Region from '../CompositeRegion'
import PlatformGeoRegion from './PlatformRegion'
import { getCenter } from 'geolib';
import Geohash from 'latlon-geohash';

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

    // Fail if coordinates are invalid
    if (!descriptor || !descriptor.top_right || !descriptor.top_right.lat || !descriptor.top_right.lon || !descriptor.bottom_left || !descriptor.bottom_left.lat || !descriptor.bottom_left.lon) {
      throw new Error('Please specify the top_right and bottom_left coordinates in the region descriptor.')
    }

    this.coordinates = { top_right: descriptor.top_right, bottom_left: descriptor.bottom_left };

    // check for other geo regions
    const other = dataPool.regions.find(r => {
      return r.stateKey.indexOf('geopos:') === 0;
    });
    this.onLoadComplete = this.onLoadComplete.bind(this);
    this.on("synchronize.complete",this.onLoadComplete);

    if (other) {
      dataPool.removeRegion(other)
      this.oldRegion = other;
      this.cachedRegions = other.platformRegions;
    }

  }

  onLoadComplete() {
    this.off("synchronize.complete",this.onLoadComplete);
    if (this.oldRegion) {
      //can't recevie updates for multiple geo regions, close the old one
      console.log("close old");
      this.oldRegion.close();
      this.oldRegion = null;
    }
  }

  calculateGeoHash(coordinates) {
    let center = getCenter([coordinates.top_right, coordinates.bottom_left]);

    const percision = [1, 2, 3, 4, 5, 6, 7, 8];

    for (let i = percision.length - 1; i >= 0; i--) {
      const hash = Geohash.encode(center.latitude, center.longitude, percision[i]);
      const neighbours = Geohash.neighbours(hash);
      const hashes = [
        neighbours.n,
        neighbours.ne,
        neighbours.e,
        neighbours.se,
        neighbours.s,
        neighbours.sw,
        neighbours.w,
        neighbours.nw,
      ].filter((geohash) => {
        const neighbour = Geohash.bounds(geohash);
        if (neighbour.sw.lon >= coordinates.bottom_left.lon
          && neighbour.ne.lon <= coordinates.top_right.lon
          && neighbour.sw.lat >= coordinates.bottom_left.lat
          && neighbour.ne.lat <= coordinates.top_right.lat) {
          return true;
        }
        if (((neighbour.sw.lon >= coordinates.bottom_left.lon
          && neighbour.sw.lon <= coordinates.top_right.lon) || (
            neighbour.ne.lon <= coordinates.top_right.lon &&
            neighbour.ne.lon >= coordinates.bottom_left.lon
          ))
          &&
          ((neighbour.sw.lat >= coordinates.bottom_left.lat && neighbour.sw.lat <= coordinates.top_right.lat) ||
            (neighbour.ne.lat <= coordinates.top_right.lat && neighbour.ne.lat >= coordinates.bottom_left.lat))
        ) {
          return true;
        }

        return false;
      })

      if (hashes.length + 1 <= 6) {

        return [hash, ...hashes];
      }

    }

    return [];
  }

  async createRegion(datapool, platformId) {
    const hashes = this.calculateGeoHash(this.descriptor);
    const region = this.cachedRegions && this.cachedRegions.find(region => region.platformId === platformId);
    let cached;
    if (region && region._objects) {
      const values = region._objects.values();
      cached = Array.from(values).filter(object => {
        if (object.type !== "vatom") return true;
        const coords = object.data && object.data['vAtom::vAtomType'].geo_pos.coordinates;
        return coords && coords[0] >= this.coordinates.bottom_left.lon
          && coords[0] <= this.coordinates.top_right.lon
          && coords[1] >= this.coordinates.bottom_left.lat
          && coords[1] <= this.coordinates.top_right.lat

      });
    }

    return new PlatformGeoRegion(datapool, platformId, {
      hashes,
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
      fqdn: this.descriptor.publisher_fqdn,
      cached
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