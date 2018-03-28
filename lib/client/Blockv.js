import Store from '../internal/repo/Store';
/**
 * Created by LordCheddar on 2018/03/05.
 */

class Blockv {

  static init(init) {
    //const APPID = appID;
    //const SERVER = 'https://apidev.blockv.net/';
    Store.appID = init.appID;
    Store.server = init.server;
    Store.websocketAddress = init.websocketAddress;
  }

}

export default Blockv;