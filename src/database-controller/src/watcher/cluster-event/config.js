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
    maxRpcConcurrency: Joi.number()
      .integer()
      .required(),
    diskPath: Joi.string().required(),
    diskCheckIntervalSecond: Joi.number()
      .integer()
      .required(),
    maxDiskUsagePercent: Joi.number()
      .integer()
      .required(),
  })
  .required();

const config = {
  dbConnectionStr: process.env.DB_CONNECTION_STR,
  maxDatabaseConnection: parseInt(process.env.MAX_DB_CONNECTION),
  maxRpcConcurrency: parseInt(process.env.MAX_RPC_CONCURRENCY),
  diskPath: process.env.DISK_PATH,
  diskCheckIntervalSecond: 60,
  maxDiskUsagePercent: parseInt(process.env.MAX_DISK_USAGE_PERCENT),
};

const { error, value } = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = _.assign(basicConfig, value);
