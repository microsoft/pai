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
    this.secretRootUrl = options.secretRootUrl
    this.options = options;
  }

  async get(key, options) {
    try {
      const response = await axios.get(`${this.secretRootUrl}/${key}`, {
        headers: {
          'Accept': 'application/json'
        }
      })
      let allUserSecrets = [];
      let userData = response['data']
      if (userData.hasOwnProperty('items')) {
        userData['items'].forEach((item) => {
          allUserSecrets.push({
            userName: Buffer.from(item['data']['username'], 'base64').toString(),
            password: Buffer.from(item['data']['password'], 'base64').toString(),
            admin: Buffer.from(item['data']['admin'], 'base64').toString() === 'true' ? true : false,
            virtualCluster: item['data'].hasOwnProperty('virtualCluster') ? Buffer.from(item['data']['virtualCluster'], 'base64').toString() : 'default',
            githubPAT: item['data'].hasOwnProperty('githubPAT') ? Buffer.from(item['data']['githubPAT'], 'base64').toString() : '',
          });
        })
      } else {
        allUserSecrets.push({
          userName: Buffer.from(userData['data']['username'], 'base64').toString(),
          password: Buffer.from(userData['data']['password'], 'base64').toString(),
          admin: Buffer.from(userData['data']['admin'], 'base64').toString() === 'true' ? true : false,
          virtualCluster: userData['data'].hasOwnProperty('virtualCluster') ? Buffer.from(userData['data']['virtualCluster'], 'base64').toString() : 'default',
          githubPAT: userData['data'].hasOwnProperty('githubPAT') ? Buffer.from(userData['data']['githubPAT'], 'base64').toString() : '',
        });
      }
      return allUserSecrets
    } catch (error) {
      throw error.response;
    }
  }

  async set(key, value, options) {
    try {
      let userData = {
        'metadata': { 'name': key },
        'data': {
          'username': Buffer.from(key).toString('base64'),
          'password': Buffer.from(value['password']).toString('base64'),
          'admin': Buffer.from(value['admin'].toString()).toString('base64'),
        }
      }
      if (value.hasOwnProperty('virtualCluster')) {
        userData['data']['virtualCluster'] = Buffer.from(value['virtualCluster']).toString('base64')
      }
      if (value.hasOwnProperty('githubPAT')) {
        userData['data']['githubPAT'] = Buffer.from(value['githubPAT']).toString('base64')
      }

      let response = null
      if (options && options['update']) {
        response = await axios.put(`${this.secretRootUrl}/${key}`, userData)
      } else {
        response = await axios.post(`${this.secretRootUrl}`, userData)
      }
      return response
    } catch (error) {
      throw error.response;
    }
  }

  async delete(key, options) {
    try {
      let response = await axios.delete(`${this.secretRootUrl}/${key}`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      })
      return response
    } catch (error) {
      throw error.response;
    }
  }
}

module.exports = UserSecret;
