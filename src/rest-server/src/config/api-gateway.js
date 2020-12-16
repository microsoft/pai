'use strict';

const Joi = require('joi');
const config = require('@pai/config');


const PORT_MAP = {
    RestServer: process.env.RESTSERVER_AGI_PORT,
    LoginServer: process.env.LOGINSERVER_AGI_PORT,
};

function getApiGatewayBaseUrl(port) {
    const {error, value} = Joi.number().min(0).max(65536).validate(port);
    if (error) {
        throw new Error(`Invalid port: ${error}`);
    }
    return `https://${config.apiGatewayDomainName}:${value}`;
}

module.exports = {
    RestServer: getApiGatewayBaseUrl(PORT_MAP.RestServer),
    LoginServer: getApiGatewayBaseUrl(PORT_MAP.LoginServer),
};
