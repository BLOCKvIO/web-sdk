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
export default class RegisterRequest{

  constructor(firstName,lastName, birthday, language, password, tokens, namePublic, avatarPublic)
    {
        this.first_name = firstName;
        this.last_name = lastName;
        this.birthday = birthday;
        this.language = language;
        this.password = password;
        this.user_tokens = tokens;
        this.name_public = namePublic;
        this.avatar_public = avatarPublic;
    }


    get firstName(){
      return this.first_name;
    }

    set firstName(value){
      this.first_name = value;
    }

    get lastName(){
      return this.last_name;
    }

    set lastName(value){
      this.last_name = value
    }

    get avatarPublic(){
      return this.avatar_public;
    }

    set avatarPublic(value){
      this.avatar_public = value;
    }

    get namePublic(){
      return this.name_public;
    }

    set namePublic(value){
      this.name_public = value;
    }


    addToken(tokenType, token){

      if(!this.user_tokens){
        this.user_tokens = []

      }

      this.user_tokens.add(
        {
          "token" : token,
          "token_type" : tokenType
        }
      )

    }




}
