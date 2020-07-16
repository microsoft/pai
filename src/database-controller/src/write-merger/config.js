const basicConfig = require('@dbc/core/config')
const _ = require('lodash')
const Joi = require('joi');

const configSchema = Joi.object().keys({
  dbConnectionStr: Joi.string()
    .required(),
  maxDatabaseConnection: Joi.number()
    .integer()
    .required(),
  port: Joi.number()
    .integer()
    .required(),
  recoveryModeEnabled:  Joi.boolean()
    .required(),
}).required();


config = {
  dbConnectionStr: process.env.DB_CONNECTION_STR,
  maxDatabaseConnection: parseInt(process.env.MAX_DB_CONNECTION),
  port: parseInt(process.env.PORT),
  recoveryModeEnabled: process.env.RECOVERY_MODE_ENABLED === 'true',
}

const {error, value} = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = _.assign(basicConfig, value)
