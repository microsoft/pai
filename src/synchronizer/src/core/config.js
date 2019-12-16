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

const Request = require('kubernetes-client/backends/request')
const { readFileSync } = require('fs')

function buildApiServerConfig () {
  let apiServerConfig = {}
  if (process.env.RBAC_IN_CLUSTER === 'false') {
    // If rbac is not enabled, read the config from environmental variables.
    const {
      K8S_APISERVER_URI,
      K8S_APISERVER_CA_FILE,
      K8S_APISERVER_TOKEN_FILE
    } = process.env
    apiServerConfig.url = K8S_APISERVER_URI
    if (K8S_APISERVER_CA_FILE) {
      apiServerConfig.ca = readFileSync(K8S_APISERVER_CA_FILE, 'utf8')
    }
    if (K8S_APISERVER_TOKEN_FILE) {
      apiServerConfig.auth = { bearer: readFileSync(K8S_APISERVER_TOKEN_FILE, 'utf8') }
    }
  } else {
    // If rbac is enabled, load the config from cluster directly.
    apiServerConfig = Request.config.getInCluster()
  }
  return apiServerConfig
}

module.exports = {
  k8sConfig: {
    apiServer: buildApiServerConfig(),
    timeoutSeconds: parseInt(process.env.K8S_TIMEOUT_SECONDS)
  },
  dbConfig: {
    connectionStr: process.env.DB_CONNECTION_STR,
    dbMaxConnection: parseInt(process.env.DB_MAX_CONNECTION)
  },
  listIntervalSeconds: process.env.LIST_INTERVAL_SECONDS ? parseInt(process.env.LIST_INTERVAL_SECONDS) : 300
}
