import Store from '../repo/Store'
import Client from './Client'
import jwt_decode from 'jwt-decode'

class Auth{

  /**
   * Refresh's the users access token
   * @return JSON save the token with the bearer.
   */
  refreshToken() {

      let options = {
          'Authorization' : 'Bearer '+Store.refreshToken
        }



      return Client.request('POST', '/v1/access_token', '', false, options).then(function (data) {
        // note: the promise returned from `Client.request` will resolve
        // even when the http call returned an error status code.
        // when the user is not logged in, a 401 status code is returned
        // and the `data` we receive here is undefined
        // in this case, we will throw a custom error to handle this case
        // specifically if needed
        if (data === undefined) {
          throw "no access token returned from server";
        }
        
        Store.token = data.access_token.token;
      })

    }

  /**
   * checkToken checks to see if the expiration time in the token has expired
   * jwt_decode returns an object for the token,
   *
   *  {
   *    foo: "bar",
   *    exp: 1393286893,
   *    iat: 1393268893
   *   }
   *
   * @return Boolean checks to see if the token time has expired
   */

   checkToken(valid = false) {

     //define our vars
     let decodedToken, nowDate, expirationTime, token;
     token = Store.token;

     if(token == 'undefined' || token == ''){
       return this.refreshToken();
     }else{
       try{
         decodedToken = jwt_decode(Store.token);
         expirationTime = (decodedToken.exp * 1000);
         nowDate = Date.now();

         //quick calc to determine if the token has expired
         //if ((nowDate - 30000) > expirationTime)
         return this.refreshToken();
         //else
         //   return Promise.resolve(true)
       }catch(e){
         return this.refreshToken();
       }


     }


   }





}
export default new Auth();
