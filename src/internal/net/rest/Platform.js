export default class Platform {

  constructor(client, store, connectAll) {
    this.client = client;
    this.store = store;
    this.connectAll = connectAll;
  }

  get primary() {
    return { 'api_gateway': this.store.server, 'websocket': this.store.websocketAddress };
  }

  get(id) {
    if (id === 'primary')
      return Promise.resolve(this.primary);

    return this.getAll().then(platforms => platforms[id]);
  }

  getIds() {
    return this.getAll()
      .then(platforms =>  Object.keys(platforms))
  }

  getAll() {

    if (this.getPlatformsPromise)
      return this.getPlatformsPromise;

    if (this.store.platforms && Object.keys(this.store.platforms).length > 0) {
      return Promise.resolve(this.store.platforms);
    }

    if (!this.connectAll) {
      return Promise.resolve({ 'primary': this.primary });
    }

    // Start fetching
    this.getPlatformsPromise = this.client.request('GET', '/v1/vatom-network/config', undefined, false).then(data => {
      // Store it
      const platforms = data.platforms;
      this.store.platforms = platforms;
      this.getPlatformsPromise = null;
      return platforms;

    }).catch(err => {
      this.getPlatformsPromise = null;
      if (err.code === 404) {
        //Not using a vatom network api gateway
        const platforms = {};
        platforms['primary'] = this.primary;
        this.store.platforms = platforms;
        return platforms;
      }
      throw err
    })

    // Return promise
    return this.getPlatformsPromise;

  }
}

