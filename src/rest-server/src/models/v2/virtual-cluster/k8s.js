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
const yaml = require('js-yaml');
const createError = require('@pai/utils/error');
const vcConfig = require('@pai/config/vc');
const launcherConfig = require('@pai/config/launcher');
const kubernetes = require('@pai/models/kubernetes');
const k8s = require('@pai/utils/k8sUtils');

const {
  resourceUnits,
  virtualCellCapacity,
  clusterNodeGpu,
} = vcConfig;

const resourcesEmpty = {
  cpu: 0,
  memory: 0,
  gpu: 0,
};

const mergeDict = (d1, d2, op) => {
  for (let k of [...Object.keys(d1).filter((x) => x in d2)]) {
    d1[k] = op(d1[k], d2[k]);
  }
};

const fetchNodes = async (readiness=true) => {
  const nodes = await kubernetes.getNodes();
  return nodes.items.filter((node) => {
    if (node.metadata.labels['pai-worker'] !== 'true') {
      return false;
    }

    // check node readiness
    const readyCondition = node.status.conditions.find((x) => x.type === 'Ready');
    if (readyCondition && readyCondition.status !== 'Unknown') {
      return readiness;
    } else {
      return !readiness;
    }
  });
};

const fetchPods = async () => {
  const pods = await kubernetes.getPods({
    labelSelector: {type: 'kube-launcher-task'},
  });
  return pods.items.filter((pod) => {
    return (pod.spec.nodeName && !(pod.status.phase === 'Succeeded' || pod.status.phase === 'Failed'));
  });
};

const getResourceUnits = () => {
  return resourceUnits;
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
      nodeIp: pod.spec.nodeName,
      resourcesUsed: {...resourcesEmpty},
    };

    const bindingInfo = annotations['hivedscheduler.microsoft.com/pod-bind-info'];
    const resourceRequest = pod.spec.containers[0].resources.requests;
    podInfo.resourcesUsed.cpu = k8s.atoi(resourceRequest.cpu);
    podInfo.resourcesUsed.memory = k8s.convertMemoryMb(resourceRequest.memory);
    if (resourceRequest.hasOwnProperty('hivedscheduler.microsoft.com/pod-scheduling-enable')) {
      if (bindingInfo != null) {
        // scheduled by hived
        const info = yaml.safeLoad(bindingInfo);
        podInfo.resourcesUsed.gpu = info.gpuIsolation.length;
      }
    } else {
      podInfo.resourcesUsed.gpu = k8s.atoi(resourceRequest['nvidia.com/gpu']);
    }
    return podInfo;
  });

  return pods;
};

const getNodeResource = async () => {
  const pods = await getPodsInfo();
  const nodeResource = {};

  if (launcherConfig.enabledHived) {
    for (let node of Object.keys(clusterNodeGpu)) {
      nodeResource[node] = {
        gpuTotal: clusterNodeGpu[node].gpu,
        gpuUsed: 0,
        gpuAvailable: clusterNodeGpu[node].gpu,
      };
    }
  } else {
    const nodes = await fetchNodes(true);
    for (let node of nodes) {
      const nodeName = node.metadata.name;
      const gpuNumber = k8s.atoi(node.status.capacity['nvidia.com/gpu']);
      nodeResource[nodeName] = {
        gpuTotal: gpuNumber,
        gpuUsed: 0,
        gpuAvailable: gpuNumber,
      };
    }
  }

  for (let pod of pods) {
    if (!nodeResource.hasOwnProperty(pod.nodeIp)) {
      // pod not in configured nodes
      continue;
    }
    nodeResource[pod.nodeIp].gpuUsed += pod.resourcesUsed.gpu;
    nodeResource[pod.nodeIp].gpuAvailable -= pod.resourcesUsed.gpu;
  }
  return nodeResource;
};

