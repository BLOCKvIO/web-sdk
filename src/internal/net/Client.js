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
import {request, plugins as popsicle_plugins} from 'popsicle'
import jwt_decode from 'jwt-decode'
import BaseResponse from './rest/response/BaseResponse'

 class Client{

   constructor(store){
     this.store = store
   }



   request(method, endpoint, payload, auth, headers){
     if(auth === true){
        return this.checkToken().then(e => this._request(method, endpoint, payload, headers));
     }else{
       return this._request(method, endpoint, payload, headers);
     }

   }


   _request(method, endpoint, payload, headers) {


     headers = Object.assign({
       'App-Id': this.store.appID,
       'Authorization' : 'Bearer ' + this.store.token,
       'Content-Type' : 'application/json'
     }, headers)



    return request({
       method: method,
       url: this.store.server + endpoint,
       body: payload,
       headers: headers

     }).use(popsicle_plugins.parse('json'))
     .then(function (res) {
        return Object.assign(new BaseResponse(), res.body);
     }).then(response=>{

     console.log(response);


     // Check for server error
     if (!response.payload) {

       const ErrorCodes = {
         11 : "Problem with payload",
         401: 'Token has Expired',
         516: 'Invalid Payload',
         521: 'Token Unavailable',
         527: 'Invalid Date Format',
         2030: 'No user found, Please register an account first.',
         2031: 'Authentication Failed',
         2032 : 'Login Failed, Please try again',
         2034: 'Invalid Token',
         2051 : 'Too many login attempts, Please try again later.',
         2552: 'Unable To Retrieve Token',
         2563: 'Token Already Confirmed',
         2564: 'Invalid Verification Code',
         2569: 'Invalid Phone Number'
       }

       if(response.error === 2051){
         // Check for the special login locked error
         // We need to pull the timestamp that is in the reponse.message to show when they
         // can login agin


          // HACK: Pull time from original server error string
          var dateString = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g.exec(response.message)
          response.lockedUntil = new Date(dateString)

          // Replace duration in the error message
          var duration = response.lockedUntil.getTime() - Date.now()
          if (duration < 2000) duration = 2000
          var seconds = Math.floor(duration / 1000)
          var minutes = Math.floor(duration / 1000 / 60)
          if (seconds <= 90)
              response.error = response.message.replace("%DURATION%", seconds == 1 ? "1 second" : seconds + " seconds")
          else
              response.message = response.message.replace("%DURATION%", minutes == 1 ? "1 minute" : minutes + " minutes")

          // Rethrow error
          var error = new Error("Too many login attempts, Try again at : " + response.lockedUntil)
          error.code = response.error || 0
          throw error


       }else{

         var error = new Error(ErrorCodes[response.error] || "An unknown server error occurred.")
         error.code = response.error || 0
         throw error
       }



     }

     // No error, continue
     return response.payload



   });

 }

 /**
  * Refresh's the users access token
  * @return JSON save the token with the bearer.
  */
 refreshToken() {

     let options = {
         'Authorization' : 'Bearer '+this.store.refreshToken
       }



     return this.request('POST', '/v1/access_token', '', false,  options).then(data => {

       this.store.token = data.access_token.token;
     })

   }

   checkToken(valid = false) {

     //define our vars
     let decodedToken, nowDate, expirationTime, token;
     token = this.store.token;

     if(token == 'undefined' || token == ''){
       this.refreshToken();
     }else{
       try{
         decodedToken = jwt_decode(this.store.token);
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
export default Client
