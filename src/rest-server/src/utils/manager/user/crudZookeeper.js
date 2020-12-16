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

const User = require('./user');
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
 * @typedef User
 * @property {string} UserInstance.username - username
 * @property {string} UserInstance.password - password. If no password is set, it will be ''
 * @property {string[]} UserInstance.grouplist - group list. Group name list which the user belongs to
 * @property {string} UserInstance.email - email
 * @property {Object} UserInstance.extension - extension field
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
    'userPrefix': option.userPrefix,
  };
  return config;
}

/**
 * @function prepareUserRoot - prepare user data root directory.
 * @async
 * @param {Config} config - Config for Zookeeper server. You could generate it from initConfig(connectionStr, option).
 * @return {Promise<User>} A promise to the User instance
 */
async function prepareUserRoot(config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    const rootExist = await util.promisify(zkClient.exists.bind(zkClient))(`/${config.userPrefix}`);
    if (!rootExist) {
      await util.promisify(zkClient.create.bind(zkClient))(`/${config.userPrefix}`);
    }
  } catch (error) {
    throw error;
  } finally {
    zkClient.close();
  }
}

/**
 * @function read - return a user's info based on the UserName.
 * @async
 * @param {string} key - User name
 * @param {Config} config - Config for Zookeeper server. You could generate it from initConfig(connectionStr, option).
 * @return {Promise<User>} A promise to the User instance
 */