const getVcList = async () => {
  const pods = await getPodsInfo();

  // get vc usage
  const vcInfos = {};
  const allVc = new Set([
    'default',
    ...Array.from(pods, (pod) => pod.virtualCluster),
    ...Object.keys(virtualCellCapacity),
  ]);
  for (let vc of allVc) {
    vcInfos[vc] = {
      capacity: 0,
      usedCapacity: 0,
      numJobs: 0,
      dedicated: false,
      resourcesUsed: {...resourcesEmpty},
    };
  }

  // set used resource
  const countedJob = new Set();
  for (let pod of pods) {
    if (!countedJob.has(pod.userName + '~' + pod.jobName)) {
      countedJob.add(pod.userName + '~' + pod.jobName);
      vcInfos[pod.virtualCluster].numJobs += 1;
    }
    mergeDict(vcInfos[pod.virtualCluster].resourcesUsed, pod.resourcesUsed, (x, y) => x + y);
  }

  // set configured resource
  if (launcherConfig.enabledHived) {
    const availableTypes = {};
    for (let vc of Object.keys(virtualCellCapacity)) {
      availableTypes[vc] = JSON.parse(JSON.stringify(virtualCellCapacity[vc].limit));
      vcInfos[vc].resourcesTotal = {
        cpu: Object.values(virtualCellCapacity[vc].quota).reduce((sum, resources) => sum + resources.cpu, 0),
        memory: Object.values(virtualCellCapacity[vc].quota).reduce((sum, resources) => sum + resources.memory, 0),
        gpu: Object.values(virtualCellCapacity[vc].quota).reduce((sum, resources) => sum + resources.gpu, 0),
      };
    }
    // minus resources in preempted nodes
    const preemptedNodes = await fetchNodes(false);
    for (let node of preemptedNodes) {
      if (!(node.metadata.name in clusterNodeGpu)) {
        continue;
      }
      const bindings = clusterNodeGpu[node.metadata.name].bindings;
      for (let vc of Object.keys(bindings)) {
        if (vc in availableTypes && bindings[vc].type in availableTypes[vc]) {
          mergeDict(availableTypes[vc][bindings[vc].type], bindings[vc], (x, y) => x - y);
        }
      }
    }
    // minus used resources in other virtual clusters
    for (let pod of pods) {
      const bindings = clusterNodeGpu[pod.nodeIp].bindings;
      for (let vc of Object.keys(bindings)) {
        if (vc !== pod.virtualCluster && vc in availableTypes && bindings[vc].type in availableTypes[vc]) {
          mergeDict(availableTypes[vc][bindings[vc].type], pod.resourcesUsed, (x, y) => x - y);
        }
      }
    }
    // available = min(max(left resources, 0), quota)
    for (let vc of Object.keys(virtualCellCapacity)) {
      vcInfos[vc].resourceAvailable = {...resourcesEmpty};
      for (let type of Object.keys(availableTypes[vc])) {
        mergeDict(availableTypes[vc][type], virtualCellCapacity[vc].quota[type], (x, y) => Math.min(Math.max(x, 0), y));
        mergeDict(vcInfos[vc].resourceAvailable, availableTypes[vc][type], (x, y) => x + y);
      }
    }
  } else {
    const nodes = await fetchNodes(true);
    vcInfos['default'].resourceAvailable = {
      cpu: nodes.reduce((sum, node) => sum + k8s.atoi(node.status.capacity.cpu), 0),
      memory: nodes.reduce((sum, node) => sum + k8s.convertMemoryMb(node.status.capacity.memory), 0),
      gpu: nodes.reduce((sum, node) => sum + k8s.atoi(node.status.capacity['nvidia.com/gpu']), 0),
    };
    const preemptedNodes = await fetchNodes(false);
    vcInfos['default'].resourcesTotal = {
      cpu: preemptedNodes.reduce((sum, node) => sum + k8s.atoi(node.status.capacity.cpu), 0),
      memory: preemptedNodes.reduce((sum, node) => sum + k8s.convertMemoryMb(node.status.capacity.memory), 0),
      gpu: preemptedNodes.reduce((sum, node) => sum + k8s.atoi(node.status.capacity['nvidia.com/gpu']), 0),
    };
    mergeDict(vcInfos['default'].resourcesTotal, vcInfos['default'].resourceAvailable, (x, y) => x + y);
  }

  // add capacity, maxCapacity, usedCapacity for compatibility
  const gpuTotal = Object.values(vcInfos).reduce((sum, vcInfo) => sum + vcInfo.resourcesTotal.gpu, 0);
  if (gpuTotal > 0) {
    for (let vc of Object.keys(vcInfos)) {
      vcInfos[vc].capacity = vcInfos[vc].resourcesTotal.gpu / gpuTotal * 100;
      vcInfos[vc].maxCapacity = vcInfos[vc].capacity;
      vcInfos[vc].usedCapacity = vcInfos[vc].resourcesUsed.gpu / gpuTotal * 100;
    }
  }

  // add GPUs, vCores for compatibility
  for (let vc of Object.keys(vcInfos)) {
    for (let resource of ['resourcesUsed', 'resourceAvailable', 'resourcesTotal']) {
      for (let [k, v] of [['vCores', 'cpu'], ['GPUs', 'gpu']]) {
        vcInfos[vc][resource][k] = vcInfos[vc][resource][v];
      }
    }
  }
  return vcInfos;
};

const getVc = async (vcName) => {
  const vcInfos = await getVcList();
  if (!vcInfos.hasOwnProperty(vcName)) {
    throw createError('Not Found', 'NoVirtualClusterError', `Vc ${vcName} not found`);
  }
  return vcInfos[vcName];
};

const updateVc = () => {
  throw createError('Bad Request', 'NotImplementedError', 'updateVc not implemented in k8s');
};

const stopVc = () => {
  throw createError('Bad Request', 'NotImplementedError', 'stopVc not implemented in k8s');
};

const activeVc = () => {
  throw createError('Bad Request', 'NotImplementedError', 'activeVc not implemented in k8s');
};

const removeVc = () => {
  throw createError('Bad Request', 'NotImplementedError', 'removeVc not implemented in k8s');
};

// module exports
module.exports = {
  list: getVcList,
  get: getVc,
  getResourceUnits: getResourceUnits,
  getNodeResource: getNodeResource,
  update: updateVc,
  stop: stopVc,
  activate: activeVc,
  remove: removeVc,
};
