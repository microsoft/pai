'use strict';

const Joi = require('joi');
const httpContext = require('express-http-context');
const tokenConfig = require('@pai/config/token');


function getRequestHeaders() {
    const userToken = httpContext.get('token');
    const token = userToken || tokenConfig.adminMTToken;
    const headers = {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
    };
    return headers;
}

const sparkHistoryServerConfigSchema = Joi.object().keys({
    getRequestHeaders: Joi.func()
        .arity(0)
        .required(),
    applicationListPath: Joi.func()
        .arity(0)
        .required(),
    applicationPath: Joi.func()
        .arity(1)
        .required(),
});

let sparkHistoryServerConfig = {
    getRequestHeaders,
    applicationListPath: () => {
        return `${process.env.SPARK_HISTORY_SERVICE_URI}/api/v1/applications`;
    },
    applicationPath: (appId) => {
        return `${process.env.SPARK_HISTORY_SERVICE_URI}/api/v1/applications/${appId}`;
    },
};

const {error, value} = Joi.validate(sparkHistoryServerConfig, sparkHistoryServerConfigSchema);
if (error) {
    throw new Error(`Spark history server config error\n${error}`);
}
sparkHistoryServerConfig = value;

module.exports = {
    sparkHistoryServerConfig,
};
