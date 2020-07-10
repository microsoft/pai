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

const k8s = require('@kubernetes/client-node')
const logger = require('./logger')

const kc = new k8s.KubeConfig()

if (process.env.CUSTOM_K8S_API_SERVER_URL) {
  // For local debugging, one should set CUSTOM_K8S_API_SERVER_URL, CUSTOM_K8S_CA_FILE and CUSTOM_K8S_TOKEN_FILE.
  const cluster = {
    name: 'inCluster',
    caFile: process.env.CUSTOM_K8S_CA_FILE,
    server: process.env.CUSTOM_K8S_API_SERVER_URL,
    skipTLSVerify: false
  }
  const user = {
    name: 'inClusterUser',
    authProvider:
     {
       name: 'tokenFile',
       config:
        {
          tokenFile: process.env.CUSTOM_K8S_TOKEN_FILE
        }
     }
  }
  kc.loadFromClusterAndUser(cluster, user)
} else {
  // For in-cluster containers, load KubeConfig from default setting.
  kc.loadFromDefault()
}

// If api server reports a non-200 status code, the client will
// throw an error. In such case, error.name will be "HttpError",
// and error.response.statusCode is the actual status code.
// If network is disconnected, the error will be a different one,
// and you cannot get error.name and error.statusCode.
const customObjectsClient = kc.makeApiClient(k8s.CustomObjectsApi)

async function getFramework (name, namespace = 'default') {
  const res = await customObjectsClient.getNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
    name
  )
  return res.response
}

async function createFramework (frameworkDescription, namespace = 'default') {
  const res = await customObjectsClient.createNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
    frameworkDescription
  )
  return res.response
}

async function executeFramework (name, executionType, namespace = 'default') {
  const res = await customObjectsClient.patchNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
    name,
    {
      spec: {
        executionType: executionType
      }
    },
    { headers: { 'Content-Type': 'application/merge-patch+json' } }
  )
  return res.response
}

async function deleteFramework (name, namespace = 'default') {
  const res = await customObjectsClient.deleteNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
    name
  )
  return res.response
}

function getFrameworkInformer (timeoutSeconds = 86400, namespace = 'default') {
  /*
  Usage:

    const informer = getFrameworkInformer()
    informer.on('add', (obj) => { console.log(`Added: ${obj.metadata.name}`); });
    informer.on('update', (obj) => { console.log(`Updated: ${obj.metadata.name}`); });
    informer.on('delete', (obj) => { console.log(`Deleted: ${obj.metadata.name}`); });
    informer.on('error', (err) => { console.error(err);});
    informer.start();

  If the informer disconnects normally from API server, it will re-connect automatically.
  But during the reconnection, listFn will be called again, which is inefficient.
  According to https://github.com/kubernetes-client/javascript/blob/932c2fbc34db954c6ed397b3cd9ead08b2ff1d10/src/cache.ts#L82-L85,
  this behavior will be fixed in the future.
  TO DO: If @kubernetes/client-node fixes this issue, we should upgrade our code to use the new code.

  If the informer encounters any error, it will stop watching, and won't re-connect.
  One can restart it by informer.on('error', (err) => { informer.start(); }).

  */
  const listFn = () => {
    logger.info('Frameworks are listed.')
    return customObjectsClient.listNamespacedCustomObject(
      'frameworkcontroller.microsoft.com',
      'v1',
      namespace,
      'frameworks'
    )
  }
  const informer = k8s.makeInformer(
    kc,
    `/apis/frameworkcontroller.microsoft.com/v1/frameworks?timeoutSeconds=${timeoutSeconds}`,
    listFn
  )
  return informer
}

const priorityClassClient = kc.makeApiClient(k8s.SchedulingV1Api)

async function createPriorityClass (priorityClassDef) {
  const res = await priorityClassClient.createPriorityClass(priorityClassDef)
  return res.response
}

async function deletePriorityClass (name) {
  const res = await priorityClassClient.deletePriorityClass(name)
  return res.response
}

const coreV1Client = kc.makeApiClient(k8s.CoreV1Api)

async function createSecret (secretDef) {
  const res = await coreV1Client.createNamespacedSecret(secretDef.metadata.namespace, secretDef)
  return res
}

async function deleteSecret (name, namespace = 'default') {
  const res = await coreV1Client.deleteNamespacedSecret(name, namespace)
  return res.response
}

async function patchSecretOwnerToFramework (secret, framework) {
  const metadata = {
    ownerReferences: [{
      apiVersion: 'frameworkcontroller.microsoft.com',
      kind: 'Framework',
      name: framework.metadata.name,
      uid: framework.metadata.uid,
      controller: true,
      blockOwnerDeletion: true
    }]
  }
  const res = await coreV1Client.patchNamespacedSecret(
    secret.metadata.name, secret.metadata.namespace,
    { metadata: metadata },
    ...Array(4), // skip some parameters
    { headers: { 'Content-Type': 'application/merge-patch+json' } })
  return res.response
}



module.exports = {
  getFramework: getFramework,
  createFramework: createFramework,
  executeFramework: executeFramework,
  deleteFramework: deleteFramework,
  getFrameworkInformer: getFrameworkInformer,
  createPriorityClass: createPriorityClass,
  deletePriorityClass: deletePriorityClass,
  createSecret: createSecret,
  deleteSecret: deleteSecret,
  patchSecretOwnerToFramework: patchSecretOwnerToFramework
}
