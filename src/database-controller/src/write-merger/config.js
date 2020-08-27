// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const basicConfig = require('@dbc/common/config');
const _ = require('lodash');
const Joi = require('joi');

const configSchema = Joi.object()
  .keys({
    dbConnectionStr: Joi.string().required(),
    maxDatabaseConnection: Joi.number()
      .integer()
      .required(),
    bodyLimit: Joi.string().default('100mb'),
    port: Joi.number()
      .integer()
      .required(),
    maxRpcConcurrency: Joi.number()
      .integer()
      .required(),
  })
  .required();

const config = {
  dbConnectionStr: process.env.DB_CONNECTION_STR,
  maxDatabaseConnection: parseInt(process.env.MAX_DB_CONNECTION),
  port: parseInt(process.env.PORT),
  maxRpcConcurrency: parseInt(process.env.MAX_RPC_CONCURRENCY),
};

const { error, value } = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = _.assign(basicConfig, value);
