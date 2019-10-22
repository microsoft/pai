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
const ms = require('ms');
const uuid = require('uuid');
const {secret, tokenExpireTime} = require('@pai/config/token');
const k8sSecret = require('@pai/models/k8s-secret');
const {encrypt} = require('@pai/utils/manager/user/user');

const namespace = process.env.PAI_TOKEN_NAMESPACE || 'pai-user-token';

const sign = async (username, service, expiration) => {
  return new Promise((res, rej) => {
    jwt.sign({
      username,
      service,
    }, secret, {expiresIn: expiration}, (signError, token) => {
      signError ? rej(signError) : res(token);
    });
  });
};

const purge = async (data) => {
  const result = {};
  const ts = Date.now();
  for (const [id, val] of data) {
    if (ts < val.expiration) {
      result[id] = val;
    }
  }
  return result;
};

const apply = async (username, service = false, expiration) => {
  if (service) {
    expiration = expiration || undefined;
  } else {
    expiration = expiration || tokenExpireTime;
  }
  const token = await sign(username, service, expiration);
  const hash = encrypt(username, token);
  const id = uuid();
  let data = await k8sSecret.get(namespace, username);
  data = data || {};
  data[id] = {
    hash,
    service,
    timestamp: Date.now(),
    expiration: expiration && Date.now() + ms(expiration),
  };
  data = purge(data);
  await k8sSecret.replace(namespace, username, data);
};

const revoke = async (username, id) => {
  let data = await k8sSecret.get(namespace, username);
  if (!data) {
    // pass
    return;
  }
  delete data[id];
  data = purge(data);
  await k8sSecret.replace(namespace, username, data);
};

const check = async (username, token) => {
  const hash = encrypt(username, token);
  const data = await k8sSecret.get(namespace, username);
  const item = Object.values(data).findIndex((x) => x.hash === hash);
  await k8sSecret.replace(namespace, username, purge(data));
  if (item && jwt.verify(token, secret)) {
    return item;
  } else {
    return null;
  }
};

module.exports = {
  apply,
  revoke,
  check,
};
