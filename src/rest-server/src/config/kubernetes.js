const assert = require('assert');
const {readFileSync} = require('fs');
const config = Object.create(null);
const apiserverConfig = config.apiserver = Object.create(null);

const {
  K8S_APISERVER_URI,
  K8S_APISERVER_CA_FILE,
  K8S_APISERVER_TOKEN_FILE,
} = process.env;

apiserverConfig.uri = K8S_APISERVER_URI;

if (K8S_APISERVER_CA_FILE) {
  // Will be a buffer since SSL context can receive a buffer.
  apiserverConfig.ca = readFileSync(K8S_APISERVER_CA_FILE);
}
if (K8S_APISERVER_TOKEN_FILE) {
  // Will be a string since http header can only receive a string.
  apiserverConfig.token = readFileSync(K8S_APISERVER_TOKEN_FILE, 'ascii');
}

assert(apiserverConfig.uri, 'K8S_APISERVER_URI should be set in environments');

module.exports = config;
