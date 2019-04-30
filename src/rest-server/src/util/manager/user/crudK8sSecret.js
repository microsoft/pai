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

const User = require('./user');
const axios = require('axios');
const {readFileSync} = require('fs');
const {Agent} = require('https');

function initConfig(apiServerUri, namespace, option) {
  const config = {
    apiServerUri: apiServerUri,
    namespace: namespace,
    reqeustConfig: {
      baseURL: `${apiServerUri}/api/v1/namespaces/`,
      maxRedirects: 0,
    },
  };
  if ('k8sAPIServerCaFile' in option) {
    const ca = readFileSync(option.k8sAPIServerCaFile);
    config.reqeustConfig.httpsAgent = new Agent({ca});
  }
  if ('k8sAPIServerTokenFile' in option) {
    const token = readFileSync(option.k8sAPIServerTokenFile, 'ascii');
    config.headers = {Authorization: `Bearer ${token}`};
  }
}

function getSecretRootUri(options) {
  return `${options.apiServerUri}/${options.namespace}/secrets`;
}

async function read(key, options) {
  try {
    const request = axios.create(options.requestConfig);
    const hexKey = key ? Buffer.from(key).toString('hex') : '';
    const response = await request.get(getSecretRootUri(options) + `/${hexKey}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    let allUserInstance = [];
    let userData = response['data'];
    if (userData.hasOwnProperty('items')) {
      for (const item of userData['items']) {
        let userInstance = User.createUser({
          'username': Buffer.from(item['data']['username'], 'base64').toString(),
          'password': Buffer.from(item['data']['password'], 'base64').toString(),
          'groupList': JSON.parse(Buffer.from(item['data']['groupList'], 'base64').toString()),
          'email': Buffer.from(item['data']['email'], 'base64').toString(),
          'extension': JSON.parse(Buffer.from(item['data']['extension'], 'base64').toString()),
        });
        allUserInstance.push(userInstance);
      }
    } else {
      let userInstance = User.createUser({
        'username': Buffer.from(userData['data']['username'], 'base64').toString(),
        'password': Buffer.from(userData['data']['password'], 'base64').toString(),
        'groupList': JSON.parse(Buffer.from(userData['data']['groupList'], 'base64').toString()),
        'email': Buffer.from(userData['data']['email'], 'base64').toString(),
        'extension': JSON.parse(Buffer.from(userData['data']['extension'], 'base64').toString()),
      });
      allUserInstance.push(userInstance);
    }
    return allUserInstance;
  } catch (error) {
    throw error.response;
  }
}

async function create(key, value, options) {
  try {
    const request = axios.create(options.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    let userInstance = User.createUser(
      {
        'username': value['username'],
        'password': value['password'],
        'groupList': value['groupList'],
        'email': value['email'],
        'extension': value['extension'],
      }
    );
    await User.encryptUserPassword(userInstance);
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
    let response = await request.post(getSecretRootUri(options), userData);
    return response['data'];
  } catch (error) {
    throw error.response;
  }
}

async function update(key, value, options) {
  try {
    const request = axios.create(options.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    let userInstance = User.createUser(
      {
        'username': value['username'],
        'password': value['password'],
        'groupList': value['groupList'],
        'email': value['email'],
        'extension': value['extension'],
      }
    );
    await User.encryptUserPassword(userInstance);
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
    let response = await request.put(getSecretRootUri(options) + `/${hexKey}`, userData);
    return response['data'];
  } catch (error) {
    throw error.response;
  }
}

async function remove(key, options) {
  try {
    const request = axios.create(options.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    return await request.delete(getSecretRootUri(options) + `/${hexKey}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  } catch (error) {
    throw error.response;
  }
}

module.exports = {initConfig, create, read, update, remove};
