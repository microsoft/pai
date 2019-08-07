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
const yaml = require('js-yaml');
const fs = require('fs');
const logger = require('@pai/config/logger');
const axios = require('axios');

let authnConfig = {
  authnMethod: process.env.AUTHN_METHOD,
  OIDCConfig: undefined,
  groupConfig: undefined,
};

if (authnConfig.authnMethod === 'OIDC') {
  const initOIDCEndpointAndGroupUrl = async () => {
    try {
      const response = await axios.get(authnConfig.OIDCConfig.wellKnownURL);
      authnConfig.OIDCConfig.authorization_endpoint = response.data.authorization_endpoint;
      authnConfig.OIDCConfig.token_endpoint = response.data.token_endpoint;
      authnConfig.OIDCConfig.msgraph_host = response.data.msgraph_host;
    } catch (error) {
      logger.error('Failed to init OIDC endpoint and graph resource.');
      // eslint-disable-next-line no-console
      console.log(error);
    }
  };

  let odicConfigPath = '/auth-configuration/oidc.yaml';
  if (process.env.OIDC_CONFIG_PATH) {
    odicConfigPath = process.env.OIDC_CONFIG_PATH;
  }
  authnConfig.OIDCConfig = yaml.safeLoad(fs.readFileSync(odicConfigPath, 'utf8'));
  (async function() {
    await initOIDCEndpointAndGroupUrl();
  })();
}

try {
  let groupConfigPath = '/group-configuration/group.yaml';
  if (process.env.GROUP_CONFIG_PATH) {
    groupConfigPath = process.env.GROUP_CONFIG_PATH;
  }
  authnConfig.groupConfig = yaml.safeLoad(fs.readFileSync(groupConfigPath, 'utf8'));
} catch (error) {
  logger.error('Failed to load group config from configmap file.');
  throw error;
}

// define the schema for authn
const authnSchema = Joi.object().keys({
  authnMethod: Joi.string().empty('')
    .valid('OIDC', 'basic'),
  OIDCConfig: Joi.object().pattern(/\w+/, Joi.required()),
  groupConfig: Joi.object().pattern(/\w+/, Joi.required()),
}).required();


const {error, value} = Joi.validate(authnConfig, authnSchema);
if (error) {
  throw new Error(`config error\n${error}`);
}
authnConfig = value;

module.exports = authnConfig;
