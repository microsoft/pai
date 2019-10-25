// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the 'Software'), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const jwt = require('jsonwebtoken');
const nock = require('nock');

const groupTemplate = path.join(__dirname, '../data/nock/group-template.yaml');
const userTemplate = path.join(__dirname, '../data/nock/user-template.yaml');

const encrypt = (username, password) => {
  const iterations = 10000;
  const keylen = 64;
  const salt = crypto.createHash('md5').update(username).digest('hex');
  return crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha512').toString('hex');
};

/**
 * @param {Object} data - user info.
 * @param {string} data.username
 * @param {string} data.password
 * @param {string[]} data.grouplist
 */
const getUserPayload = (data = {}) => {
  const payload = yaml.safeLoad(fs.readFileSync(userTemplate));
  const username = data.username || 'admin';
  const password = data.password || 'default_password';
  const grouplist = data.grouplist || [];
  payload.metadata.name = Buffer.from(username).toString('hex');
  payload.data.username = Buffer.from(username).toString('base64');
  payload.data.password = Buffer.from(encrypt(username, password)).toString('base64');
  payload.data.grouplist = Buffer.from(JSON.stringify(grouplist)).toString('base64');
  return payload;
};

/**
 * @param {Object} data - group info.
 * @param {string} data.groupname
 * @param {boolean} data.admin
 * @param {string[]} data.virtualClusters
 */
const getGroupPayload = (data = {}) => {
  const payload = yaml.safeLoad(fs.readFileSync(groupTemplate));
  const groupname = data.groupname || 'admin';
  const admin = data.admin || false;
  const virtualClusters = data.virtualClusters || [];
  payload.metadata.name = Buffer.from(groupname).toString('hex');
  payload.data.groupname = Buffer.from(groupname).toString('base64');
  payload.data.extension = Buffer.from(JSON.stringify({
    acls: {
      admin,
      virtualClusters,
    },
  })).toString('base64');
  return payload;
};

/**
 * @param {Object} nock - nock client.
 * @param {Object} data - user info.
 * @param {string} data.username
 * @param {string} data.password
 * @param {string[]} data.grouplist
 */
const registerUser = (data = {}) => {
  const payload = getUserPayload(data);
  nock(apiServerRootUri)
    .get(`/api/v1/namespaces/pai-user-v2/secrets/${payload.metadata.name}`)
    .reply(200, payload);
};

/**
 * @param {Object} data - group info.
 * @param {string} data.groupname
 * @param {boolean} data.admin
 * @param {string[]} data.virtualClusters
 */
const registerGroup = (data = {}) => {
  const payload = getGroupPayload(data);
  nock(apiServerRootUri)
    .get(`/api/v1/namespaces/pai-group/secrets/${payload.metadata.name}`)
    .reply(200, payload);
};

const registerToken = (username, tokens) => {
  const data = {};
  for (const [idx, token] of tokens.entries()) {
    data[idx] = Buffer.from(token).toString('base64');
  }
  nock(apiServerRootUri)
    .get(`/api/v1/namespaces/pai-user-token/secrets/${Buffer.from(username).toString('hex')}`)
    .reply(200, {
      data,
    });
};

/**
 * @param {string} username
 * @param {Object} options
 * @param {string} options.password
 * @param {boolean} options.application - application token flag.
 * @param {(string|number)} options.expiresIn
 */
const registerUserTokenCheck = (username, options={}) => {
  const password = options.password || 'default_password';
  const expiresIn = options.expiresIn || 60;
  const application = options.application || false;
  registerUser({username, password});
  const token = jwt.sign({username, application}, process.env.JWT_SECRET, {expiresIn});
  registerToken(username, [token]);
  return token;
};

/**
 * @param {string} username
 * @param {Object} options
 * @param {string} options.password
 * @param {boolean} options.application - application token flag.
 * @param {(string|number)} options.expiresIn
 */
const registerAdminTokenCheck = (username, options={}) => {
  const password = options.password || 'default_password';
  const expiresIn = options.expiresIn || 60;
  const application = options.application || false;
  registerUser({username, password, grouplist: ['adminGroup']});
  registerGroup({groupname: 'adminGroup', admin: true});
  const token = jwt.sign({username, application}, process.env.JWT_SECRET, {expiresIn});
  registerToken(username, [token]);
  return token;
};

module.exports = {
  getUserPayload,
  getGroupPayload,
  registerUser,
  registerGroup,
  registerToken,
  registerAdminTokenCheck,
  registerUserTokenCheck,
};
