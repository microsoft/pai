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

const Joi = require('joi')

const configSchema = Joi.object().keys({
  logLevel: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  k8sConnectionTimeoutSecond: Joi.number()
    .integer()
    .required(),
  writeMergerConnectionTimeoutSecond: Joi.number()
    .integer()
    .required(),
  customK8sApiServerURL: Joi.string()
    .uri()
    .optional(),
  customK8sCaFile: Joi.string()
    .optional(),
  customK8sTokenFile: Joi.string()
    .optional(),
  recoveryModeEnabled: Joi.boolean()
    .required(),
  rbacEnabled: Joi.boolean()
    .required()
}).required()

const config = {
  logLevel: process.env.LOG_LEVEL,
  k8sConnectionTimeoutSecond: parseInt(process.env.K8S_CONNECTION_TIMEOUT_SECOND),
  writeMergerConnectionTimeoutSecond: parseInt(process.env.WRITE_MERGER_CONNECTION_TIMEOUT_SECOND),
  customK8sApiServerURL: process.env.CUSTOM_K8S_API_SERVER_URL,
  customK8sCaFile: process.env.CUSTOM_K8S_CA_FILE,
  customK8sTokenFile: process.env.CUSTOM_K8S_TOKEN_FILE,
  recoveryModeEnabled: process.env.RECOVERY_MODE_ENABLED === 'true',
  rbacEnabled: process.env.RBAC_IN_CLUSTER === 'true'
}

const { error, value } = Joi.validate(config, configSchema)
if (error) {
  throw new Error(`Config error\n${error}`)
}

module.exports = value
