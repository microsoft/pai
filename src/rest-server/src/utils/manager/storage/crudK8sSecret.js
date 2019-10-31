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

const Storage = require('./storage');
const axios = require('axios');
const {Agent} = require('https');
const logger = require('@pai/config/logger');
const createError = require('@pai/utils/error');

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
 * @typedef StorageServer
 * @property {string} ServerInstance.spn - server name
 * @property {string} ServerInstance.type - server type
 * @property {Object} ServerInstance.data - server data
 */

/**
 * @typedef StorageConfig
 * @property {string} ConfigInstance.name - config name
 * @property {boolean} ConfigInstance.default - config type
 * @property {Array} ConfigInstance.servers - config data
 * @property {Array} ConfigInstance.mountInfos - config data
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
  const namespaces = process.env.PAI_STORAGE_NAMESPACE;
  const config = {
    namespace: namespaces ? namespaces : 'pai-storage',
    requestConfig: {
      baseURL: `${apiServerUri}/api/v1/namespaces/`,
      maxRedirects: 0,
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
 * @function readStorageServer - return a Storage Server's info based on spn.
 * @async
 * @param {string} key - Server spn
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<StorageServer>} A promise to the StorageServer instance
 */
async function readStorageServer(key, config) {
  try {
    const request = axios.create(config.requestConfig);

    logger.info(`${config.namespace}/secrets/storage-server`);
    const response = await request.get(
      `${config.namespace}/secrets/storage-server`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    logger.info(response);
    let serverData = JSON.parse(
      Buffer.from(response['data']['data'][key], 'base64').toString()
    );
    let innerData = Object.assign({}, serverData);
    delete innerData.spn;
    delete innerData.type;

    let serverInstance = Storage.createStorageServer({
      spn: serverData['spn'],
      type: serverData['type'],
      data: innerData,
      extension:
        serverData['extension'] !== undefined ? serverData['extension'] : {},
    });
    return serverInstance;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function readStorageServers - return Storage Server's infos based on spns.
 * @async
 * @param {string[]} keys - An array of server spns. If array is empty, return all StorageServers.
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<StorageServer[]>} A promise to the StorageServer instances
 */
async function readStorageServers(keys, config) {
  try {
    const request = axios.create(config.requestConfig);
    const response = await request.get(
      `${config.namespace}/secrets/storage-server`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    let serverInstances = [];
    if (keys.length == 0) {
      keys = Object.keys(response['data']['data']);
    }

    for (const key of keys) {
      if (key !== 'empty' && response['data']['data'].hasOwnProperty(key)) {
        let serverData = JSON.parse(
          Buffer.from(response['data']['data'][key], 'base64').toString()
        );
        let innerData = Object.assign({}, serverData);
        delete innerData.spn;
        delete innerData.type;

        serverInstances.push(
          Storage.createStorageServer({
            spn: serverData['spn'],
            type: serverData['type'],
            data: innerData,
            extension:
              serverData['extension'] !== undefined
                ? serverData['extension']
                : {},
          })
        );
      }
    }

    return serverInstances;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function readStorageConfig - return a Storage Config's info based on config name.
 * @async
 * @param {string} key - Config name
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<StorageConfig>} A promise to the StorageConfig instance
 */
async function readStorageConfig(key, config) {
  try {
    const request = axios.create(config.requestConfig);
    const response = await request.get(
      `${config.namespace}/secrets/storage-config`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    let configData = JSON.parse(
      Buffer.from(response['data']['data'][key], 'base64').toString()
    );
    let configInstance = Storage.createStorageConfig({
      name: configData['name'],
      default: configData['default'],
      servers: configData['servers'],
      mountInfos: configData['mountInfos'],
    });
    return configInstance;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function readStorageConfigs - return Storage Configs's infos based on config names.
 * @async
 * @param {string[]} keys - An array of config names. If array is empty, return all StorageConfigs.
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<StorageConfig[]>} A promise to the StorageConfig instances
 */
async function readStorageConfigs(keys, config) {
  try {
    const request = axios.create(config.requestConfig);
    const response = await request.get(
      `${config.namespace}/secrets/storage-config`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    let configInstances = [];
    if (keys.length == 0) {
      keys = Object.keys(response['data']['data']);
    }

    for (const key of keys) {
      if (key !== 'empty' && response['data']['data'].hasOwnProperty(key)) {
        let configData = JSON.parse(
          Buffer.from(response['data']['data'][key], 'base64').toString()
        );
        configInstances.push(
          Storage.createStorageConfig({
            name: configData['name'],
            default: configData['default'],
            servers: configData['servers'],
            mountInfos: configData['mountInfos'],
          })
        );
      }
    }

    return configInstances;
  } catch (error) {
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function patchStorageServer - Patch Storage Server entry to kubernetes secrets.
 * @async
 * @param {string} op - Patch operation type, could be add, replace or remove
 * @param {string} key - Storage Server name
 * @param {StorageServer} value - Storage Server info, should be null when op is remove
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Object>} A promise to patch result.
 */
async function patchStorageServer(op, key, value, config) {
  if (key === 'empty') {
    throw createError('Forbidden', 'ForbiddenKeyError', 'Key \'empty\' is system reserved and should not be modified!');
  }

  try {
    const request = axios.create(config.requestConfig);
    let serverData = {
      op: op,
      path: `/data/${key}`,
    };
    if (value !== null) {
      let serverInstance = Storage.createStorageServer(value);
      serverData.value = Buffer.from(
        JSON.stringify({
          spn: serverInstance['spn'],
          type: serverInstance['type'],
          ...serverInstance['data'],
          extension:
            serverInstance['extension'] !== undefined
              ? serverInstance['extension']
              : {},
        })
      ).toString('base64');
    }
    logger.info(serverData);
    return await request.patch(
      `${config.namespace}/secrets/storage-server`,
      [serverData],
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json-patch+json',
        },
      }
    );
  } catch (error) {
    logger.debug(`Error when ${op} StorageServer ${key}, please check.`);
    if (error.response) {
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function patchStorageConfig - Patch Storage Config entry to kubernetes secrets.
 * @async
 * @param {string} op - Patch operation type, could be add, replace or remove
 * @param {string} key - Storage Config name
 * @param {StorageServer} value - Storage Config info, should be null when op is remove
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Object>} A promise to patch result.
 */
async function patchStorageConfig(op, key, value, config) {
  if (key === 'empty') {
    throw createError('Forbidden', 'ForbiddenKeyError', 'Key \'empty\' is system reserved and should not be modified!');
  }

  try {
    const request = axios.create(config.requestConfig);
    let configData = {
      op: op,
      path: `/data/${key}`,
    };
    if (value !== null) {
      let configInstance = Storage.createStorageConfig(value);
      configData.value = Buffer.from(JSON.stringify(configInstance)).toString(
        'base64'
      );
    }
    return await request.patch(
      `${config.namespace}/secrets/storage-config`,
      [configData],
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json-patch+json',
        },
      }
    );
  } catch (error) {
    if (error.response) {
      logger.debug(`Error when ${op} StorageConfig ${key}, please check.`);
      throw error.response;
    } else {
      throw error;
    }
  }
}

/**
 * @function createStorageServer - Create a Storage Server entry to kubernetes secrets.
 * @async
 * @param {string} key - Storage Server name
 * @param {StorageServer} value - Storage Server info
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Object>} A promise to patch result.
 */
async function createStorageServer(key, value, config) {
  return await patchStorageServer('add', key, value, config);
}

/**
 * @function createStorageConfig - Create a Storage Server entry to kubernetes secrets.
 * @async
 * @param {string} key - Storage config name
 * @param {StorageConfig} value - Storage config info
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Object>} A promise to patch result.
 */
async function createStorageConfig(key, value, config) {
  return await patchStorageConfig('add', key, value, config);
}

/**
 * @function updateStorageServer - Update a Storage Server entry to kubernetes secrets.
 * @async
 * @param {string} key - Stroage server name
 * @param {StorageServer} value - Stroage server info
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Object>} A promise to patch result.
 */
async function updateStorageServer(key, value, config) {
  return await patchStorageServer('replace', key, value, config);
}

/**
 * @function updateStorageConfig - Update a Storage Config entry to kubernetes secrets.
 * @async
 * @param {string} key - Stroage Config name
 * @param {StorageConfig} value - Stroage Config info
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Object>} A promise to patch result.
 */
async function updateStorageConfig(key, value, config) {
  return await patchStorageConfig('replace', key, value, config);
}

/**
 * @function removeStorageServer - Remove a Storage Server entry from kubernetes secrets.
 * @async
 * @param {string} key - Storage Server name
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Object>} A promise to patch result.
 */
async function removeStorageServer(key, config) {
  return await patchStorageServer('remove', key, null, config);
}

/**
 * @function removeStorageConfig - Remove a Storage Config entry from kubernetes secrets.
 * @async
 * @param {string} key - Storage Config name
 * @param {Config} config - Config for kubernetes APIServer. You could generate it from initConfig(apiServerUri, option).
 * @return {Promise<Object>} A promise to patch result.
 */
async function removeStorageConfig(key, config) {
  return await patchStorageConfig('remove', key, null, config);
}

module.exports = {
  initConfig,
  createStorageServer,
  createStorageConfig,
  readStorageServer,
  readStorageServers,
  readStorageConfig,
  readStorageConfigs,
  updateStorageServer,
  updateStorageConfig,
  removeStorageServer,
  removeStorageConfig,
};
