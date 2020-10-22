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

// module dependencies
const axios = require('axios');
const yaml = require('js-yaml');
const createError = require('@pai/utils/error');
const { resourceUnits } = require('@pai/config/vc');
const { enabledHived, hivedWebserviceUri } = require('@pai/config/launcher');
const kubernetes = require('@pai/models/kubernetes/kubernetes');
const k8s = require('@pai/utils/k8sUtils');

const resourcesEmpty = {
  cpu: 0,
  memory: 0,
  gpu: 0,
};

const add = (x, y) => x + y;

const mergeDict = (d1, d2, op) => {
  for (const k of [...Object.keys(d1).filter((x) => x in d2)]) {
    d1[k] = op(d1[k], d2[k]);
  }
};

const fetchNodes = async (readiness = true) => {
  const nodes = await kubernetes.getNodes();
  return nodes.items.filter((node) => {
    if (node.metadata.labels['pai-worker'] !== 'true') {
      return false;
    }

    // check node readiness
    const readyCondition = node.status.conditions.find(
      (x) => x.type === 'Ready',
    );
    if (readyCondition && readyCondition.status !== 'Unknown') {
      return readiness;
    } else {
      return !readiness;
    }
  });
};

const fetchPods = async () => {
  const pods = await kubernetes.getPods({
    labelSelector: 'type=kube-launcher-task',
  });
  return pods.items.filter((pod) => {
    return (
      pod.spec.nodeName &&
      !(pod.status.phase === 'Succeeded' || pod.status.phase === 'Failed')
    );
  });
};

const getPodsInfo = async () => {
  const rawPods = await fetchPods();

  // parse pods spec
  const pods = Array.from(rawPods, (pod) => {
    const annotations = pod.metadata.annotations;
    const labels = pod.metadata.labels;

    const podInfo = {
      jobName: labels.jobName,
      userName: labels.userName,
      virtualCluster: labels.virtualCluster,
      taskRoleName: labels.FC_TASKROLE_NAME,
      nodeName: pod.spec.nodeName,
      resourcesUsed: { ...resourcesEmpty },
    };

    const bindingInfo =
      annotations['hivedscheduler.microsoft.com/pod-bind-info'];
    const resourceRequest = pod.spec.containers[0].resources.requests;
    podInfo.resourcesUsed.cpu = k8s.atoi(resourceRequest.cpu);
    podInfo.resourcesUsed.memory = k8s.convertMemoryMb(resourceRequest.memory);
    if (
      Object.prototype.hasOwnProperty.call(
        resourceRequest,
        'hivedscheduler.microsoft.com/pod-scheduling-enable',
      )
    ) {
      if (bindingInfo != null) {
        // scheduled by hived
        const info = yaml.safeLoad(bindingInfo);
        podInfo.resourcesUsed.gpu = info.gpuIsolation
          ? info.gpuIsolation.length
          : null;
      }
    } else {
      podInfo.resourcesUsed.gpu =
        k8s.atoi(resourceRequest['nvidia.com/gpu']) +
        k8s.atoi(resourceRequest['amd.com/gpu']);
    }
    return podInfo;
  });

  return pods;
};

