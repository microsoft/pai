// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const Joi = require("joi");

const configSchema = Joi.object()
  .keys({
    logLevel: Joi.string()
      .valid("error", "warn", "info", "http", "verbose", "debug", "silly")
      .default("info"),
    dbConnectionStr: Joi.string().required(),
    maxDatabaseConnection: Joi.number().integer().required(),
    pollIntervalSecond: Joi.number().integer().required(),
    paiUri: Joi.string().uri().required(),
  })
  .required();

const config = {
  logLevel: process.env.LOG_LEVEL,
  dbConnectionStr: process.env.DB_CONNECTION_STR,
  maxDatabaseConnection: parseInt(process.env.MAX_DB_CONNECTION),
  pollIntervalSecond: parseInt(process.env.POLL_INTERVAL_SECOND),
  paiUri: process.env.PAI_URI,
};

const { error, value } = configSchema.validate(config);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = value;