async function read(key, config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    const username = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${key}/username`);
    const password = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${key}/password`);
    const grouplist = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${key}/grouplist`);
    const email = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${key}/email`);
    const extension = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${key}/extension`);
    let userInstance = User.createUser({
      'username': username.toString('utf8'),
      'password': password.toString('utf8'),
      'grouplist': JSON.parse(grouplist.toString('utf8')),
      'email': email.toString('utf8'),
      'extension': JSON.parse(extension.toString('utf8')),
    });
    logger.info(`Read user ${key} info successfully.`);
    return userInstance;
  } catch (error) {
    if (error.getCode() === Zookeeper.Exception.NO_NODE) {
      logger.error(`NoUserError: user ${key} is not found.`);
      throw createError('Not Found', 'NoUserError', `User ${key} is not found.`);
    } else {
      logger.error(`Internal server error: read user ${key} failed: ${error}`);
      throw createError('Internal Server Error', 'UnknownError', `Read user ${key} failed: ${error}`);
    }
  } finally {
    zkClient.close();
  }
}

/**
 * @function readAll - return all users' info.
 * @async
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<User[]>} A promise to all User instance list.
 */
async function readAll(config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
    const allUser = await util.promisify(zkClient.getChildren.bind(zkClient))(`/${config.userPrefix}`);
    let allUserInstance = [];
    for (const item of allUser) {
      const username = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${item}/username`);
      const password = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${item}/password`);
      const grouplist = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${item}/grouplist`);
      const email = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${item}/email`);
      const extension = await util.promisify(zkClient.getData.bind(zkClient))(`/${config.userPrefix}/${item}/extension`);

      let userInstance = User.createUser({
        'username': username.toString('utf8'),
        'password': password.toString('utf8'),
        'grouplist': JSON.parse(grouplist.toString('utf8')),
        'email': email.toString('utf8'),
        'extension': JSON.parse(extension.toString('utf8')),
      });
      allUserInstance.push(userInstance);
    }
    logger.info('Read all users successfully');
    return allUserInstance;
  } catch (error) {
    logger.error(`Internal server error: read all users failed: ${error}`);
    throw createError('Internal Server Error', 'UnknownError', `Read all user failed: ${error}`);
  } finally {
    zkClient.close();
  }
}


/**
 * @function create - Create an user entry to zookeeper.
 * @async
 * @param {string} key - User name
 * @param {User} value - User info
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<User>} A promise to the User instance.
 */
async function create(key, value, config) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
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
    const newUserTrans = zkClient.transaction().create(`/${config.userPrefix}/${key}`).
      create(`/${config.userPrefix}/${key}/username`, Buffer.from(userInstance['username'])).
      create(`/${config.userPrefix}/${key}/password`, Buffer.from(userInstance['password'])).
      create(`/${config.userPrefix}/${key}/grouplist`, Buffer.from(JSON.stringify(userInstance['grouplist']))).
      create(`/${config.userPrefix}/${key}/email`, Buffer.from(userInstance['email'])).
      create(`/${config.userPrefix}/${key}/extension`, Buffer.from(JSON.stringify(userInstance['extension'])));

    const response = await util.promisify(newUserTrans.commit.bind(newUserTrans))();
    logger.info(`Create user ${key} successfully`);
    return response;
  } catch (error) {
    if (error.getCode() === Zookeeper.Exception.NODE_EXISTS) {
      logger.warn(`ConflictUserError: user ${key} already exists.`);
      throw createError('Conflict', 'ConflictUserError', `User ${key} already exists.`);
    } else {
      logger.error(`Internal Server Error: create user ${key} failed: ${error}`);
      throw createError('Internal Server Error', 'UnknownError', `Create user ${key} failed: ${error}`);
    }
  } finally {
    zkClient.close();
  }
}

/**
 * @function update - Update an user entry to kubernetes secrets.
 * @async
 * @param {string} key - User name
 * @param {User} value - User info
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @param {Boolean} updatePassword - With value false, the password won't be encrypt again.
 * @return {Promise<User>} A promise to the User instance.
 */
async function update(key, value, config, updatePassword = false) {
  const zkClient = Zookeeper.createClient(config.connectionStr, {
    sessionTimeout: DEFAULT_SESSION_TIMEOUT,
    spinDelay: DEFAULT_SPIN_DELAY,
    retries: MAX_RETRY_COUNT,
  });
  try {
    zkClient.connect();
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
    const alreadyExist = await util.promisify(zkClient.exists.bind(zkClient))(`/${config.userPrefix}/${key}`);
    if (alreadyExist) {
      const updateUserTrans = zkClient.transaction().setData(`/${config.userPrefix}/${key}/username`, Buffer.from(userInstance['username'])).
        setData(`/${config.userPrefix}/${key}/password`, Buffer.from(userInstance['password'])).
        setData(`/${config.userPrefix}/${key}/grouplist`, Buffer.from(JSON.stringify(userInstance['grouplist']))).
        setData(`/${config.userPrefix}/${key}/email`, Buffer.from(userInstance['email'])).
        setData(`/${config.userPrefix}/${key}/extension`, Buffer.from(JSON.stringify(userInstance['extension'])));
      const updateResponse = await util.promisify(updateUserTrans.commit.bind(updateUserTrans))();
      return updateResponse;
    } else {
      const addUserTrans = zkClient.transaction().create(`/${config.userPrefix}/${key}`).
        create(`/${config.userPrefix}/${key}/username`, Buffer.from(userInstance['username'])).
        create(`/${config.userPrefix}/${key}/password`, Buffer.from(userInstance['password'])).
        create(`/${config.userPrefix}/${key}/grouplist`, Buffer.from(JSON.stringify(userInstance['grouplist']))).
        create(`/${config.userPrefix}/${key}/email`, Buffer.from(userInstance['email'])).
        create(`/${config.userPrefix}/${key}/extension`, Buffer.from(JSON.stringify(userInstance['extension'])));
      const addUserResponse = await util.promisify(addUserTrans.commit.bind(addUserTrans))();
      return addUserResponse;
    }
  } catch (error) {
    logger.error(`Internal Server Error: update user ${key} failed: ${error}`);
    throw createError('Internal Server Error', 'UnknownError', `Update user ${key} failed: ${error}`);
  } finally {
    zkClient.close();
  }
}

/**
 * @function Remove - Remove an user entry from kubernetes secrets.
 * @async
 * @param {string} key - User name
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
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
    const response = await util.promisify(zkClient.removeRecursive.bind(zkClient))(`/${config.userPrefix}/${key}`);
    logger.info('Remove user ${key} successfully');
    return response;
  } catch (error) {
    if (error.getCode() === Zookeeper.Exception.NO_NODE) {
      logger.error(`NoUserError: user ${key} is not found.`);
      throw createError('Not Found', 'NoUserError', `User ${key} is not found.`);
    } else {
      logger.error(`Internal Server Error: remove user ${key} failed: ${error}`);
      throw createError('Internal Server Error', 'UnknownError', `Remove user ${key} failed: ${error}`);
    }
  } finally {
    zkClient.close();
  }
}

module.exports = {initConfig, create, read, readAll, update, remove, prepareUserRoot};
