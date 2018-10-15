//
//  BlockV AG. Copyright (c) 2018, all rights reserved.
//
//  Licensed under the BlockV SDK License (the "License"); you may not use this file or
//  the BlockV SDK except in compliance with the License accompanying it. Unless
//  required by applicable law or agreed to in writing, the BlockV SDK distributed under
//  the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF
//  ANY KIND, either express or implied. See the License for the specific language
//  governing permissions and limitations under the License.


module.exports = class ActivityApi {
  constructor(client) {
    this.client = client;
  }

  threads() {
    return this.client.request('POST', '/v1/activity/mythreads', {}, true).then(data => data.threads);
  }

  threadMessages(name) {
    const payload = {
      name,
      cursor: '',
      count: 100,
    };
    return this.client.request('POST', '/v1/activity/mythreadmessages', payload, true).then(data => data);
  }

  sendMessage(id, message) {
    const payload = {
      message,
      id,
    };
    return this.client.request('POST', '/v1/user/message', payload, true).then(data => data);
  }
}
