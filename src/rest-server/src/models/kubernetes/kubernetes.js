// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const axios = require('axios');
const { Agent } = require('https');
const { URL } = require('url');
const { apiserver } = require('@pai/config/kubernetes');
const status = require('statuses');
const logger = require('@pai/config/logger');

const patchOption = {
  headers: {
    'Content-Type': 'application/merge-patch+json',
  },
};

const rethrowResponseError = (error) => {
  let message = error.message;
  const response = error.response;
  const request = error.request;
  if (request && request.path) {
    message = message + ` Url: ${request.path}`;
  }
  if (response && response.data && response.data.message) {
    message = message + ` Response message: ${response.data.message}`;
  }
  error.message = message;
  return Promise.reject(error);
};

const getClient = (baseURL = '') => {
  const config = {
    baseURL: new URL(baseURL, apiserver.uri).toString(),
    maxRedirects: 0,
    headers: {
      Accept: 'application/json',
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
  const client = axios.create(config);
  client.interceptors.response.use((resp) => resp, rethrowResponseError);
  return client;
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

const getPods = async (options = {}, headers = {}) => {
  const { namespace, ...params } = options;
  const client = getClient();

  let url = '/api/v1/pods';
  if (namespace) {
    url = `/api/v1/namespaces/${namespace}/pods`;
  }
  const res = await client.get(url, { params, headers });
  return res.data;
};

module.exports = {
  getClient,
  encodeSelector,
  createNamespace,
  getNodes,
  getPods,
  patchOption,
};
