export default class User{

  constructor(userData){
      this.id = userData.user.id;
      this.firstName = userData.user.properties.first_name;
      this.lastName = userData.user.properties.last_name;
      this.avatarUri = userData.user.properties.avatar_uri;
      this.birthday = userData.user.properties.birthday;
      this.language = userData.user.properties.language;
      


  }



}
