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
const {readFileSync} = require('fs');
const {Agent} = require('https');
const authnConfig = require('@pai/config/authn');

let userSecretConfig = {};

if (authnConfig.authnMethod !== 'OIDC') {
  userSecretConfig = {
    apiServerUri: process.env.K8S_APISERVER_URI,
    paiUserNameSpace: 'pai-user',
    adminName: process.env.DEFAULT_PAI_ADMIN_USERNAME,
    adminPass: process.env.DEFAULT_PAI_ADMIN_PASSWORD,
  };
} else {
  userSecretConfig = {
    apiServerUri: process.env.K8S_APISERVER_URI,
    paiUserNameSpace: 'pai-user',
  };
}

userSecretConfig.requestConfig = () => {
  const config = {
    baseURL: `${userSecretConfig.apiServerUri}/api/v1/namespaces/`,
    maxRedirects: 0,
  };
  if ('K8S_APISERVER_CA_FILE' in process.env) {
    const ca = readFileSync(process.env.K8S_APISERVER_CA_FILE);
    config.httpsAgent = new Agent({ca});
  }

  if ('K8S_APISERVER_TOKEN_FILE' in process.env) {
    const token = readFileSync(process.env.K8S_APISERVER_TOKEN_FILE, 'ascii');
    config.headers = {Authorization: `Bearer ${token}`};
  }
  return config;
};

let userSecretConfigSchema = {};
if (authnConfig.authnMethod !== 'OIDC') {
  userSecretConfigSchema = Joi.object().keys({
    apiServerUri: Joi.string()
      .required(),
    paiUserNameSpace: Joi.string()
      .default('pai-user'),
    adminName: Joi.string()
      .regex(/^[\w.-]+$/, 'username')
      .required(),
    adminPass: Joi.string()
      .min(6)
      .required(),
    requestConfig: Joi.func()
      .arity(0)
      .required(),
  }).required();
} else {
  userSecretConfigSchema = Joi.object().keys({
    apiServerUri: Joi.string()
      .required(),
    paiUserNameSpace: Joi.string()
      .default('pai-user'),
    requestConfig: Joi.func()
      .arity(0)
      .required(),
  }).required();
}

const {error, value} = Joi.validate(userSecretConfig, userSecretConfigSchema);
if (error) {
  throw new Error(`config error\n${error}`);
}
userSecretConfig = value;

module.exports = userSecretConfig;
