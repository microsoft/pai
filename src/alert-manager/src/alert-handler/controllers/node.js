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

const k8s = require('@kubernetes/client-node');
const kc = new k8s.KubeConfig();
const logger = require('@alert-handler/common/logger');
const crypto = require('crypto');

kc.loadFromDefault();

const cordonNode = async (nodeName) => {
  const headers = {
    'content-type': 'application/strategic-merge-patch+json',
  };
  // set the node unschedulable
  const k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  return k8sApi.patchNode(
    nodeName,
    { spec: { unschedulable: true } },
    undefined,
    undefined,
    undefined,
    undefined,
    { headers },
  );
};

const cordonNodes = (req, res) => {
  logger.info(
    'alert-handler received `cordonNode` post request from alert-manager.',
  );

  // extract nodes to cordon
  const nodeNames = req.body.alerts
    // filter alerts which are firing and contain `node_name` as label
    .filter((alert) => alert.status === 'firing' && 'node_name' in alert.labels)
    .map((alert) => alert.labels.node_name);

  if (nodeNames.length === 0) {
    return res.status(200).json({
      message: 'No nodes to cordon.',
    });
  }
  logger.info(`alert-handler will cordon these nodes: ${nodeNames}`);

  // cordon all these nodes
  Promise.all(nodeNames.map((nodeName) => cordonNode(nodeName)))
    .then((response) => {
      logger.info(`alert-handler successfully cordon nodes: ${nodeNames}`);
      res.status(200).json({
        message: `alert-handler successfully cordon nodes`,
      });
    })
    .catch((error) => {
      logger.error(error);
      res.status(500).json({
        message: `alert-handler failed to cordon node`,
      });
    });
};

const getK8sV1Job = (jobName, nodeName, minorNumber) => {
  const DOCKER_REGISTRY_PREFIX = process.env.DOCKER_REGISTRY_PREFIX;
  const DOCKER_REGISTRY_TAG = process.env.DOCKER_REGISTRY_TAG;
  const job = {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: jobName,
    },
    spec: {
      ttlSecondsAfterFinished: 86400, // TODO: enable this feature when install k8s / delete the job elsewhere
      template: {
        metadata: {
          name: 'nvidia-gpu-low-perf-fixer',
        },
        spec: {
          containers: [
            {
              name: 'nvidia-gpu-low-perf-fixer',
              image: `${DOCKER_REGISTRY_PREFIX}nvidia-gpu-low-perf-fixer:${DOCKER_REGISTRY_TAG}`,
              imagePullPolicy: 'Always',
              env: [
                {
                  name: 'MINOR_NUMBER',
                  value: `${minorNumber}`,
                },
              ],
              securityContext: {
                privileged: true,
              },
            },
          ],
          restartPolicy: 'Never',
          nodeSelector: {
            'kubernetes.io/hostname': nodeName,
          },
        },
      },
    },
  };
  return job;
};

// start a k8s job for each GPU card to fix NvidiaGPULowPerf issue
const fixNvidiaGPULowPerf = (req, res) => {
  logger.info(
    'Received `fixNvidiaGPULowPerf` post request from alert-manager.',
  );
  // filter alerts which are firing and contain `node_name` & `minor_number` as label
  const jobsInfo = req.body.alerts
    .filter(
      (alert) =>
        alert.status === 'firing' &&
        'node_name' in alert.labels &&
        'minor_number' in alert.labels,
    )
    // map each alert to a job
    .map((alert) => ({
      jobName: `nvidia-gpu-low-perf-fixer-${crypto
        .createHash('md5')
        .update(alert.labels.node_name + alert.labels.minor_number)
        .digest('hex')}`, // unique job by GPU card
      nodeName: alert.labels.node_name,
      minorNumber: alert.labels.minor_number,
      DOCKER_REGISTRY_PREFIX: process.env.DOCKER_REGISTRY_PREFIX,
      DOCKER_REGISTRY_TAG: process.env.DOCKER_REGISTRY_TAG,
    }));

  const k8sApi = kc.makeApiClient(k8s.BatchV1Api);
  jobsInfo.forEach(async (jobInfo) => {
    // get k8s V1Job
    const job = getK8sV1Job(
      jobInfo.jobName,
      jobInfo.nodeName,
      jobInfo.minorNumber,
    );
    k8sApi
      .createNamespacedJob('default', job)
      .then((response) => {
        logger.info(
          `Successfully start job ${jobInfo.jobName} for GPU Low Performance issue in node: ${jobInfo.nodeName}, minor number: ${jobInfo.minorNumber}`,
        );
      })
      .catch((error) => {
        // ignore the job creation if already exists
        if (error.response && error.response.statusCode === 409) {
          logger.warn(`Kubernetes job ${jobInfo.jobName} already exists.`);
        } else {
          logger.error(error);
          res.status(500).json({
            message: `Failed to start job to fix NvidiaGPULowPerf`,
          });
        }
      });
  });
};

// module exports
module.exports = {
  cordonNodes,
  fixNvidiaGPULowPerf,
};
