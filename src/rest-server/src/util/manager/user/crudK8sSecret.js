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

const UserSchema = require('./schema');
const CrudK8sSecret = require('./crudBase');
const axios = require('axios');

class UserK8sSecret extends CrudK8sSecret {
  constructor(options) {
    super();
    this.secretRootUri = `${options.paiUserNameSpace}/secrets`;
    this.request = axios.create(options.requestConfig);
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
      let allUserInstance = [];
      let userData = response['data'];
      if (userData.hasOwnProperty('items')) {
        for (const item of userData['items']){
          let userInstance = await new UserSchema({
            username: Buffer.from(item['data']['username'], 'base64').toString(),
            password: Buffer.from(item['data']['password'], 'base64').toString(),
            groupList: JSON.parse(Buffer.from(item['data']['groupList'], 'base64').toString()),
            email: Buffer.from(item['data']['email'], 'base64').toString(),
            extension: JSON.parse(Buffer.from(item['data']['extension'], 'base64').toString()),
          }, true);
          allUserInstance.push(userInstance);
        }
      } else {
        let userInstance = await new UserSchema({
          username: Buffer.from(userData['data']['username'], 'base64').toString(),
          password: Buffer.from(userData['data']['password'], 'base64').toString(),
          groupList: JSON.parse(Buffer.from(userData['data']['groupList'], 'base64').toString()),
          email: Buffer.from(userData['data']['email'], 'base64').toString(),
          extension: JSON.parse(Buffer.from(userData['data']['extension'], 'base64').toString()),
        }, true);
        allUserInstance.push(userInstance);
      }
      return allUserInstance;
    } catch (error) {
      throw error.response;
    }
  }

  async create(key, value, option) {
    try{
      const hexKey = Buffer.from(key).toString('hex');
      let userInstance = await new UserSchema(
        {
          'username': value['username'],
          'password': value['password'],
          'groupList': value['groupList'],
          'email': value['email'],
          'extension': value['extension'],
        }
      );
      let userData = {
        'metadata': {'name': hexKey},
        'data': {
          'username': Buffer.from(userInstance['username']).toString('base64'),
          'password': Buffer.from(userInstance['password']).toString('base64'),
          'groupList': Buffer.from(JSON.stringify(userInstance['groupList'])).toString('base64'),
          'email': Buffer.from(userInstance['email']).toString('base64'),
          'extension': Buffer.from(JSON.stringify(userInstance['extension'])).toString('base64'),
        },
      };
      let response = await this.request.post(`${this.secretRootUri}`, userData);
      return response['data'];
    } catch (error) {
      throw error.response;
    }
  }

  async update(key, value, option) {
    try{
      const hexKey = Buffer.from(key).toString('hex');
      let userInstance = await new UserSchema(
        {
          'username': value['username'],
          'password': value['password'],
          'groupList': value['groupList'],
          'email': value['email'],
          'extension': value['extension'],
        }
      );
      let userData = {
        'metadata': {'name': hexKey},
        'data': {
          'username': Buffer.from(userInstance['username']).toString('base64'),
          'password': Buffer.from(userInstance['password']).toString('base64'),
          'groupList': Buffer.from(JSON.stringify(userInstance['groupList'])).toString('base64'),
          'email': Buffer.from(userInstance['email']).toString('base64'),
          'extension': Buffer.from(JSON.stringify(userInstance['extension'])).toString('base64'),
        },
      };
      let response = await this.request.put(`${this.secretRootUri}/${hexKey}`, userData);
      return response['data']
    } catch (error) {
      throw error.response;
    }
  }

  async delete(key, option) {
    try{
      const hexKey = Buffer.from(key).toString('hex');
        let response = await this.request.delete(`${this.secretRootUri}/${hexKey}`, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
      });
      return response;
    } catch (error) {
      throw error.response
    }
  }

}


module.exports = UserK8sSecret
