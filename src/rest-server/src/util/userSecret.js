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

// module dependencies
const axios = require('axios');
const StorageBase = require('./storageBase');

class UserSecret extends StorageBase {
  constructor(options) {
    super();
    this.secretRootUri = `${options.paiUserNameSpace}/secrets`;
    this.request = axios.create(options.requestConfig);
    this.options = options;
  }

  async get(key, options) {
    try {
      const hexKey = key ? Buffer.from(key).toString('hex') : '';
      const response = await this.request.get(`${this.secretRootUri}/${hexKey}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      let allUserSecrets = [];
      let userData = response['data'];
      if (userData.hasOwnProperty('items')) {
        userData['items'].forEach((item) => {
          allUserSecrets.push({
            username: Buffer.from(item['data']['username'], 'base64').toString(),
            password: Buffer.from(item['data']['password'], 'base64').toString(),
            admin: Buffer.from(item['data']['admin'], 'base64').toString(),
            virtualCluster: item['data'].hasOwnProperty('virtualCluster') ? Buffer.from(item['data']['virtualCluster'], 'base64').toString() : 'default',
            githubPAT: item['data'].hasOwnProperty('githubPAT') ? Buffer.from(item['data']['githubPAT'], 'base64').toString() : '',
          });
        });
      } else {
        allUserSecrets.push({
          username: Buffer.from(userData['data']['username'], 'base64').toString(),
          password: Buffer.from(userData['data']['password'], 'base64').toString(),
          admin: Buffer.from(userData['data']['admin'], 'base64').toString(),
          virtualCluster: userData['data'].hasOwnProperty('virtualCluster') ? Buffer.from(userData['data']['virtualCluster'], 'base64').toString() : 'default',
          githubPAT: userData['data'].hasOwnProperty('githubPAT') ? Buffer.from(userData['data']['githubPAT'], 'base64').toString() : '',
        });
      }
      return allUserSecrets;
    } catch (error) {
      throw error.response;
    }
  }

  async set(key, value, options) {
    try {
      const hexKey = key ? Buffer.from(key).toString('hex') : '';
      let userData = {
        'metadata': {'name': hexKey},
        'data': {
          'username': Buffer.from(value['username']).toString('base64'),
          'password': Buffer.from(value['password']).toString('base64'),
          'admin': Buffer.from(value['admin'].toString()).toString('base64'),
        },
      };
      if (value.hasOwnProperty('virtualCluster')) {
        userData['data']['virtualCluster'] = Buffer.from(value['virtualCluster']).toString('base64');
      }
      if (value.hasOwnProperty('githubPAT')) {
        userData['data']['githubPAT'] = Buffer.from(value['githubPAT']).toString('base64');
      }
      let response = null;
      if (options && options['update']) {
        response = await this.request.put(`${this.secretRootUri}/${hexKey}`, userData);
      } else {
        response = await this.request.post(`${this.secretRootUri}`, userData);
      }
      return response;
    } catch (error) {
      throw error.response;
    }
  }

  async delete(key, options) {
    try {
      const hexKey = key ? Buffer.from(key).toString('hex') : '';
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

  async prepareBasePath() {
    try {
      const response = await this.request.post('', {
        'metadata': {'name': `${this.options.paiUserNameSpace}`},
      });
      return response;
    } catch (error) {
      throw error.response;
    }
  }

  async checkBasePath() {
    try {
      const response = await this.request.get(`${this.options.paiUserNameSpace}`, {
        headers: {
          'Accept': 'application/json',
        },
      });
      return response;
    } catch (error) {
      throw error.response;
    }
  }
}
module.exports = UserSecret;
