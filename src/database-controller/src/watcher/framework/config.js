// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const basicConfig = require('@dbc/common/config');
const _ = require('lodash');
const Joi = require('joi');

const configSchema = Joi.object()
  .keys({
    writeMergerUrl: Joi.string()
      .uri()
      .required(),
    maxRpcConcurrency: Joi.number()
      .integer()
      .required(),
    watchTimeoutSeconds: Joi.number()
      .integer()
      .required(),
  })
  .required();

const config = {
  writeMergerUrl: process.env.WRITE_MERGER_URL,
  maxRpcConcurrency: parseInt(process.env.MAX_RPC_CONCURRENCY),
  watchTimeoutSeconds: parseInt(process.env.WATCH_TIMEOUT_SECONDS),
};

const { error, value } = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = _.assign(basicConfig, value);
