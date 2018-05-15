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
import UserApi from '../../internal/net/rest/api/UserApi'

class UserManager {

    register(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic){
      return UserApi.register(new RegisterRequest(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic));
    }

    register(registration){
      return UserApi.register(registration);
    }

    login(token, tokenType, password){
    return  UserApi.login(token, tokenType, password);
    }

    loginGuest(guestId){
      return UserApi.loginGuest(guestId);
    }

    logout(){
      return UserApi.logout();
    }

    getCurrentUser(){
      return UserApi.getCurrentUser();
    }

    getCurrentUserTokens(){
      return UserApi.getUserTokens();
    }

    uploadAvatar(formData){
      UserApi.uploadAvatar(formData);
    }

    updateUser(payload){
      return UserApi.updateUser(payload);
    }

    getAccessToken(){
      return UserApi.getAccessToken();
    }


    encodeAssetProvider(url){
      return UserApi.encodeAssetProvider(url);
    }

    sendTokenVerification(token, token_type){
      return UserApi.sendTokenVerification(token, token_type);
    }

    getRefreshToken(){
      return UserApi.getRefreshToken();
    }

    setRefreshToken(token){
      return UserApi.setRefreshToken(token);
    }

    verifyUserToken(verify){
      return UserApi.verifyUserToken(verify);
    }

    addUserToken(payload){
      return UserApi.addUserToken(payload);
    }

    deleteUserToken(tokenId){
      return UserApi.deleteUserToken(tokenId);
    }

    getGuestToken(){
      return UserApi.getGuestToken();
    }

    resetPassword(token, token_type){
      return UserApi.resetPassword(token, token_type);
    }




}

export default new UserManager();
