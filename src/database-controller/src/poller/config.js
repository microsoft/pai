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
    intervalSecond: Joi.number()
      .integer()
      .required(),
    writeMergerUrl: Joi.string()
      .uri()
      .required(),
    maxRpcConcurrency: Joi.number()
      .integer()
      .required(),
  })
  .required();

const config = {
  dbConnectionStr: process.env.DB_CONNECTION_STR,
  maxDatabaseConnection: parseInt(process.env.MAX_DB_CONNECTION),
  intervalSecond: parseInt(process.env.INTERVAL_SECOND),
  writeMergerUrl: process.env.WRITE_MERGER_URL,
  maxRpcConcurrency: parseInt(process.env.MAX_RPC_CONCURRENCY),
};

const { error, value } = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = _.assign(basicConfig, value);
