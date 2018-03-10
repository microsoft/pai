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


// module dependencies
const Joi = require('joi');
const user = require('../models/user');
const indexConfig = require('./index');
const logger = require('../config/logger');

let etcdConfig = {
  etcdUri: process.env.ETCD_URI,
  adminName: process.env.ETCD_ADMIN,
  adminPass: process.env.ETCD_PASSWORD
};

etcdConfig.etcdHosts = etcdConfig.etcdUri.split(",")

etcdConfig.storagePath = () => {
  return `/v2/keys/users/`;
};

etcdConfig.userPath = (username) => {
  return `/v2/keys/users/${username}`;
};

etcdConfig.userPasswdPath = (username) => {
  return `/v2/keys/users/${username}/passwd`;
};

etcdConfig.userAdminPath = (username) => {
  return `/v2/keys/users/${username}/admin`;
};

const etcdConfigSchema = Joi.object().keys({
  etcdUri: Joi.string()
    .required(),
  etcdHosts: Joi.array().items(Joi.string()
    .uri()
    .required()
    ).required(),
  adminName: Joi.string()
    .token()
    .required(),
  adminPass: Joi.string()
    .min(6)
    .required(),
  storagePath: Joi.func()
    .arity(0)
    .required(),
  userPath: Joi.func()
    .arity(1)
    .required(),
  userPasswdPath: Joi.func()
    .arity(1)
    .required(),
  userAdminPath: Joi.func()
    .arity(1)
    .required()
}).required();

const { error, value } = Joi.validate(etcdConfig, etcdConfigSchema);
if (error) {
  throw new Error(`config error\n${error}`);
}
etcdConfig = value;

// module exports
module.exports = etcdConfig;