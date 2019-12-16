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

const Client = require('kubernetes-client').Client
const Request = require('kubernetes-client/backends/request')
const JSONStream = require('json-stream')

class K8SClient {
  constructor (k8sConfig) {
    this.apiServerConfig = k8sConfig.apiServer
    this.timeoutSeconds = k8sConfig.timeoutSeconds
  }

  async init () {
    const backend = new Request(this.apiServerConfig)
    const client = new Client({ backend })
    await client.loadSpec()
    // If "frameworkcontroller.microsoft.com" is not found, try to load it from crd.
    if (client.apis['frameworkcontroller.microsoft.com'] === undefined) {
      const frameworkDef = await client.apis['apiextensions.k8s.io'].v1beta1.customresourcedefinitions('frameworks.frameworkcontroller.microsoft.com').get()
      client.addCustomResourceDefinition(frameworkDef.body)
    }
    this.client = client
  }

  async listUsers () {
    const userSecrets = await this.client.api.v1.namespaces('pai-user-v2').secrets().get(
      { qs: { timeoutSeconds: this.timeoutSeconds } }
    )
    return userSecrets.body
  }

  async watchUsers (dataCallback = (data => console.log(JSON.stringify(data)))) {
    const userSecrets = await this.listUsers()
    const resourceVersion = userSecrets.metadata.resourceVersion
    const stream = this.client.api.v1.watch.namespaces('pai-user-v2').secrets.getStream(
      { qs: { resourceVersion: resourceVersion, timeoutSeconds: Number.MAX_SAFE_INTEGER } }
    )
    const jsonStream = new JSONStream()
    stream.pipe(jsonStream)
    jsonStream.on('data', dataCallback)
  }

  async listFrameworks () {
    const frameworks = await this.client.apis['frameworkcontroller.microsoft.com'].v1.namespaces('default').frameworks().get(
      { qs: { timeoutSeconds: this.timeoutSeconds } }
    )
    return frameworks.body
  }

  async watchFrameworks (dataCallback = (data => console.log(JSON.stringify(data)))) {
    const frameworks = await this.listFrameworks()
    const resourceVersion = frameworks.metadata.resourceVersion
    const stream = this.client.apis['frameworkcontroller.microsoft.com'].v1.watch.namespaces('default').frameworks.getStream(
      { qs: { resourceVersion: resourceVersion, timeoutSeconds: Number.MAX_SAFE_INTEGER } }
    )
    const jsonStream = new JSONStream()
    stream.pipe(jsonStream)
    jsonStream.on('data', dataCallback)
  }
}

module.exports = K8SClient
