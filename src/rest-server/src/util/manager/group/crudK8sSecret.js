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

const Group = require('./schema');
const axios = require('axios');
const {readFileSync} = require('fs');
const {Agent} = require('https');

function initConfig(apiServerUri, namespace, option) {
  const config = {
    'apiServerUri': apiServerUri,
    'namespace': namespace,
    'reqeustConfig': {
      'baseURL': `${apiServerUri}/api/v1/namespaces/`,
      'maxRedirects': 0,
    },
  };
  if ('k8sAPIServerCaFile' in option) {
    const ca = readFileSync(option.k8sAPIServerCaFile);
    config.reqeustConfig.httpsAgent = new Agent({ca});
  }
  if ('k8sAPIServerTokenFile' in option) {
    const token = readFileSync(option.k8sAPIServerTokenFile, 'ascii');
    config.reqeustConfig.headers = {Authorization: `Bearer ${token}`};
  }
}

function getSecretRootUri(config) {
  return `${config.namespace}/secrets`;
}

async function read(key, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = key ? Buffer.from(key).toString('hex') : '';
    const response = await request.get(getSecretRootUri() + `/${hexKey}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    let allGroupInstance = [];
    let groupData = response['data'];
    if (groupData.hasOwnProperty('items')) {
      for (const item of groupData['items']) {
        let groupInstance = Group.createGroup({
          'groupname': Buffer.from(item['data']['groupname'], 'base64').toString(),
          'description': Buffer.from(item['data']['description'], 'base64').toString(),
          'GID': Buffer.from(item['data']['email'], 'base64').toString(),
          'extension': JSON.parse(Buffer.from(item['data']['extension'], 'base64').toString()),
        });
        allGroupInstance.push(groupInstance);
      }
    } else {
      let groupInstance = Group.createGroup({
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

async function create(key, value, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = key ? Buffer.from(key).toString('hex') : '';
    let groupInstance = Group.createGroup({
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
    let response = await request.post(getSecretRootUri(), groupData);
    return response['data'];
  } catch (error) {
    throw error.response;
  }
}

async function update(key, value, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    let groupInstance = Group.createGroup({
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
    let response = await request.put(getSecretRootUri() + `/${hexKey}`, groupData);
    return response['data'];
  } catch (error) {
    throw error.response;
  }
}

async function remove(key, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    let response = await request.delete(getSecretRootUri() + `/${hexKey}`, {
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

module.exports = {initConfig, create, read, update, remove};
