//
//  BlockV AG. Copyright (c) 2018, all rights reserved.
//
//  Licensed under the BlockV SDK License (the "License"); you may not use this file or
//  the BlockV SDK except in compliance with the License accompanying it. Unless
//  required by applicable law or agreed to in writing, the BlockV SDK distributed under
//  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
//  ANY KIND, either express or implied. See the License for the specific language
//  governing permissions and limitations under the License.
//

import User from '../../../../model/User';

export default class UserApi{

  constructor(client, store){
    this.client = client;
    this.store = store;
  }

  /**
   * Registers a user on the Blockv platform.
   *
   * @param registration contains properties of the user. Only the properties to be registered should be set.
   * @return new Observable<User> instance
   */

    getAccessToken(){

     return this.store.token;
   }

    setAccessToken(token){
    this.store.token = '';
    this.store.token = token

   }

    getRefreshToken(){
     return this.store.refreshToken
   }

    setRefreshToken(token){
     this.store.token = '';
     this.store.refreshToken = token;
   }

    register(registration){

  return  this.client.request('POST', '/v1/users', registration, false).then(
         data => {
           this.store.token = data.access_token.token;
           this.store.refreshToken = data.refresh_token.token;

           return data;
         }).then(data => new User(data));

   }


   /**
    * Logs a user into the Blockv platform. Accepts a user token (phone or email).
    *
    * @param token the user's phone(E.164) or email
    * @param tokenType the type of the token (phone or email)
    * @param password the user's password.
    * @return JSON Object
    */

     login(token, tokenType, password){

      let payload = {
          token      : token,
          token_type : tokenType,
          auth_data  :
          {
            password :  password
          }
        }

      return  this.client.request('POST', '/v1/user/login', payload, false).then(
          data => {


            if(!password){
              let error =  new Error('Login Failed, Password Reset');
              error.code = "PASSWORD_RESET";
              throw error;
            }else{
              this.store.token = data.access_token.token;
              this.store.refreshToken = data.refresh_token.token;
              this.store.assetProvider = data.asset_provider;
              this.store.userID = data.user.id;
              return data;

            }


          }).then(data => new User(data));
    }

    /**
    * Logs a user into the Blockv platform. Accepts a guest id
    *
    * @param guestId the user's guest id.
    * @return JSON Object
    */
     loginGuest(guestId){
      let payload =
      {
        "token" : guestId,
        "token_type" : "guest_id"
      }
      return this.client.request('POST', '/v1/user/login', payload, false).then(
          data => {



              console.log(data);
              this.store.token = data.access_token.token;
              this.store.refreshToken = data.refresh_token.token;
              this.store.assetProvider = data.asset_provider;
              return data;




          }).then(data => new User(data));

    }

    /**
    * Logs a user into the Blockv platform. Accepts an OAuth token.
    *
    * @param provider the OAuth provider, e.g. Facebook.
    * @param oauthToken the OAuth token issued by the OAuth provider.
    * @return JSON Object
    */
     loginOAuth(provider, oauthToken){
      //waiting for a server fix before this one gets any more work!

    }



     uploadAvatar(request){

        //get file
        //change to formData
        //submit formData with new header
        let avatarHeader = {
          'Content-Type' : 'multipart/form-data'
        }
      this.client.request('POST', '/v1/user/avatar', request, true, avatarHeader);



    }

    /**
    * Fetches the current user's profile information from the Blockv platform.
    *
    * @return JSON Object
    */

     getCurrentUser(payload){

      //get the current authenticated in user

       return this.client.request('GET', '/v1/user', payload, true).then(
          data => {
            console.log(data);
            return data;
          });

   }

   /**
   * Updates the current user's profile on the Blockv platform.
   *
   * @param update holds the properties of the user, e.g. their first name. Only the properties to be updated should be set.
   * @return JSON Object
   */
    updateUser(update){

     return this.client.request("PATCH", '/v1/user', update, true);

   }

   /**
    * Gets a list of the current users tokens
    * @return JSON Object
    */

   getUserTokens(){



    return this.client.request('GET', '/v1/user/tokens', '', true);



  }

  /**
   * Verifies ownership of a token by submitting the verification code to the Blockv platform.
   *
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @param code the verification code send to the user's token (phone or email).
   * @return JSON Object
   */
    verifyUserToken(verification){

    return this.client.request('POST','/v1/user/verify_token', verification, true)
   }



  /**
   * Sends a One-Time-Pin (OTP) to the user's token (phone or email).
   *
   * This OTP may be used in place of a password to login.
   *
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @return JSON Object
   */
    resetPassword(token,tokenType){

      let payload = {
        "token": token,
        "token_type": tokenType
      }

     return this.client.request('POST', '/v1/user/reset_token', payload, false);

   }

   /**
   * Sends a verification code to the user's token (phone or email).
   *
   * This verification code should be used to verifiy the user's ownership of the token (phone or email).
   *
   * @param token the user's phone(E.164) or email
   * @param tokenType the type of the token (phone or email)
   * @return JSON Object
   */
   sendTokenVerification(token, tokenType){

    let payload = {
      "token": token,
      "token_type": tokenType
    }
    return this.client.request('POST', '/v1/user/reset_token_verification', payload, false);
  }

  /**
   * Returns a server generated guest id
   * @return Object payload containing a guest user generated by the server
   */

   getGuestToken(){
     return this.client.request('POST', '/v1/user/guest', '', false).then(function(data){

      return data.properties.guest_id

     });
  }

  /**
   * Log out the current user.
   *
   * The current user will not longer be authorized to perform user scoped requests on the Blockv platfrom.
   *
   * @return new JSON
   */
    logout(params){
     this.client.request('POST', '/v1/user/logout', params, true).then(function(){
      console.log('User has been logged out!');
      this.store.token = '';
      this.store.refreshToken = '';
    });
   }


    extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}


    encodeAssetProvider(url){
     let aP = Store.assetProvider;
     let aPlen = aP.length;
     let compare = this.extractHostname(url);

     for(let i=0; i< aPlen; i++){
       let comparethis = this.extractHostname(aP[i].uri);
       if( compare === comparethis){
         let total = 0;
         //same uri so get the policy signature and key and append
         for(let a in aP[i].descriptor){
           if(total === 0){
             url += '?'+a+"="+aP[i].descriptor[a];
           }else{
             url += '&'+a+"="+aP[i].descriptor[a];
           }
           total++;
         }

       }

     }
     return url;
   }

    addUserToken(payload){
     /**
      * payload is
      * {
      * "token": "another.email@domain.com",
      * "token_type": "email",
      * "is_primary": false
      * }
      */
     return this.client.request('POST', '/v1/user/tokens', payload, true);
   }



    deleteUserToken(tokenId){

     return this.cliet.request('DELETE', '/v1/user/tokens/'+tokenId, null, true);

   }

    addRedeemable(payload){
     let U = this.store.userID;
     return this.client.request('POST', '/v1/users/'+U+'/redeemables', payload, true);
   }


}
