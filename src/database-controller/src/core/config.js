const Joi = require('joi');

const configSchema = Joi.object().keys({
  k8sConnectionTimeoutSecond: Joi.number()
    .integer()
    .required(),
  databaseConnectionTimeoutSecond: Joi.number()
    .integer()
    .required(),
  writeMergerConnectionTimeoutSecond: Joi.number()
    .integer()
    .required(),
  customK8sApiServerURL: Joi.string()
    .uri()
    .optional(),
  customK8sCaFile: Joi.string()
    .uri()
    .optional(),
  customK8sTokenFile: Joi.string()
    .uri()
    .optional()
}).required();


config = {
  k8sConnectionTimeoutSecond: parseInt(process.env.K8S_CONNECTION_TIMEOUT_SECOND),
  databaseConnectionTimeoutSecond: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT_SECOND),
  writeMergerConnectionTimeoutSecond: parseInt(process.env.WRITE_MERGER_CONNECTION_TIMEOUT_SECOND),
  customK8sApiServerURL: process.env.CUSTOM_K8S_API_SERVER_URL,
  customK8sCaFile: process.env.CUSTOM_K8S_CA_FILE,
  customK8sTokenFile: process.env.CUSTOM_K8S_TOKEN_FILE,

}


const {error, value} = Joi.validate(config, configSchema);
if (error) {
  throw new Error(`Config error\n${error}`);
}

module.exports = value
