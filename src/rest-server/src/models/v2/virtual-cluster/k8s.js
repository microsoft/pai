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
const {Agent} = require('https');
const createError = require('@pai/utils/error');
const vcConfig = require('@pai/config/vc');
const launcherConfig = require('@pai/config/launcher');
const {apiserver} = require('@pai/config/kubernetes');
const k8s = require('@pai/utils/k8sUtils');
const axios = require('axios');
const yaml = require('js-yaml');

const vcData = {
  resourceUnits: vcConfig.resourceUnits,
  virtualCellCapacity: vcConfig.virtualCellCapacity,
  clusterTotalGpu: vcConfig.clusterTotalGpu,
  clusterNodeGpu: vcConfig.clusterNodeGpu,
};


const fetchNodes = async () => {
  const nodes = await axios({
    method: 'get',
    url: `${apiserver.uri}/api/v1/nodes`,
    httpsAgent: apiserver.ca && new Agent({ca: apiserver.ca}),
    headers: apiserver.token && {Authorization: `Bearer ${apiserver.token}`},
  });
  return nodes.data.items.filter((node) => {
    if (node.metadata.labels['pai-worker'] !== 'true') {
      return false;
    }
    // check node readiness
    for (let i = node.status.conditions.length - 1; i >= 0; i --) {
      const condition = node.status.conditions[i];
      if (condition.type === 'Ready' && condition.status !== 'Unknown') {
        return true;
      }
    }
    return false;
  });
};

const fetchPods = async () => {
  const pods = await axios({
    method: 'get',
    url: `${apiserver.uri}/api/v1/pods?labelSelector=type=kube-launcher-task`,
    httpsAgent: apiserver.ca && new Agent({ca: apiserver.ca}),
    headers: apiserver.token && {Authorization: `Bearer ${apiserver.token}`},
  });
  return pods.data.items.filter((pod) => {
    return (pod.spec.nodeName && !(pod.status.phase === 'Succeeded' || pod.status.phase === 'Failed'));
  });
};

const getResourceUnits = () => {
  return vcData.resourceUnits;
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
      resourcesUsed: {
        cpu: 0,
        memory: 0,
        gpu: 0,
      },
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
    for (let node of Object.keys(vcData.clusterNodeGpu)) {
      nodeResource[node] = {
        gpuTotal: vcData.clusterNodeGpu[node].gpu,
        gpuUsed: 0,
        gpuAvaiable: vcData.clusterNodeGpu[node].gpu,
      };
    }
  } else {
    const nodes = await fetchNodes();
    for (let node of nodes) {
      const nodeName = node.metadata.name;
      const gpuNumber = k8s.atoi(node.status.capacity['nvidia.com/gpu']);
      nodeResource[nodeName] = {
        gpuTotal: gpuNumber,
        gpuUsed: 0,
        gpuAvaiable: gpuNumber,
      };
    }
  }

  for (let pod of pods) {
    if (!nodeResource.hasOwnProperty(pod.nodeIp)) {
      // pod not in configured nodes
      continue;
    }
    nodeResource[pod.nodeIp].gpuUsed += pod.resourcesUsed.gpu;
    nodeResource[pod.nodeIp].gpuAvaiable -= pod.resourcesUsed.gpu;
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
    ...Object.keys(vcData.virtualCellCapacity),
  ]);
  for (let vc of allVc) {
    vcInfos[vc] = {
      capacity: 0,
      usedCapacity: 0,
      numJobs: 0,
      resourcesUsed: {
        memory: 0,
        cpu: 0,
        gpu: 0,
      },
      resourcesTotal: {
        memory: 0,
        cpu: 0,
        gpu: 0,
      },
      dedicated: false,
    };
  }

  // set used resource
  const countedJob = new Set();
  for (let pod of pods) {
    if (!countedJob.has(pod.userName + '~' + pod.jobName)) {
      countedJob.add(pod.userName + '~' + pod.jobName);
      vcInfos[pod.virtualCluster].numJobs += 1;
    }
    vcInfos[pod.virtualCluster].resourcesUsed.memory += pod.resourcesUsed.memory;
    vcInfos[pod.virtualCluster].resourcesUsed.cpu += pod.resourcesUsed.cpu;
    vcInfos[pod.virtualCluster].resourcesUsed.gpu += pod.resourcesUsed.gpu;
  }

  // set configured resource
  if (launcherConfig.enabledHived) {
    for (let vc of Object.keys(vcData.virtualCellCapacity)) {
      vcInfos[vc].resourcesTotal.memory = vcData.virtualCellCapacity[vc].resourcesTotal.memory;
      vcInfos[vc].resourcesTotal.cpu = vcData.virtualCellCapacity[vc].resourcesTotal.cpu;
      vcInfos[vc].resourcesTotal.gpu = vcData.virtualCellCapacity[vc].resourcesTotal.gpu;
    }
  } else {
    const nodes = await fetchNodes();
    vcInfos['default'].resourcesTotal = {
      cpu: nodes.reduce((sum, node) => sum + k8s.atoi(node.status.capacity.cpu), 0),
      memory: nodes.reduce((sum, node) => sum + k8s.convertMemoryMb(node.status.capacity.memory), 0),
      gpu: nodes.reduce((sum, node) => sum + k8s.atoi(node.status.capacity['nvidia.com/gpu']), 0),
    };
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
    vcInfos[vc].resourcesUsed.vCores = vcInfos[vc].resourcesUsed.cpu;
    vcInfos[vc].resourcesUsed.GPUs = vcInfos[vc].resourcesUsed.gpu;
    vcInfos[vc].resourcesTotal.vCores = vcInfos[vc].resourcesTotal.cpu;
    vcInfos[vc].resourcesTotal.GPUs = vcInfos[vc].resourcesTotal.gpu;
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
