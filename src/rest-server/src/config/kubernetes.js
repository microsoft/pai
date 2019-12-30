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
const k8s = require('@kubernetes/client-node');
const logger = require('@pai/config/logger');

const bufferFromFileOrData = (path, data) => {
  if (path) {
    return readFileSync(path);
  } else if (data) {
    return Buffer.from(data, 'base64');
  }
};

const apiserverConfig = {};

const {
  K8S_APISERVER_URI,
  K8S_APISERVER_CA_FILE,
  K8S_APISERVER_TOKEN_FILE,
  K8S_KUBECONFIG_PATH,
  RBAC_IN_CLUSTER,
} = process.env;

if (RBAC_IN_CLUSTER === 'false') {
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
  if (K8S_APISERVER_CA_FILE) {
    k8s.Config.SERVICEACCOUNT_CA_PATH = K8S_APISERVER_CA_FILE;
  }
  if (K8S_APISERVER_TOKEN_FILE) {
    // Will be a string since http header can only receive a string.
    k8s.Config.SERVICEACCOUNT_TOKEN_PATH = K8S_APISERVER_TOKEN_FILE;
  }
  try {
    const kc = new k8s.KubeConfig();
    if (K8S_KUBECONFIG_PATH) {
      kc.loadFromFile(K8S_KUBECONFIG_PATH);
    } else {
      kc.loadFromDefault();
    }
    const cluster = kc.getCurrentCluster();
    const user = kc.getCurrentUser();
    apiserverConfig.uri = cluster.server;
    apiserverConfig.token = user.token;
    apiserverConfig.ca = bufferFromFileOrData(cluster.caFile, cluster.caData);
    apiserverConfig.key = bufferFromFileOrData(user.keyFile, user.keyData);
    apiserverConfig.cert = bufferFromFileOrData(user.certFile, user.certData);
  } catch (error) {
    logger.error('failed to init rbac config. Please check your clusters\' config');
    throw error;
  }
}

assert(apiserverConfig.uri, 'K8S_APISERVER_URI should be set in environments');

module.exports = {
  apiserver: apiserverConfig,
};
