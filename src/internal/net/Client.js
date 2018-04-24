import Store from '../repo/Store'
import Auth from '../net/Auth'

import BaseResponse from './rest/response/BaseResponse'

 class Client{

   request(method, endpoint, payload, auth, headers){
     if(auth === true){
        return Auth.checkToken().then(e => this._request(method, endpoint, payload, headers));
     }else{
       return this._request(method, endpoint, payload, headers);
     }

   }


   _request(method, endpoint, payload, headers) {

     headers = Object.assign({
       'App-Id': Store.appID,
       'Authorization' : 'Bearer ' + Store.token,
       'Content-Type' : 'application/json'
     }, headers)

     // Convert object payload to JSON
     if (!(payload instanceof FormData) && typeof payload == "object")
       payload = JSON.stringify(payload)

       if(payload instanceof FormData)
        delete headers['Content-Type'];
       // Create promise
       return new Promise((onSuccess, onFail) => {

       // Create XHR
       var xhr = new XMLHttpRequest()
       xhr.responseType = 'text'
       xhr.open(method, Store.server + endpoint)
       for(let name in headers){
         xhr.setRequestHeader(name, headers[name])
       }


       xhr.send(payload)

       // Add handlers
       xhr.onerror = onFail
       xhr.onload = e => onSuccess(JSON.parse(xhr.response))

   }).then(function (parsedBody) {

     return Object.assign(new BaseResponse(), parsedBody);

   }).then(response=>{

     // Check for server error
     if (!response.payload) {

       const ErrorCodes = {
         401: 'Token has Expired',
         516: 'Invalid Payload',
         521: 'Token Unavailable',
         527: 'Invalid Date Format',
         2030: 'No user found, Please register an account first.',
         2031: 'Authentication Failed',
         2032 : 'Login Failed, Please try again',
         2034: 'Invalid Token',
         2552: 'Unable To Retrieve Token',
         2563: 'Token Already Confirmed',
         2564: 'Invalid Verification Code',
         2569: 'Invalid Phone Number'
       }

       var error = new Error(ErrorCodes[response.error] || "An unknown server error occurred.")
       error.code = response.error || 0
       throw error
     }

     // No error, continue
     return response.payload



   });

 }






}
export default new Client()
