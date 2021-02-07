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

const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const { Op } = require('sequelize');
const { secret, tokenExpireTime } = require('@pai/config/token');
const k8sSecret = require('@pai/models/kubernetes/k8s-secret');
const k8sModel = require('@pai/models/kubernetes/kubernetes');
const logger = require('@pai/config/logger');
const databaseModel = require('@pai/utils/dbUtils');
const { encodeName } = require('@pai/models/v2/utils/name');

// job-specific tokens and other tokens are saved in different namespaces
const userTokenNamespace =
  process.env.PAI_USER_TOKEN_NAMESPACE || 'pai-user-token';
const jobTokenNamespace =
  process.env.PAI_JOB_TOKEN_NAMESPACE || 'pai-job-token';

// create namespace if not exists
if (process.env.NODE_ENV !== 'test') {
  k8sModel.createNamespace(userTokenNamespace);
  k8sModel.createNamespace(jobTokenNamespace);
}

const sign = async (username, application, expiration) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        username,
        application,
      },
      secret,
      expiration != null ? { expiresIn: expiration } : {},
      (signError, token) => {
        signError ? reject(signError) : resolve(token);
      },
    );
  });
};

/**
 * Remove invalid (expired/malformed) tokens from given token list object.
 * @param {Object} data - id -> token format data object (data stored in k8s secret)
 * @returns {Object} Purged data in the same format
 */
const purge = async (data, jobSpecific) => {
  const result = {};

  if (jobSpecific) {
    // get non-completed frameworks from db
    const frameworkNames = Object.keys(data);
    const names = await databaseModel.Framework.findAll({
      attributes: ['name'],
      where: {
        name: {
          [Op.in]: frameworkNames,
        },
        subState: {
          [Op.ne]: 'Completed',
        },
      },
    });
    // job-tokens of finished jobs will be removed
    data = Object.keys(data).reduce((filtered, key) => {
      if (names.indexOf(key) !== -1) {
        filtered[key] = data[key];
      }
      return filtered;
    }, {});
  }

  for (const [key, val] of Object.entries(data)) {
    try {
      // expired tokens will be removed
      jwt.verify(val, secret);
      result[key] = val;
    } catch (err) {
      // pass
    }
  }

  return result;
};

const list = async (username, jobSpecific = false) => {
  const namespace = jobSpecific ? jobTokenNamespace : userTokenNamespace;
  const tokens = await k8sSecret.get(namespace, username, { encode: 'hex' });
  if (tokens === null) {
    return {};
  }

  const purged = await purge(tokens, jobSpecific);
  if (Object.keys(tokens).length !== Object.keys(purged).length) {
    await k8sSecret.replace(namespace, username, purged, { encode: 'hex' });
  }
  return Object.values(purged);
};

const create = async (
  username,
  application = false,
  expiration = undefined,
  jobSpecific = false,
  frameworkName = '',
) => {
  // sign a token with jwt
  if (application) {
    expiration = expiration || undefined;
  } else {
    expiration = expiration || tokenExpireTime;
  }
  const token = await sign(username, application, expiration);
  const namespace = jobSpecific ? jobTokenNamespace : userTokenNamespace;
  const key = jobSpecific ? encodeName(frameworkName) : uuid();
  const item = await k8sSecret.get(namespace, username, { encode: 'hex' });
  if (item === null) {
    await k8sSecret.create(
      namespace,
      username,
      { [key]: token },
      { encode: 'hex' },
    );
  } else {
    const result = await purge(item, jobSpecific);
    result[key] = token;
    await k8sSecret.replace(namespace, username, result, { encode: 'hex' });
  }
  return token;
};

const revoke = async (token, jobSpecific = false) => {
  const namespace = jobSpecific ? jobTokenNamespace : userTokenNamespace;
  const payload = jwt.verify(token, secret);
  const username = payload.username;
  if (!username) {
    throw new Error('Token is invalid');
  }
  const item = await k8sSecret.get(namespace, username, { encode: 'hex' });
  if (item === null) {
    throw new Error('Token is invalid');
  }
  const result = await purge(item, jobSpecific);
  for (const [key, val] of Object.entries(result)) {
    if (val === token) {
      delete result[key];
    }
  }
  await k8sSecret.replace(namespace, username, result, { encode: 'hex' });
};

const batchRevoke = async (username, filter, jobSpecific = false) => {
  const namespace = jobSpecific ? jobTokenNamespace : userTokenNamespace;
  const item = await k8sSecret.get(namespace, username, { encode: 'hex' });
  const result = await purge(item || {}, jobSpecific);
  for (const [key, val] of Object.entries(result)) {
    if (filter(val)) {
      delete result[key];
    }
  }
  await k8sSecret.replace(namespace, username, result, { encode: 'hex' });
};

const verify = async (token) => {
  const payload = jwt.verify(token, secret);
  const username = payload.username;
  if (!username) {
    throw new Error('Token is invalid');
  }
  // both user tokens & job tokens are valid
  for (const namespace of [userTokenNamespace, jobTokenNamespace]) {
    const tokens = await k8sSecret.get(namespace, username, { encode: 'hex' });
    if (tokens === null) {
      continue;
    }
    const jobSpecific = Boolean(namespace === jobTokenNamespace);
    const tokensPurged = await purge(tokens, jobSpecific);
    for (const [, val] of Object.entries(tokensPurged)) {
      if (val === token) {
        logger.info('token verified');
        return payload;
      }
    }
    if (Object.keys(tokens).length !== Object.keys(tokensPurged).length) {
      await k8sSecret.replace(namespace, username, tokensPurged, {
        encode: 'hex',
      });
    }
  }
  throw new Error('The token has been revoked');
};

module.exports = {
  list,
  create,
  batchRevoke,
  revoke,
  verify,
};
