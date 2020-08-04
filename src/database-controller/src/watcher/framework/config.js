// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const basicConfig = require('@dbc/core/config');
const _ = require('lodash');
const Joi = require('joi');

const configSchema = Joi.object()
  .keys({
    writeMergerUrl: Joi.string()
      .uri()
      .required(),
  })
  .required();

const config = {
  writeMergerUrl: process.env.WRITE_MERGER_URL,
};

const { error, value } = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = _.assign(basicConfig, value);
