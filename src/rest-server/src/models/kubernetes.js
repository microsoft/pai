// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

const axios = require('axios');
const {Agent} = require('https');
const {URL} = require('url');
const {apiserver} = require('@pai/config/kubernetes');
const logger = require('@pai/config/logger');

const getClient = (baseURL = '') => {
  const config = {
    baseURL: new URL(baseURL, apiserver.uri).toString(),
    maxRedirects: 0,
    headers: {
      'Accept': 'application/json',
    },
  };
  if (apiserver.ca) {
    config.httpsAgent = new Agent({ca: apiserver.ca, cert: apiserver.cert, key: apiserver.key});
  }
  if (apiserver.token) {
    config.headers['Authorization'] = `Bearer ${apiserver.token}`;
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
    logger.info('Token secret namespace created');
  } catch (err) {
    if (err.response && err.response.status === 409 && err.response.data.reason === 'AlreadyExists') {
      logger.info('Token secret namespace already exists');
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

module.exports = {
  getClient,
  encodeSelector,
  createNamespace,
  getNodes,
  getPods,
};
