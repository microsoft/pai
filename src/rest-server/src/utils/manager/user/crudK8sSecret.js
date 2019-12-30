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
const logger = require('@pai/config/logger');
const k8sModel = require('@pai/models/kubernetes');

const USER_NAMESPACE = process.env.PAI_USER_NAMESPACE || 'pai-user-v2';

/**
 * @typedef User
 * @property {string} UserInstance.username - username
 * @property {string} UserInstance.password - password. If no password is set, it will be ''
 * @property {string[]} UserInstance.grouplist - group list. Group name list which the user belongs to
 * @property {string} UserInstance.email - email
 * @property {Object} UserInstance.extension - extension field
 */

/**
 * @function read - return a user's info based on the UserName.
 * @async
 * @param {string} key - User name
 * @return {Promise<User>} A promise to the User instance
 */
async function read(key) {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces/');
    const hexKey = Buffer.from(key).toString('hex');
    const response = await request.get(`${USER_NAMESPACE}/secrets/${hexKey}`.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    let userData = response['data'];
    let userInstance = User.createUser({
      'username': Buffer.from(userData['data']['username'], 'base64').toString(),
      'password': Buffer.from(userData['data']['password'], 'base64').toString(),
      'grouplist': JSON.parse(Buffer.from(userData['data']['grouplist'], 'base64').toString()),
      'email': Buffer.from(userData['data']['email'], 'base64').toString(),
      'extension': JSON.parse(Buffer.from(userData['data']['extension'], 'base64').toString()),
    });
    return userInstance;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function readAll - return all users' info.
 * @async
 * @return {Promise<User[]>} A promise to all User instance list.
 */
async function readAll() {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces/');
    const response = await request.get(`${USER_NAMESPACE}/secrets`.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    });
    let allUserInstance = [];
    let userData = response['data'];
    for (const item of userData['items']) {
      try {
        let userInstance = User.createUser({
          'username': Buffer.from(item['data']['username'], 'base64').toString(),
          'password': Buffer.from(item['data']['password'], 'base64').toString(),
          'grouplist': JSON.parse(Buffer.from(item['data']['grouplist'], 'base64').toString()),
          'email': Buffer.from(item['data']['email'], 'base64').toString(),
          'extension': JSON.parse(Buffer.from(item['data']['extension'], 'base64').toString()),
        });
        allUserInstance.push(userInstance);
      } catch (error) {
        logger.debug(`secret ${item['metadata']['name']} is filtered in ${USER_NAMESPACE} due to user schema`);
      }
    }
    return allUserInstance;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function create - Create an user entry to kubernetes secrets.
 * @async
 * @param {string} key - User name
 * @param {User} value - User info
 * @return {Promise<User>} A promise to the User instance.
 */
async function create(key, value) {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces/');
    const hexKey = Buffer.from(key).toString('hex');
    let userInstance = User.createUser(
      {
        'username': value['username'],
        'password': value['password'],
        'grouplist': value['grouplist'],
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
        'grouplist': Buffer.from(JSON.stringify(userInstance['grouplist'])).toString('base64'),
        'email': Buffer.from(userInstance['email']).toString('base64'),
        'extension': Buffer.from(JSON.stringify(userInstance['extension'])).toString('base64'),
      },
    };
    let response = await request.post(`${USER_NAMESPACE}/secrets`, userData);
    return response;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function update - Update an user entry to kubernetes secrets.
 * @async
 * @param {string} key - User name
 * @param {User} value - User info
 * @param {Boolean} updatePassword - With value false, the password won't be encrypt again.
 * @return {Promise<User>} A promise to the User instance.
 */
async function update(key, value, updatePassword = false) {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces/');
    const hexKey = Buffer.from(key).toString('hex');
    let userInstance = User.createUser(
      {
        'username': value['username'],
        'password': value['password'],
        'grouplist': value['grouplist'],
        'email': value['email'],
        'extension': value['extension'],
      }
    );
    if (updatePassword) {
      await User.encryptUserPassword(userInstance);
    }
    let userData = {
      'metadata': {'name': hexKey},
      'data': {
        'username': Buffer.from(userInstance['username']).toString('base64'),
        'password': Buffer.from(userInstance['password']).toString('base64'),
        'grouplist': Buffer.from(JSON.stringify(userInstance['grouplist'])).toString('base64'),
        'email': Buffer.from(userInstance['email']).toString('base64'),
        'extension': Buffer.from(JSON.stringify(userInstance['extension'])).toString('base64'),
      },
    };
    let response = await request.put(`${USER_NAMESPACE}/secrets/${hexKey}`, userData);
    return response;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function Remove - Remove an user entry from kubernetes secrets.
 * @async
 * @param {string} key - User name
 * @return {Promise<void>}
 */
async function remove(key) {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces/');
    const hexKey = Buffer.from(key).toString('hex');
    return await request.delete(`${USER_NAMESPACE}/secrets/${hexKey}`, {
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

module.exports = {create, read, readAll, update, remove};
