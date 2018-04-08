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
const unirest = require('unirest');
const yarnConfig = require('../config/yarn');
const logger = require('../config/logger');

class VirtualCluster {
  constructor(name, next) {
    this.getVcList((vcList, error) => {
      if (error === null) {
        if (name in vcList) {
          for (let key of Object.keys(vcList[name])) {
            this[key] = vcList[name][key];
          }
        } else {
          error = new Error('VirtualClusterNotFound');
        }
      }
      next(this, error);
    });
  }

  getCapacitySchedulerInfo(queueInfo) {
    let queues = {};
    function traverse(queueInfo, queueDict) {
      if (queueInfo.type === 'capacitySchedulerLeafQueueInfo') {
        queueDict[queueInfo.queueName] = {
          capacity: queueInfo.absoluteCapacity,
          maxCapacity: queueInfo.absoluteMaxCapacity,
          usedCapacity: queueInfo.absoluteUsedCapacity,
          numActiveJobs: queueInfo.numActiveApplications,
          numJobs: queueInfo.numApplications,
          numPendingJobs: queueInfo.numPendingApplications,
          resourcesUsed: queueInfo.resourcesUsed,
        };
      } else {
        for (let i = 0; i < queueInfo.queues.queue.length; i++) {
            traverse(queueInfo.queues.queue[i], queueDict);
        }
      }
    }
    traverse(queueInfo, queues);
    return queues;
  }

  getVcList(next) {
    unirest.get(yarnConfig.yarnVcInfoPath)
      .headers(yarnConfig.webserviceRequestHeaders)
      .end((res) => {
        try {
          const resJson = typeof res.body === 'object' ?
              res.body : JSON.parse(res.body);
          const schedulerInfo = resJson.scheduler.schedulerInfo;
          if (schedulerInfo.type === 'capacityScheduler') {
            const vcInfo = this.getCapacitySchedulerInfo(schedulerInfo);
            next(vcInfo, null);
          } else {
            logger.warn(`unsupported scheduler type: ${schedulerInfo.type}`);
            next(null, new Error('InternalServerError'));
          }
        } catch (error) {
          next(null, error);
        }
      });
  }
}

// module exports
module.exports = VirtualCluster;
