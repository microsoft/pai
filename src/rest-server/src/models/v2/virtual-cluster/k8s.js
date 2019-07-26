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
const util = require('util');
const createError = require('@pai/utils/error');
const vcConfig = require('@pai/config/vc');
const k8s = require('@pai/utils/k8sUtils');
const axios = require('axios');
const yaml = require('js-yaml');


class VirtualCluster {
  constructor() {
    this.resourceUnits = vcConfig.resourceUnits;
    this.virtualCellCapacity = vcConfig.virtualCellCapacity;
  }

  getResourceUnits() {
    return this.resourceUnits;
  }

  async getVcList() {
    const rawPods = (await axios({
      method: 'get',
      url: vcConfig.podsUrl,
    })).data.items;

    // parse pods spec
    const pods = Array.from(rawPods, (pod) => {
      const annotations = pod.metadata.annotations;
      const labels = pod.metadata.labels;

      const podInfo = {
        jobName: labels.jobName,
        userName: labels.userName,
        virtualCluster: labels.virtualCluster,
        taskRoleName: labels.FC_TASKROLE_NAME,
        resourceUsed: {
          cpu: 0,
          memoryMB: 0,
          gpu: 0,
        },
      };

      const bindingInfo = annotations['hivedscheduler.microsoft.com/pod-bind-info'];
      const resourceRequest = pod.spec.containers[0].resources.requests;
      podInfo.resourceUsed.cpu = parseInt(resourceRequest.cpu);
      podInfo.resourceUsed.memoryMB = k8s.convertMemory(resourceRequest.memory);
      if (resourceRequest.hasOwnProperty('hivedscheduler.microsoft.com/pod-scheduling-enable')) {
        if (bindingInfo != null) {
          // scheduled by hived
          const info = yaml.safeLoad(bindingInfo);
          podInfo.resourceUsed.gpu = info.gpuIsolation.length;
        }
      } else {
        podInfo.resourceUsed.gpu = resourceRequest['nvidia.com/gpu'];
      }
      return podInfo;
    });

    // get vc usage
    const vcInfos = {};
    const countedJob = new Set();
    for (let pod of pods) {
      if (!vcInfos.hasOwnProperty(pod.virtualCluster)) {
        vcInfos[pod.virtualCluster] = {
          capacity: 0,
          usedCapacity: 0,
          numJobs: 0,
          resourceUsed: {
            memory: 0,
            vCores: 0,
            GPUs: 0,
          },
          resourceTotal: {
            memory: 0,
            vCores: 0,
            GPUs: 0,
          },
        };
      }
      if (!countedJob.has(pod.userName + '~' + pod.jobName)) {
        countedJob.add(pod.userName + '~' + pod.jobName);
        vcInfos[pod.virtualCluster].numJobs += 1;
      }
      vcInfos[pod.virtualCluster].resourceUsed.memory += pod.resourceUsed.memoryMB;
      vcInfos[pod.virtualCluster].resourceUsed.vCores += pod.resourceUsed.cpu;
      vcInfos[pod.virtualCluster].resourceUsed.GPUs += pod.resourceUsed.gpu;
    }

    // merge configured vc and used vc
    for (let vc of Object.keys(this.virtualCellCapacity)) {
      // configured but not used vc
      if (!vcInfos.hasOwnProperty(vc)) {
        vcInfos[vc] = {
          capacity: 0,
          usedCapacity: 0,
          numJobs: 0,
          resourceUsed: {
            memory: 0,
            vCores: 0,
            GPUs: 0,
          },
          resourceTotal: {
            memory: 0,
            vCores: 0,
            GPUs: 0,
          },
        };
      }

      vcInfos[vc].resourceTotal.memory = this.virtualCellCapacity.resourceTotal.memory;
      vcInfos[vc].resourceTotal.vCores = this.virtualCellCapacity.resourceTotal.cpu;
      vcInfos[vc].resourceTotal.GPUs = this.virtualCellCapacity.resourceTotal.gpu;
    }

    // add capacity and usedCapacity for compatibility
    for (let vc of Object.keys(vcInfos)) {
      vcInfos[vc].capacity = vcInfos[vc].resourceTotal.GPUs/vcConfig.clusterTotalGpu;
      vcInfos[vc].usedCapacity = vcInfos[vc].resourceUsed.GPUs/vcConfig.clusterTotalGpu;
    }
    return vcInfos;
  }

  async getVc(vcName) {
    const vcInfos = await this.getVcList();
    return vcInfos[vcName];
  }

  updateVc() {
    throw createError('Bad Request', 'NotImplementedError', 'updateVc not implemented in k8s');
  }

  stopVc() {
    throw createError('Bad Request', 'NotImplementedError', 'stopVc not implemented in k8s');
  }

  activeVc() {
    throw createError('Bad Request', 'NotImplementedError', 'activeVc not implemented in k8s');
  }

  removeVc() {
    throw createError('Bad Request', 'NotImplementedError', 'removeVc not implemented in k8s');
  }
}

const vc = new VirtualCluster();

// module exports
module.exports = {
  list: () => util.promisify(vc.getVcList.bind(vc))()
    .then((vcList) => vcList)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  get: (vcName) => util.promisify(vc.getVc.bind(vc))(vcName)
    .then((vcInfo) => vcInfo)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  getResourceUnits: vc.getResourceUnits.bind(vc),
  update: (vcName, vcCapacity, vcMaxCapacity) => util.promisify(vc.updateVc.bind(vc))(vcName, vcCapacity, vcMaxCapacity)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  stop: (vcName) => util.promisify(vc.stopVc.bind(vc))(vcName)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  activate: (vcName) => util.promisify(vc.activeVc.bind(vc))(vcName)
    .catch((err) => {
      throw createError.unknown(err);
    }),
  remove: (vcName) => util.promisify(vc.removeVc.bind(vc))(vcName)
    .catch((err) => {
      throw createError.unknown(err);
    }),
};
