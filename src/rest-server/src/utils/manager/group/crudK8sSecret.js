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
const logger = require('@pai/config/logger');
const k8sModel = require('@pai/models/kubernetes');

const GROUP_NAMESPACE = process.env.PAI_GROUP_NAMESPACE || 'pai-group';

/**
 * @typedef Group
 * @property {string} username - username
 * @property {String} externalName - externalName
 * @property {string} description - description
 * @property {Object} extension - extension field
 */

/**
 * @function read - return a Group's info based on the GroupName.
 * @async
 * @param {string} key - Group name
 * @return {Promise<Group>} A promise to the Group instance
 */
async function read(key) {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces');
    const hexKey = Buffer.from(key).toString('hex');
    const response = await request.get(`${GROUP_NAMESPACE}/secrets/${hexKey}`, {
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
 * @return {Promise<Group[]>} A promise to all Group instance list.
 */
async function readAll() {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces');
    const response = await request.get(`${GROUP_NAMESPACE}/secrets`, {
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
        logger.debug(`secret ${item['metadata']['name']} is filtered in ${GROUP_NAMESPACE} due to group schema`);
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
 * @return {Promise<Group>} A promise to the Group instance.
 */
async function create(key, value) {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces');
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
    return await request.post(`${GROUP_NAMESPACE}/secrets`, groupData);
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
 * @return {Promise<Group>} A promise to the User instance.
 */
async function update(key, value) {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces');
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
    return await request.put(`${GROUP_NAMESPACE}/secrets/${hexKey}`, groupData);
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
 * @return {Promise<void>}
 */
async function remove(key) {
  try {
    const request = k8sModel.getClient('/api/v1/namespaces');
    const hexKey = Buffer.from(key).toString('hex');
    return await request.delete(`${GROUP_NAMESPACE}/secrets/${hexKey}`, {
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