const getNodeResource = async () => {
  const nodeResource = {};

  if (enabledHived) {
    let pcStatus;
    try {
      pcStatus = (
        await axios.get(
          `${hivedWebserviceUri}/v1/inspect/clusterstatus/physicalcluster`,
        )
      ).data;
    } catch (error) {
      if (error.response != null) {
        throw createError(
          error.response.status,
          'UnknownError',
          error.response.data ||
            'Hived scheduler cannot inspect physical cluster.',
        );
      } else {
        throw error;
      }
    }
    const cellQueue = [...pcStatus];
    while (cellQueue.length > 0) {
      const curr = cellQueue.shift();
      if (curr.isNodeLevel) {
        const nodeName = curr.cellAddress.split('/').slice(-1)[0];
        nodeResource[nodeName] = {
          gpuUsed: 0,
          gpuAvailable: 0,
          gpuTotal: 0,
        };
        const cellQueueOnNode = [curr];
        while (cellQueueOnNode.length > 0) {
          const currOnNode = cellQueueOnNode.shift();
          if (currOnNode.cellChildren) {
            cellQueueOnNode.push(...currOnNode.cellChildren);
          } else {
            if (currOnNode.cellType in resourceUnits) {
              const gpuNumber = resourceUnits[currOnNode.cellType].gpu;
              if (currOnNode.cellHealthiness === 'Healthy') {
                if (currOnNode.cellState === 'Used') {
                  nodeResource[nodeName].gpuUsed += gpuNumber;
                } else {
                  nodeResource[nodeName].gpuAvailable += gpuNumber;
                }
              }
              nodeResource[nodeName].gpuTotal += gpuNumber;
            }
          }
        }
      } else if (curr.cellChildren) {
        cellQueue.push(...curr.cellChildren);
      }
    }
  } else {
    const nodes = await fetchNodes(true);
    for (const node of nodes) {
      const nodeName = node.metadata.name;
      const gpuNumber =
        k8s.atoi(node.status.capacity['nvidia.com/gpu']) +
        k8s.atoi(node.status.capacity['amd.com/gpu']);
      nodeResource[nodeName] = {
        gpuUsed: 0,
        gpuAvailable: gpuNumber,
        gpuTotal: gpuNumber,
      };
    }
    const pods = await getPodsInfo();
    for (const pod of pods) {
      if (pod.nodeName in nodeResource) {
        nodeResource[pod.nodeName].gpuUsed += pod.resourcesUsed.gpu;
        nodeResource[pod.nodeName].gpuAvailable -= pod.resourcesUsed.gpu;
      }
    }
  }

  return nodeResource;
};

