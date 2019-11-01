// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


const assert = require('assert');
const {readFileSync} = require('fs');
const path = require('path');
const logger = require('@pai/config/logger');

const apiserverConfig = {};

const {
  K8S_APISERVER_URI,
  K8S_APISERVER_CA_FILE,
  K8S_APISERVER_TOKEN_FILE,
} = process.env;

if (process.env.RBAC_IN_CLUSTER === 'false') {
  apiserverConfig.uri = K8S_APISERVER_URI;
  // Should be empty
  if (K8S_APISERVER_CA_FILE) {
    // Will be a buffer since SSL context can receive a buffer.
    apiserverConfig.ca = readFileSync(K8S_APISERVER_CA_FILE, 'utf8');
  }
  if (K8S_APISERVER_TOKEN_FILE) {
    // Will be a string since http header can only receive a string.
    apiserverConfig.token = readFileSync(K8S_APISERVER_TOKEN_FILE, 'utf8');
  }
} else {
  const root = process.env.KUBERNETES_CLIENT_SERVICEACCOUNT_ROOT || '/var/run/secrets/kubernetes.io/serviceaccount/';
  // By default, in rbac enabled k8s, the caPath and tokenPath is a fixed value. However, from the perspective of flexibility,
  // user can custom the following 2 files' path in the future.
  const caPath = K8S_APISERVER_CA_FILE || path.join(root, 'ca.crt');
  const tokenPath = K8S_APISERVER_TOKEN_FILE || path.join(root, 'token');
  const host = process.env.KUBERNETES_SERVICE_HOST;
  const port = process.env.KUBERNETES_SERVICE_PORT;
  apiserverConfig.uri = `https://${host}:${port}`;

  try {
    // Will be a buffer since SSL context can receive a buffer.
    apiserverConfig.ca = readFileSync(caPath, 'utf8');
    // Will be a string since http header can only receive a string.
    apiserverConfig.token = readFileSync(tokenPath, 'utf8');
  } catch (error) {
    logger.error('failed to init rbac config. Please check your clusters\' config');
    throw error;
  }
}

assert(apiserverConfig.uri, 'K8S_APISERVER_URI should be set in environments');

module.exports = {
  apiserver: apiserverConfig,
};
