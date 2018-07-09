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


export default class Activity {
  constructor(activityApi) {
    this.activityApi = activityApi;
  }

  /**
   * Returns a list of messages of activity
   * @return {Promise<Object>} JSON array containing all the activity from the user.
   */
  myThreads() {
    return this.activityApi.threads();
  }

  /**
   * Returns a single activity message thread
   * @param  {String} name Unique identifier from the myThreads response
   * @return {Promise<Object>}  returns a detailed object containing the thread
   */
  myThreadMessages(name) {
    return this.activityApi.threadMessages(name);
  }

  /**
  * Send a message to a user that appears in the "activity" tab
  * @param  {String} id      id of the user that is going to receive the message
  * @param  {String} message    Message that will get sent to the user
  * @return {Promise<Object>}   Success Object
  */
  sendMessage(id, message) {
    return this.activityApi.sendMessage(id, message);
  }
}
