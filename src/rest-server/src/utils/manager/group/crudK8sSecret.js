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

const Group = require('./group');
const axios = require('axios');
const {Agent} = require('https');
const logger = require('@pai/config/logger');

/**
 * @typedef Config
 * @property {string} namespace - kubernetes namespace
 * @property {Object} requestConfig - RequestConfig
 * @property {string} requestConfig.baseURL - BaseURL for axios
 * @property {Number} requestConfig.maxRedirects - maxRedirects for axios
 * @property {Object} requestConfig.httpsAgent - For kubernetes authn
 * @property {Object} requestConfig.headers - For kubernetes authn
 */

/**
 * @typedef Group
 * @property {string} username - username
 * @property {String} externalName - externalName
 * @property {string} description - description
 * @property {Object} extension - extension field
 */

/**
 * @function initConfig - Init the kubernetes configuration for user manager's crud.
 * @param {string} apiServerUri - Required config, the uri of kubernetes APIServer.
 * @param {Object} option - Config for kubernetes APIServer's authn.
 * @param {string} option.k8sAPIServerCaFile - Optional config, the ca file path of kubernetes APIServer.
 * @param {string} option.k8sAPIServerTokenFile - Optional config, the token file path of kubernetes APIServer.
 * @return {Config} config
 */
function initConfig(apiServerUri, option = {}) {
  const namespaces = process.env.PAI_GROUP_NAMESPACE;
  const config = {
    'apiServerUri': apiServerUri,
    'namespace': namespaces? namespaces : 'pai-group',
    'requestConfig': {
      'baseURL': `${apiServerUri}/api/v1/namespaces/`,
      'maxRedirects': 0,
    },
  };
  if ('k8sAPIServerCaFile' in option) {
    const ca = option.k8sAPIServerCaFile;
    config.requestConfig.httpsAgent = new Agent({ca});
  }
  if ('k8sAPIServerTokenFile' in option) {
    const token = option.k8sAPIServerTokenFile;
    config.requestConfig.headers = {Authorization: `Bearer ${token}`};
  }
  return config;
}

/**
 * @function read - return a Group's info based on the GroupName.
 * @async
 * @param {string} key - Group name
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Group>} A promise to the Group instance
 */
async function read(key, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    const response = await request.get(`${config.namespace}/secrets/${hexKey}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    let groupData = response['data'];
    let groupInstance = Group.createGroup({
      'groupname': Buffer.from(groupData['data']['groupname'], 'base64').toString(),
      'description': Buffer.from(groupData['data']['description'], 'base64').toString(),
      'externalName': Buffer.from(groupData['data']['externalName'], 'base64').toString(),
      'extension': JSON.parse(Buffer.from(groupData['data']['extension'], 'base64').toString()),
    });
    return groupInstance;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function readAll - return all Groups' info.
 * @async
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Group[]>} A promise to all Group instance list.
 */
async function readAll(config) {
  try {
    const request = axios.create(config.requestConfig);
    const response = await request.get(`${config.namespace}/secrets`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    let allGroupInstance = [];
    let groupData = response['data'];
    for (const item of groupData['items']) {
      try {
        let groupInstance = Group.createGroup({
          'groupname': Buffer.from(item['data']['groupname'], 'base64').toString(),
          'description': Buffer.from(item['data']['description'], 'base64').toString(),
          'externalName': Buffer.from(item['data']['externalName'], 'base64').toString(),
          'extension': JSON.parse(Buffer.from(item['data']['extension'], 'base64').toString()),
        });
        allGroupInstance.push(groupInstance);
      } catch (error) {
        logger.debug(`secret ${item['metadata']['name']} is filtered in ${config.namespace} due to group schema`);
      }
    }
    return allGroupInstance;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function create - Create a Group entry to kubernetes secrets.
 * @async
 * @param {string} key - Group name
 * @param {User} value - Group info
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Group>} A promise to the Group instance.
 */
async function create(key, value, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = key ? Buffer.from(key).toString('hex') : '';
    let groupInstance = Group.createGroup({
      'groupname': value['groupname'],
      'description': value['description'],
      'externalName': value['externalName'],
      'extension': value['extension'],
    });
    let groupData = {
      'metadata': {'name': hexKey},
      'data': {
        'groupname': Buffer.from(groupInstance['groupname']).toString('base64'),
        'description': Buffer.from(groupInstance['description']).toString('base64'),
        'externalName': Buffer.from(groupInstance['externalName']).toString('base64'),
        'extension': Buffer.from(JSON.stringify(groupInstance['extension'])).toString('base64'),
      },
    };
    return await request.post(`${config.namespace}/secrets`, groupData);
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function update - Update a Group entry to kubernetes secrets.
 * @async
 * @param {string} key - Group name
 * @param {User} value - Group info
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Group>} A promise to the User instance.
 */
async function update(key, value, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    let groupInstance = Group.createGroup({
      'groupname': value['groupname'],
      'description': value['description'],
      'externalName': value['externalName'],
      'extension': value['extension'],
    });
    let groupData = {
      'metadata': {'name': hexKey},
      'data': {
        'groupname': Buffer.from(groupInstance['groupname']).toString('base64'),
        'description': Buffer.from(groupInstance['description']).toString('base64'),
        'externalName': Buffer.from(groupInstance['externalName']).toString('base64'),
        'extension': Buffer.from(JSON.stringify(groupInstance['extension'])).toString('base64'),
      },
    };
    return await request.put(`${config.namespace}/secrets/${hexKey}`, groupData);
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function Remove - Remove a group entry to kubernetes secrets.
 * @async
 * @param {string} key - Group name
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<void>}
 */
async function remove(key, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    return await request.delete(`${config.namespace}/secrets/${hexKey}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

module.exports = {initConfig, create, read, readAll, update, remove};
