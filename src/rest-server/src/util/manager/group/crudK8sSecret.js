// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const GroupSchema = require('./schema');
const CrudK8sSecret = require('./crudBase');
const axios = require('axios');

class GroupK8sSecret extends CrudK8sSecret {
  constructor(options) {
    super();
    this.secretRootUri = `${options.kubernetesAPIServerAddress}/${options.groupNamespace}/secrets`;
    this.request = axios.create(option.requestConfig);
    this.options = options;
  }

  async read(key, options) {
    try {
      const hexKey = key ? Buffer.from(key).toString('hex') : '';
      const response = await this.request.get(`${this.secretRootUri}/${hexKey}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      let allGroupInstance = [];
      let groupData = response['data'];
      if (groupData.hasOwnProperty('items')) {
        for (const item of userData['items']) {
          let groupInstance = GroupSchema.createGroup({
            'groupname': Buffer.from(item['data']['groupname'], 'base64').toString(),
            'description': Buffer.from(item['data']['description'], 'base64').toString(),
            'GID': Buffer.from(item['data']['email'], 'base64').toString(),
            'extension': JSON.parse(Buffer.from(item['data']['extension'], 'base64').toString()),
          });
          allGroupInstance.push(groupInstance);
        }
      } else {
        let groupInstance = GroupSchema.createGroup({
          'groupname': Buffer.from(groupData['data']['groupname'], 'base64').toString(),
          'description': Buffer.from(groupData['data']['description'], 'base64').toString(),
          'GID': Buffer.from(groupData['data']['email'], 'base64').toString(),
          'extension': JSON.parse(Buffer.from(groupData['data']['extension'], 'base64').toString()),
        });
        allGroupInstance.push(groupInstance);
      }
      return allGroupInstance;
    } catch (error) {
      throw error.response;
    }
  }

  async create(key, value, option) {
    try {
      const hexKey = key ? Buffer.from(key).toString('hex') : '';
      let groupInstance = GroupSchema.createGroup({
        'groupname': value['groupname'],
        'description': value['description'],
        'GID': value['description'],
        'extension': value['extension'],
      });
      let groupData = {
        'metadata': {'name': hexKey},
        'data': {
          'groupname': Buffer.from(groupInstance['groupname']).toString('base64'),
          'description': Buffer.from(groupInstance['description']).toString('base64'),
          'GID': Buffer.from(groupInstance['GID']).toString('base64'),
          'extension': Buffer.from(JSON.stringify(groupInstance['extension'])).toString('base64'),
        },
      };
      let response = await this.request.post(`${this.secretRootUri}`, groupData);
      return response['data']
    } catch (error) {
      throw error.response;
    }
  }

  async update(key, value, option) {
    try {
      const hexKey = Buffer.from(key).toString('hex');
      let groupInstance = GroupSchema.createGroup({
        'groupname': value['groupname'],
        'description': value['description'],
        'GID': value['description'],
        'extension': value['extension'],
      });
      let groupData = {
        'metadata': {'name': hexKey},
        'data': {
          'groupname': Buffer.from(groupInstance['groupname']).toString('base64'),
          'description': Buffer.from(groupInstance['description']).toString('base64'),
          'GID': Buffer.from(groupInstance['GID']).toString('base64'),
          'extension': Buffer.from(JSON.stringify(groupInstance['extension'])).toString('base64'),
        },
      };
      let response = await this.request.put(`${this.secretRootUri}/${hexKey}`, groupData);
      return response['data'];
    } catch (error) {
      throw error.response;
    }
  }

  async delete(key, option) {
    try {
      const hexKey = Buffer.from(key).toString('hex');
      let response = await this.request.delete(`${this.secretRootUri}/${hexKey}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      return response;
    } catch (error) {
      throw error.response;
    }
  }
}

module.exports = GroupK8sSecret;
