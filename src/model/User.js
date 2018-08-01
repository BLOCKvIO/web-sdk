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
export default class User {
  constructor(user) {
    this.id = user.id;
    this.firstName = user.properties.first_name;
    this.lastName = user.properties.last_name;
    this.namePublic = user.properties.name_public;
    this.avatarUri = user.properties.avatar_uri;
    this.avatarPublic = user.properties.avatar_public;
    this.birthday = user.properties.birthday;
    this.language = user.properties.language;
    this.nonPushNotification = user.properties.nonpush_notification;
    this.guestId = user.properties.guest_id;
    this.isPasswordSet = user.properties.is_password_set;
    this.activated = user.system_properties.activated;
    this.isAdmin = user.system_properties.is_admin;
    this.isMerchant = user.system_properties.is_merchant;
    this.lastLogin = user.system_properties.last_login;
    this.pubFqdn = user.system_properties.pub_fqdn;
    this.meta = {
      createdBy: user.meta.created_by,
      dataType: user.meta.data_type,
      modifiedBy: user.meta.modified_by,
      whenCreated: user.meta.when_created,
      whenModified: user.meta.when_modified,
    };
  }
}
