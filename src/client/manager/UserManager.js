/**
 * Created by LordCheddar on 2018/03/05.
 */
import UserApi from '../../internal/net/rest/api/UserApi'

class UserManager {

    register(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic){
      UserApi.register(new RegisterRequest(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic));
    }

    register(registration){
      UserApi.register(registration);
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

    setAccessToken(token){
      return UserApi.setAccessToken(token);
    }

    encodeAssetProvider(url){
      return UserApi.encodeAssetProvider(url);
    }







}

export default new UserManager();
