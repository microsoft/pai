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
'use strict';

const Group = require('./group');
const Zookeeper = require('node-zookeeper-client');
const util = require('util');
const createError = require('@pai/utils/error');
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
 * @function initConfig - Init the zookeeper configuration for user manager's crud.
 * @param {string} connectionStr - Required config, Zookeeper connection string.
 * @param {Object} option - Config for user data storage.
 * @param {string} option.groupPrefix - Optional config, the parent node for user data.
 * @return {Config} config
 */
const MAX_RETRY_COUNT = 5;
const DEFAULT_SESSION_TIMEOUT = 50000;
const DEFAULT_SPIN_DELAY = 3000;

function initConfig(connectionStr, option = {}) {
  const config = {
    'connectionStr': `${connectionStr}`,
    'groupPrefix': option.groupPrefix,
  };
  return config;
}

/**
 * @function prepareGroupRoot - prepare user data root directory.
 * @async
 * @param {Config} config - Config for Zookeeper server. You could generate it from initConfig(connectionStr, option).
 * @return {Promise<Group>} A promise to the Group instance
 */
async function prepareGroupRoot(config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    const rootExist = await util.promisify(zkClient.exists.bind(zkClient))(`/${config.groupPrefix}`);
    if (!rootExist) {
      await util.promisify(zkClient.create.bind(zkClient))(`/${config.groupPrefix}`);
    }
  } catch (error) {
    throw error;
  } finally {
    zkClient.close();
  }
}

/**
 * @function read - return a Group's info based on the GroupName.
 * @async
 * @param {string} key - Group name
 * @param {Config} config - Config for Zookeeper server. You could generate it from initConfig(connectionStr, option).
 * @return {Promise<Group>} A promise to the Group instance
 */
async function read(key, config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    const groupName = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.groupPrefix}/${key}/groupname`);
    const description = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.groupPrefix}/${key}/description`);
    const externalName = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.groupPrefix}/${key}/externalName`);
    const extension = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.groupPrefix}/${key}/extension`);
    let groupInstance = Group.createGroup({
      'groupname': groupName.toString('utf8'),
      'description': description.toString('utf8'),
      'externalName': externalName.toString('utf8'),
      'extension': JSON.parse(extension.toString('utf8')),
    });
    logger.info(`Read group ${key} successfully`);
    return groupInstance;
  } catch (error) {
    if (error.getCode() === Zookeeper.Exception.NO_NODE) {
      logger.error(`NoGroupError: group ${key} is not found.`);
      throw createError('Not Found', 'NoGroupError', `Group ${key} is not found.`);
    } else {
      logger.error(`Internal Server Error: read group ${key} failed: ${error}`);
      throw createError('Internal Server Error', 'UnknownError', `Read group ${key} failed: ${error}`);
    }
  } finally {
    zkClient.close();
  }
}

/**
 * @function readAll - return all Groups' info.
 * @async
 * @param {Config} config - Config for Zookeeper server. You could generate it from initConfig(connectionStr, option).
 * @return {Promise<Group[]>} A promise to all Group instance list.
 */
async function readAll(config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    const allGroups = await util.promisify(zkClient.getChildren.bind(zkClient))(`/${config.groupPrefix}`);
    let allGroupInstance = [];
    for (const item of allGroups) {
      const groupname = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.groupPrefix}/${item}/groupname`);
      const description = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.groupPrefix}/${item}/description`);
      const externalName = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.groupPrefix}/${item}/externalName`);
      const extension = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.groupPrefix}/${item}/extension`);

      let groupInstance = Group.createGroup({
        'groupname': groupname.toString('utf8'),
        'description': description.toString('utf8'),
        'externalName': externalName.toString('utf8'),
        'extension': JSON.parse(extension.toString('utf8')),
      });
      allGroupInstance.push(groupInstance);
    }
    logger.info('Read all groups successfully');
    return allGroupInstance;
  } catch (error) {
    logger.error(`Internal Server Error: read all group failed: ${error}`);
    throw createError('Internal Server Error', 'UnknownError', `Read all group failed: ${error}`);
  } finally {
    zkClient.close();
  }
}

/**
 * @function create - Create a Group entry to kubernetes secrets.
 * @async
 * @param {string} key - Group name
 * @param {User} value - Group info
 * @param {Config} config - Config for Zookeeper server. You could generate it from initConfig(connectionStr, option).
 * @return {Promise<Group>} A promise to the Group instance.
 */
