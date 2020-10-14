// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const k8s = require('@kubernetes/client-node');
const logger = require('./logger');
const config = require('./config');
const { timeoutDecorator } = require('./util');
const kc = new k8s.KubeConfig();

if (config.rbacEnabled) {
  // If RBAC is enabled, we can use kc.loadFromDefault() to load k8s config in containers.
  // For local debugging purpose, one can set CUSTOM_K8S_API_SERVER_URL, CUSTOM_K8S_CA_FILE and CUSTOM_K8S_TOKEN_FILE,
  // to connect to RBAC k8s cluster. Ca and Token file should be from a valid service account.
  if (config.customK8sApiServerURL) {
    const cluster = {
      name: 'inCluster',
      caFile: config.customK8sCaFile,
      server: config.customK8sApiServerURL,
      skipTLSVerify: false,
    };
    const user = {
      name: 'inClusterUser',
      authProvider: {
        name: 'tokenFile',
        config: {
          tokenFile: config.customK8sTokenFile,
        },
      },
    };
    kc.loadFromClusterAndUser(cluster, user);
  } else {
    kc.loadFromDefault();
  }
} else {
  // If RBAC is not enabled, use CUSTOM_K8S_API_SERVER_URL to connect to API server.
  const cluster = { name: 'cluster', server: config.customK8sApiServerURL };
  const user = { name: 'user' };
  kc.loadFromClusterAndUser(cluster, user);
}

// If API server reports a non-200 status code, the client will
// throw an error. In such case, error.name will be "HttpError",
// and error.response.statusCode is the actual status code.
// If network is disconnected, the error will be a different one,
// and you cannot get error.name and error.statusCode.
const customObjectsClient = kc.makeApiClient(k8s.CustomObjectsApi);

async function getFramework(name, namespace = 'default') {
  const res = await customObjectsClient.getNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
    name,
  );
  return res.response;
}

async function listFramework(name, namespace = 'default') {
  const res = await customObjectsClient.listNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
  );
  return res.response;
}

async function createFramework(frameworkDescription, namespace = 'default') {
  const res = await customObjectsClient.createNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
    frameworkDescription,
  );
  return res.response;
}

async function patchFramework(name, data, namespace = 'default') {
  if (data.status) {
    logger.warn(
      'Modifying status field in framework is not allowed! Will delete it.',
    );
    delete data.status;
  }
  const res = await customObjectsClient.patchNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
    name,
    data,
    { headers: { 'Content-Type': 'application/merge-patch+json' } },
  );
  return res.response;
}

async function deleteFramework(name, namespace = 'default') {
  const res = await customObjectsClient.deleteNamespacedCustomObject(
    'frameworkcontroller.microsoft.com',
    'v1',
    namespace,
    'frameworks',
    name,
    ...Array(4), // skip some parameters
    { headers: { propagationPolicy: 'Foreground' } },
  );
  return res.response;
}

function getFrameworkInformer(
  timeoutSeconds = 365 * 86400,
  namespace = 'default',
) {
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
  this behavior will be fixed in the future. For this version, we set a large timeout to mitigate this issue.
  TO DO: If @kubernetes/client-node fixes this issue, we should upgrade our code to use the new code.

  If the informer encounters any error, it will stop watching, and won't re-connect.
  One can restart it by informer.on('error', (err) => { informer.start(); }).

  */
  const listFn = () => {
    logger.info('Frameworks are listed.');
    return customObjectsClient.listNamespacedCustomObject(
      'frameworkcontroller.microsoft.com',
      'v1',
      namespace,
      'frameworks',
    );
  };
  const informer = k8s.makeInformer(
    kc,
    `/apis/frameworkcontroller.microsoft.com/v1/namespaces/${namespace}/frameworks?timeoutSeconds=${timeoutSeconds}`,
    listFn,
  );
  return informer;
}

const coreV1Client = kc.makeApiClient(k8s.CoreV1Api);

function getEventInformer(timeoutSeconds = 365 * 86400, namespace = 'default') {
  /*
  The usage is very like `getFrameworkInformer`. Please see the comments of `getFrameworkInformer` for reference.

  */
  const listFn = () => {
    logger.info('Cluster events are listed.');
    return coreV1Client.listNamespacedEvent(namespace);
  };
  const informer = k8s.makeInformer(
    kc,
    `/api/v1/namespaces/${namespace}/events?timeoutSeconds=${timeoutSeconds}`,
    listFn,
  );
  return informer;
}

const priorityClassClient = kc.makeApiClient(k8s.SchedulingV1Api);

async function createPriorityClass(priorityClassDef) {
  const res = await priorityClassClient.createPriorityClass(priorityClassDef);
  return res.response;
}

async function deletePriorityClass(name) {
  const res = await priorityClassClient.deletePriorityClass(name);
  return res.response;
}

async function createSecret(secretDef) {
  const res = await coreV1Client.createNamespacedSecret(
    secretDef.metadata.namespace,
    secretDef,
  );
  return res;
}

async function deleteSecret(name, namespace = 'default') {
  const res = await coreV1Client.deleteNamespacedSecret(name, namespace);
  return res.response;
}

async function patchSecretOwnerToFramework(secret, frameworkResponse) {
  const metadata = {
    ownerReferences: [
      {
        apiVersion: 'frameworkcontroller.microsoft.com',
        kind: 'Framework',
        name: frameworkResponse.metadata.name,
        uid: frameworkResponse.metadata.uid,
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
  };
  const res = await coreV1Client.patchNamespacedSecret(
    secret.metadata.name,
    secret.metadata.namespace,
    { metadata: metadata },
    ...Array(4), // skip some parameters
    { headers: { 'Content-Type': 'application/merge-patch+json' } },
  );
  return res.response;
}

const timeoutMs = config.k8sConnectionTimeoutSecond * 1000;

// We give every method a timeout.
module.exports = {
  getFramework: timeoutDecorator(
    getFramework,
    'Kubernetes getFramework',
    timeoutMs,
  ),
  listFramework: timeoutDecorator(
    listFramework,
    'Kubernetes getFramework',
    timeoutMs,
  ),
  createFramework: timeoutDecorator(
    createFramework,
    'Kubernetes createFramework',
    timeoutMs,
  ),
  patchFramework: timeoutDecorator(
    patchFramework,
    'Kubernetes patchFramework',
    timeoutMs,
  ),
  deleteFramework: timeoutDecorator(
    deleteFramework,
    'Kubernetes deleteFramework',
    timeoutMs,
  ),
  createPriorityClass: timeoutDecorator(
    createPriorityClass,
    'Kubernetes createPriorityClass',
    timeoutMs,
  ),
  deletePriorityClass: timeoutDecorator(
    deletePriorityClass,
    'Kubernetes deletePriorityClass',
    timeoutMs,
  ),
  createSecret: timeoutDecorator(
    createSecret,
    'Kubernetes createSecret',
    timeoutMs,
  ),
  deleteSecret: timeoutDecorator(
    deleteSecret,
    'Kubernetes deleteSecret',
    timeoutMs,
  ),
  patchSecretOwnerToFramework: timeoutDecorator(
    patchSecretOwnerToFramework,
    'Kubernetes patchSecretOwnerToFramework',
    timeoutMs,
  ),
  getFrameworkInformer: getFrameworkInformer,
  getEventInformer: getEventInformer,
};
