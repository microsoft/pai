// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const axios = require('axios');
const {Agent} = require('https');
const {URL} = require('url');
const {apiserver} = require('@pai/config/kubernetes');
const status = require('statuses');
const createError = require('@pai/utils/error');
const logger = require('@pai/config/logger');

const patchOption = {
  headers: {
    'Content-Type': 'application/merge-patch+json',
  },
};

const rethrowResponseError = (error) => {
  const response = error.response;
  if (response != null) { // check null and undefined
    return Promise.reject(createError(response.status, 'UnknownError', response.data.message));
  } else {
    return Promise.reject(error);
  }
};

const getClient = (baseURL = '') => {
  const config = {
    baseURL: new URL(baseURL, apiserver.uri).toString(),
    maxRedirects: 0,
    headers: {
      'Accept': 'application/json',
    },
  };
  if (apiserver.ca || apiserver.cert || apiserver.key) {
    config.httpsAgent = new Agent({
      ca: apiserver.ca,
      cert: apiserver.cert,
      key: apiserver.key,
    });
  }
  if (apiserver.headers) {
    config.headers = {
      ...apiserver.headers,
      ...config.headers,
    };
  }
  return axios.create(config);
};

const encodeSelector = (selector = {}, negativeSelector = {}) => {
  const builder = [];
  for (const [key, val] of Object.entries(selector)) {
    builder.push(`${key}=${val}`);
  }
  for (const [key, val] of Object.entries(negativeSelector)) {
    builder.push(`${key}!=${val}`);
  }
  return builder.join(',');
};

const createNamespace = async (namespace) => {
  const client = getClient();
  try {
    await client.post('/api/v1/namespaces/', {
      metadata: {
        name: namespace,
      },
    });
    logger.info(`Namespace ${namespace} created`);
  } catch (err) {
    if (
      err.response &&
      err.response.status === status('Conflict') &&
      err.response.data.reason === 'AlreadyExists'
    ) {
      logger.info(`Namespace ${namespace} already exists`);
      // pass
    } else {
      throw err;
    }
  }
};

const getNodes = async () => {
  const client = getClient();
  const res = await client.get('api/v1/nodes');
  return res.data;
};

const getPods = async (options = {}) => {
  const {labelSelector, negativeLabelSelector, namespace} = options;
  const client = getClient();
  const labelSelectorStr = encodeSelector(labelSelector, negativeLabelSelector);
  const requestOptions = {};
  if (labelSelectorStr) {
    requestOptions.params = {
      labelSelector: labelSelectorStr,
    };
  }
  let url = '/api/v1/pods';
  if (namespace) {
    url = `/api/v1/namespaces/${namespace}/pods`;
  }
  const res = await client.get(url, requestOptions);
  return res.data;
};

const createSecret = async (namespace, name, data, type) => {
  const client = getClient();
  const url = `/api/v1/namespaces/${namespace}/secrets`;
  client.interceptors.response.use((resp) => resp, rethrowResponseError);
  return await client.post(url, {
    metadata: {
      name: name,
      namespace: namespace,
    },
    data: data,
    type: type,
  });
};

const deleteSecret = async (namespace, name) => {
  const client = getClient();
  const url = `/api/v1/namespaces/${namespace}/secrets/${name}`;
  client.interceptors.response.use((resp) => resp, rethrowResponseError);
  await client.delete(url);
};

const patchSecret = async (namespace, name, data) => {
  const client = getClient();
  const url = `/api/v1/namespaces/${namespace}/secrets/${name}`;
  client.interceptors.response.use((resp) => resp, rethrowResponseError);
  await client.patch(url, data, patchOption);
};

module.exports = {
  getClient,
  encodeSelector,
  createNamespace,
  getNodes,
  getPods,
  createSecret,
  deleteSecret,
  patchSecret,
};
