const assert = require('assert');
const config = Object.create(null);
const apiserverConfig = config.apiserver = Object.create(null);

const {
  K8S_APISERVER_URI,
} = process.env;

apiserverConfig.uri = K8S_APISERVER_URI;

assert(apiserverConfig.uri, 'K8S_APISERVER_URI should be set in environments');

module.exports = config;
