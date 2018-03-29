import Client from '../../internal/net/Client'

class Vatoms{

  /**
   * [performAction description]
   * @param  {String} vatomId id of the vatom to perform action
   * @param  {String} action  can be either of the following : Drop, Pickup , Transfer , Require
   * @param  {Object} payload contains geo-coordianates or anything else sent along with vatomid
   * @return {JSON}   json payload nested
   */

  performAction(vatomId, action, payload){

    //check that payload is set
    payload = payload || {}
    //assigns this.id
    payload["this.id"] = vatomId;

    return Client.request('POST', '/v1/user/vatom/action/'+action, payload, true).then(data => {data.main.output});

  }

  getVatomInventory() {
    payload = {
      "parent_id": ".",
      "page": 1,
      "limit": 1000
    }
    
    return Client.request('POST', '/v1/user/vatom/inventory', payload, true);
  }

}

export default new Vatoms();
