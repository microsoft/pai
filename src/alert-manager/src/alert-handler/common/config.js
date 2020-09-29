// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const Joi = require('joi');

const configSchema = Joi.object()
  .keys({
    logLevel: Joi.string()
      .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
      .default('info'),
  })
  .required();

const config = {
  logLevel: process.env.LOG_LEVEL,
};

const { error, value } = configSchema.validate(config);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = value;