async function create(key, value, config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    let groupInstance = Group.createGroup({
      'groupname': value['groupname'],
      'description': value['description'],
      'externalName': value['externalName'],
      'extension': value['extension'],
    });
    const newGroupTrans = zkClient.transaction().create(`/${config.groupPrefix}/${key}`).
      create(`/${config.groupPrefix}/${key}/groupname`, Buffer.from(groupInstance['groupname'])).
      create(`/${config.groupPrefix}/${key}/description`, Buffer.from(groupInstance['description'])).
      create(`/${config.groupPrefix}/${key}/externalName`, Buffer.from(groupInstance['externalName'])).
      create(`/${config.groupPrefix}/${key}/extension`, Buffer.from(JSON.stringify(groupInstance['extension'])));
    logger.info(`Create group ${key} successfully`);
    await util.promisify(newGroupTrans.commit.bind(newGroupTrans))();
  } catch (error) {
    if (error.getCode() === Zookeeper.Exception.NODE_EXISTS) {
      logger.warn(`ConflictUserError: group ${key} already exists.`);
      throw createError('Conflict', 'ConflictUserError', `Group ${key} already exists.`);
    } else {
      logger.error(`Internal Server Error: create group ${key} failed: ${error}`);
      throw createError('Internal Server Error', 'UnknownError', `Create group ${key} failed: ${error}`);
    }
  } finally {
    zkClient.close();
  }
}

/**
 * @function update - Update a Group entry to kubernetes secrets.
 * @async
 * @param {string} key - Group name
 * @param {User} value - Group info
 * @param {Config} config - Config for Zookeeper server. You could generate it from initConfig(connctionStr, option).
 * @return {Promise<Group>} A promise to the User instance.
 */
async function update(key, value, config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    let groupInstance = Group.createGroup({
      'groupname': value['groupname'],
      'description': value['description'],
      'externalName': value['externalName'],
      'extension': value['extension'],
    });
    const alreadyExist = await util.promisify(zkClient.exists.bind(zkClient))(`/${config.groupPrefix}/${key}`);
    if (alreadyExist) {
      const updateGroupTrans = zkClient.transaction().setData(`/${config.groupPrefix}/${key}/groupname`, Buffer.from(groupInstance['groupname'])).
        setData(`/${config.groupPrefix}/${key}/description`, Buffer.from(groupInstance['description'])).
        setData(`/${config.groupPrefix}/${key}/externalName`, Buffer.from(groupInstance['externalName'])).
        setData(`/${config.groupPrefix}/${key}/extension`, Buffer.from(JSON.stringify(groupInstance['extension'])));
      await util.promisify(updateGroupTrans.commit.bind(updateGroupTrans))();
    } else {
      const addGroupTrans = zkClient.transaction().create(`/${config.groupPrefix}/${key}`).
        create(`/${config.groupPrefix}/${key}/groupname`, Buffer.from(groupInstance['groupname'])).
        create(`/${config.groupPrefix}/${key}/description`, Buffer.from(groupInstance['description'])).
        create(`/${config.userPrefix}/${key}/externalName`, Buffer.from(groupInstance['externalName'])).
        create(`/${config.groupPrefix}/${key}/extension`, Buffer.from(JSON.stringify(groupInstance['extension'])));
      await util.promisify(addGroupTrans.commit.bind(addGroupTrans))();
    }
  } catch (error) {
    logger.error(`Internal Server Error: update group ${key} failed: ${error}`);
    throw createError('Internal Server Error', 'UnknownError', `Update group ${key} failed: ${error}`);
  } finally {
    zkClient.close();
  }
}

/**
 * @function Remove - Remove a group entry to kubernetes secrets.
 * @async
 * @param {string} key - Group name
 * @param {Config} config - Config for Zookeeper server. You could generate it from initConfig(connectionStr, option).
 * @return {Promise<void>}
 */
async function remove(key, config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    logger.info(`Remove group ${key} successfully`);
    await util.promisify(zkClient.removeRecursive.bind(zkClient))(`/${config.groupPrefix}/${key}`);
  } catch (error) {
    if (error.getCode() === Zookeeper.Exception.NO_NODE) {
      logger.error(`NoGroupError: group ${key} is not found.`);
      throw createError('Not Found', 'NoGroupError', `Group ${key} is not found.`);
    } else {
      logger.error(`Internal Server Error: remove group ${key} failed: ${error}`);
      throw createError('Internal Server Error', 'UnknownError', `Remove group ${key} failed: ${error}`);
    }
  } finally {
    zkClient.close();
  }
}

module.exports = {initConfig, create, read, readAll, update, remove, prepareGroupRoot};
