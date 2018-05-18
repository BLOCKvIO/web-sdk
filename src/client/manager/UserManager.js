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


class UserManager {

    constructor(UserApi, store){
      this.UserApi = UserApi;
      this.store = store;
    }

    register(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic){
      return this.UserApi.register(new RegisterRequest(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic));
    }

    register(registration){
      return this.UserApi.register(registration);
    }

    login(token, tokenType, password){
    return  this.UserApi.login(token, tokenType, password);
    }

    loginGuest(guestId){
      return this.UserApi.loginGuest(guestId);
    }

    logout(){
      return this.UserApi.logout();
    }

    getCurrentUser(){
      return this.UserApi.getCurrentUser();
    }

    getCurrentUserTokens(){
      return this.UserApi.getUserTokens();
    }

    uploadAvatar(formData){
      this.UserApi.uploadAvatar(formData);
    }

    updateUser(payload){
      return this.UserApi.updateUser(payload);
    }

    getAccessToken(){
      return this.UserApi.getAccessToken();
    }


    encodeAssetProvider(url){
      return this.UserApi.encodeAssetProvider(url);
    }

    sendTokenVerification(token, token_type){
      return this.UserApi.sendTokenVerification(token, token_type);
    }

    getRefreshToken(){
      return this.UserApi.getRefreshToken();
    }

    setRefreshToken(token){
      return this.UserApi.setRefreshToken(token);
    }

    verifyUserToken(verify){
      return this.UserApi.verifyUserToken(verify);
    }

    addUserToken(payload){
      return this.UserApi.addUserToken(payload);
    }

    deleteUserToken(tokenId){
      return this.UserApi.deleteUserToken(tokenId);
    }

    getGuestToken(){
      return this.UserApi.getGuestToken();
    }

    resetPassword(token, token_type){
      return this.UserApi.resetPassword(token, token_type);
    }

    addRedeemable(payload){
      return this.UserApi.addRedeemable(payload);
    }



}

export default UserManager;
