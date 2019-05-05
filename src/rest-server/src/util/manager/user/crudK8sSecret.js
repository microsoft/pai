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
 * @typedef User
 * @property {string} UserInstance.username - username
 * @property {string} UserInstance.password - password. If no password is set, it will be ''
 * @property {string[]} UserInstance.groupList - group list. Group name list which the user belongs to
 * @property {string} UserInstance.email - email
 * @property {Object} UserInstance.extension - extension field
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
  const namespaces = process.env.PAI_USER_NAMESPACE;
  const config = {
    'namespace': namespaces? namespaces : 'pai-user',
    'requestConfig': {
      'baseURL': `${apiServerUri}/api/v1/namespaces/`,
      'maxRedirects': 0,
    },
  };
  if ('k8sAPIServerCaFile' in option) {
    const ca = readFileSync(option.k8sAPIServerCaFile);
    config.requestConfig.httpsAgent = new Agent({ca});
  }
  if ('k8sAPIServerTokenFile' in option) {
    const token = readFileSync(option.k8sAPIServerTokenFile, 'ascii');
    config.requestConfig.headers = {Authorization: `Bearer ${token}`};
  }
  return config;
}

function getSecretRootUri(config) {
  return `${config.namespace}/secrets`;
}

/**
 * @function read - return a user's info based on the UserName.
 * @async
 * @param {string} key - User name
 * @param {Config} config - Config for kubernetes APIServer. You should generate it from initConfig(apiServerUri, option).
 * @return {Promise<User>} A promise to the User instance
 */
async function read(key, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    const response = await request.get(getSecretRootUri(config) + `/${hexKey}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    let userData = response['data'];
    let userInstance = User.createUser({
      'username': Buffer.from(userData['data']['username'], 'base64').toString(),
      'password': Buffer.from(userData['data']['password'], 'base64').toString(),
      'groupList': JSON.parse(Buffer.from(userData['data']['groupList'], 'base64').toString()),
      'email': Buffer.from(userData['data']['email'], 'base64').toString(),
      'extension': JSON.parse(Buffer.from(userData['data']['extension'], 'base64').toString()),
    });
    return userInstance;
  } catch (error) {
    throw error.response;
  }
}

/**
 * @function readAll - return all users' info.
 * @async
 * @param {Config} config - Config for kubernetes APIServer. You should generate it from initConfig(apiServerUri, option).
 * @return {Promise<User[]>} A promise to all User instance list.
 */
async function readAll(config) {
  try {
    // eslint-disable-next-line no-console
    console.log(config.requestConfig);
    const request = axios.create(config.requestConfig);
    // eslint-disable-next-line no-console
    console.log(getSecretRootUri(config));
    const response = await request.get(getSecretRootUri(config), {
      headers: {
        'Accept': 'application/json',
      },
    });
    let allUserInstance = [];
    let userData = response['data'];
    for (const item of userData['items']) {
      let userInstance = User.createUser({
        'username': Buffer.from(item['data']['username'], 'base64').toString(),
        'password': Buffer.from(item['data']['password'], 'base64').toString(),
        'groupList': JSON.parse(Buffer.from(item['data']['groupList'], 'base64').toString()),
        'email': Buffer.from(item['data']['email'], 'base64').toString(),
        'extension': JSON.parse(Buffer.from(item['data']['extension'], 'base64').toString()),
      });
      // eslint-disable-next-line no-console
      console.log(userInstance);
      allUserInstance.push(userInstance);
    }
    return allUserInstance;
  } catch (error) {
    throw error.response;
  }
}

/**
 * @function create - Create an user entry to kubernetes secrets.
 * @async
 * @param {string} key - User name
 * @param {User} value - User info
 * @param {Config} config - Config for kubernetes APIServer. You should generate it from initConfig(apiServerUri, option).
 * @return {Promise<User>} A promise to the User instance.
 */
async function create(key, value, config) {
  try {
    const request = axios.create(config.requestConfig);
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
    let response = await request.post(getSecretRootUri(config), userData);
    return response['data'];
  } catch (error) {
    throw error.response;
  }
}

/**
 * @function update - Update an user entry to kubernetes secrets.
 * @async
 * @param {string} key - User name
 * @param {User} value - User info
 * @param {Config} config - Config for kubernetes APIServer. You should generate it from initConfig(apiServerUri, option).
 * @return {Promise<User>} A promise to the User instance.
 */
async function update(key, value, config) {
  try {
    const request = axios.create(config.requestConfig);
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
    let response = await request.put(getSecretRootUri(config) + `/${hexKey}`, userData);
    return response['data'];
  } catch (error) {
    throw error.response;
  }
}

/**
 * @function update - Update an user entry to kubernetes secrets.
 * @async
 * @param {string} key - User name
 * @param {Config} config - Config for kubernetes APIServer. You should generate it from initConfig(apiServerUri, option).
 * @return {Promise<void>}
 */
async function remove(key, config) {
  try {
    const request = axios.create(config.requestConfig);
    const hexKey = Buffer.from(key).toString('hex');
    return await request.delete(getSecretRootUri(config) + `/${hexKey}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  } catch (error) {
    throw error.response;
  }
}

module.exports = {initConfig, create, read, readAll, update, remove};
