// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const Joi = require('joi');

const configSchema = Joi.object()
  .keys({
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
    customK8sCaFile: Joi.string().optional(),
    customK8sTokenFile: Joi.string().optional(),
    retainModeEnabled: Joi.boolean().required(),
    rbacEnabled: Joi.boolean().required(),
  })
  .required();

const config = {
  logLevel: process.env.LOG_LEVEL,
  k8sConnectionTimeoutSecond: parseInt(
    process.env.K8S_CONNECTION_TIMEOUT_SECOND,
  ),
  writeMergerConnectionTimeoutSecond: parseInt(
    process.env.WRITE_MERGER_CONNECTION_TIMEOUT_SECOND,
  ),
  customK8sApiServerURL: process.env.CUSTOM_K8S_API_SERVER_URL,
  customK8sCaFile: process.env.CUSTOM_K8S_CA_FILE,
  customK8sTokenFile: process.env.CUSTOM_K8S_TOKEN_FILE,
  retainModeEnabled: process.env.RETAIN_MODE_ENABLED === 'true',
  rbacEnabled: process.env.RBAC_IN_CLUSTER === 'true',
};

const { error, value } = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = value;