const getVcList = async () => {
  const vcEmpty = {
    capacity: 0,
    usedCapacity: 0,
    dedicated: false,
    resourcesUsed: { ...resourcesEmpty },
    resourcesGuaranteed: { ...resourcesEmpty },
    resourcesTotal: { ...resourcesEmpty },
  };
  const vcInfos = { default: JSON.parse(JSON.stringify(vcEmpty)) };

  // set resources
  if (enabledHived) {
    let vcStatus;
    try {
      vcStatus = (
        await axios.get(
          `${hivedWebserviceUri}/v1/inspect/clusterstatus/virtualclusters/`,
        )
      ).data;
    } catch (error) {
      if (error.response != null) {
        throw createError(
          error.response.status,
          'UnknownError',
          error.response.data ||
            'Hived scheduler cannot inspect virtual clusters.',
        );
      } else {
        throw error;
      }
    }
    // used, guaranteed, total resources
    for (const vc of Object.keys(vcStatus)) {
      if (!(vc in vcInfos)) {
        vcInfos[vc] = JSON.parse(JSON.stringify(vcEmpty));
      }
      const cellQueue = [...vcStatus[vc]];
      while (cellQueue.length > 0) {
        const curr = cellQueue.shift();
        if (curr.cellPriority === -1) {
          continue;
        }
        if (curr.cellChildren) {
          curr.cellChildren.forEach((cellChild) => {
            cellChild.leafCellType = curr.leafCellType;
            cellQueue.push(cellChild);
          });
        } else {
          if (curr.leafCellType in resourceUnits) {
            const sku = resourceUnits[curr.leafCellType];
            if (curr.cellHealthiness === 'Healthy') {
              if (curr.cellState === 'Used') {
                mergeDict(vcInfos[vc].resourcesUsed, sku, add);
              }
              mergeDict(vcInfos[vc].resourcesGuaranteed, sku, add);
            }
            mergeDict(vcInfos[vc].resourcesTotal, sku, add);
          }
        }
      }
    }
  } else {
    // used resources
    const pods = await getPodsInfo();
    for (const pod of pods) {
      if (pod.virtualCluster in vcInfos) {
        mergeDict(
          vcInfos[pod.virtualCluster].resourcesUsed,
          pod.resourcesUsed,
          add,
        );
      }
    }
    // guaranteed resources
    const nodes = await fetchNodes(true);
    vcInfos.default.resourcesGuaranteed = {
      cpu: nodes.reduce(
        (sum, node) => sum + k8s.atoi(node.status.capacity.cpu),
        0,
      ),
      memory: nodes.reduce(
        (sum, node) => sum + k8s.convertMemoryMb(node.status.capacity.memory),
        0,
      ),
      gpu: nodes.reduce(
        (sum, node) =>
          sum +
          k8s.atoi(node.status.capacity['nvidia.com/gpu']) +
          k8s.atoi(node.status.capacity['amd.com/gpu']),
        0,
      ),
    };
    // total resources
    const preemptedNodes = await fetchNodes(false);
    vcInfos.default.resourcesTotal = {
      cpu: preemptedNodes.reduce(
        (sum, node) => sum + k8s.atoi(node.status.capacity.cpu),
        0,
      ),
      memory: preemptedNodes.reduce(
        (sum, node) => sum + k8s.convertMemoryMb(node.status.capacity.memory),
        0,
      ),
      gpu: preemptedNodes.reduce(
        (sum, node) =>
          sum +
          k8s.atoi(node.status.capacity['nvidia.com/gpu']) +
          k8s.atoi(node.status.capacity['amd.com/gpu']),
        0,
      ),
    };
    mergeDict(
      vcInfos.default.resourcesTotal,
      vcInfos.default.resourcesGuaranteed,
      add,
    );
  }

  // add capacity, maxCapacity, usedCapacity for compatibility
  const gpuTotal = Object.values(vcInfos).reduce(
    (sum, vcInfo) => sum + vcInfo.resourcesTotal.gpu,
    0,
  );
  if (gpuTotal > 0) {
    for (const vc of Object.keys(vcInfos)) {
      vcInfos[vc].capacity = (vcInfos[vc].resourcesTotal.gpu / gpuTotal) * 100;
      vcInfos[vc].maxCapacity = vcInfos[vc].capacity;
      vcInfos[vc].usedCapacity =
        (vcInfos[vc].resourcesUsed.gpu / gpuTotal) * 100;
    }
  }

  // add GPUs, vCores for compatibility
  for (const vc of Object.keys(vcInfos)) {
    for (const resource of [
      'resourcesUsed',
      'resourcesGuaranteed',
      'resourcesTotal',
    ]) {
      for (const [k, v] of [
        ['vCores', 'cpu'],
        ['GPUs', 'gpu'],
      ]) {
        vcInfos[vc][resource][k] = vcInfos[vc][resource][v];
      }
    }
  }
  return vcInfos;
};

const getVc = async (vcName) => {
  const vcInfos = await getVcList();
  if (!Object.prototype.hasOwnProperty.call(vcInfos, vcName)) {
    throw createError(
      'Not Found',
      'NoVirtualClusterError',
      `Vc ${vcName} not found`,
    );
  }
  return vcInfos[vcName];
};

const updateVc = () => {
  throw createError(
    'Bad Request',
    'NotImplementedError',
    'updateVc not implemented in k8s',
  );
};

const stopVc = () => {
  throw createError(
    'Bad Request',
    'NotImplementedError',
    'stopVc not implemented in k8s',
  );
};

const activeVc = () => {
  throw createError(
    'Bad Request',
    'NotImplementedError',
    'activeVc not implemented in k8s',
  );
};

const removeVc = () => {
  throw createError(
    'Bad Request',
    'NotImplementedError',
    'removeVc not implemented in k8s',
  );
};

// module exports
module.exports = {
  list: getVcList,
  get: getVc,
  getNodeResource: getNodeResource,
  update: updateVc,
  stop: stopVc,
  activate: activeVc,
  remove: removeVc,
};
