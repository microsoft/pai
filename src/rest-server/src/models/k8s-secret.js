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

const axios = require('axios');
const _ = require('lodash');
const {Agent} = require('https');

const {apiserver} = require('@pai/config/kubernetes');

const initClient = (namespace) => {
  if (!namespace) {
    throw new Error('K8S SECRET: invalid namespace');
  }
  return axios.create({
      baseURL: new URL(`/api/v1/namespaces/${namespace}/secrets`, apiserver.uri),
      httpsAgent: apiserver.ca ? new Agent({ca: apiserver.ca}) : null,
      maxRedirects: 0,
      headers: {
        'Accept': 'application/json',
        'Authorization': apiserver.token ? {Authorization: `Bearer ${apiserver.token}`} : undefined,
      },
  });
};

const serialize = (object) => {
  if (object == null) {
    return null;
  }

  for (const [key, val] of Object.entries(object)) {
    object[key] = Buffer.from(val).toString('base64');
  }
  return Object.entries(object);
};


const deserialize = (object) => {
  if (object == null) {
    return null;
  }

  for (const [key, val] of Object.entries(object)) {
    object[key] = Buffer.from(val, 'base64').toString();
  }
  return Object.entries(object);
};

const get = async (namespace, key) => {
  if (!key) {
    return list(namespace);
  }
  const client = initClient(namespace);
  const hexKey = Buffer.from(key).toString('hex');

  try {
    const response = await client.get(`/${hexKey}`);
    return deserialize(response.data.data);
  } catch (err) {
    if (err.response && err.response.status === 404 && err.response.data) {
      return null;
    } else {
      throw err;
    }
  }
};

const list = async (namespace, labelSelector) => {
  const client = initClient(namespace);
  let continueValue = null;
  let result = [];
  do {
    if (continueValue === null) {
      result = [];
    }
    let response;
    try {
      response = await client.get('/', {
        params: {
          labelSelector,
        },
      });
    } catch (err) {
      if (err.response.status === 410) {
        continueValue = null;
        continue;
      } else {
        throw err;
      }
    }
    continueValue = response.metadata && response.metadata.continue;
    const items = _.get(response, 'data.data.items') || [];
    result.push(...items);
  } while (continueValue !== undefined);

  const output = {};
  for (const item of result) {
    output[item.metadata.name] = deserialize(item.data);
  }
  return output;
};

const create = async (namespace, key, data, labels) => {
  const client = initClient(namespace);
  const hexKey = Buffer.from(key).toString('hex');

  const response = await client.post('/', {
    data: {
      metadata: {
        name: hexKey,
        labels,
      },
      data: serialize(data),
    },
  });

  return response.data;
};

const replace = async (namespace, key, data, labels) => {
  const client = initClient(namespace);
  const hexKey = Buffer.from(key).toString('hex');

  const response = await client.put(`/${hexKey}`, {
    data: {
      metadata: {
        name: hexKey,
        labels,
      },
      data: serialize(data),
    },
  });

  return response.data;
};

const remove = async (namespace, key) => {
  const client = initClient(namespace);
  const hexKey = Buffer.from(key).toString('hex');

  await client.delete(`/${hexKey}`);
};

module.exports = {
  createClient: initClient,
  get,
  list,
  create,
  replace,
  remove,
};
