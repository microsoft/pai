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


class Vc {
  constructor(name, next) {
    this.getVcList((vcList, error) = > {
      if(error === null) {
        if (name in vcList) {
          for (let key of Object.keys(vcList[name])) {
            this[key] = vcList[name][key];
          }
        } else {
          error = new Error('VcNotFound');
        }
      }
      next(this, error);
    });
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
            const vcInfo = getCapacitySchedulerInfo(schedulerInfo);
            next(vcInfo);
          } else {
            next(null, new Error('InternalServerError'));
          }
        } catch (error) {
          next(null, error);
        }
      });
  }

  getCapacitySchedulerInfo(queueInfo) {
    let queues = {};
    function traverse(queueInfo, queueDict) {
      if (queueInfo.type === 'capacitySchedulerLeafQueueInfo') {
        queueInfo.map((queueInfo) => {
          name: queueInfo.queueName,
          absoluteCapacity: queueInfo.absoluteCapacity,
          absoluteMaxCapacity: queueInfo.absoluteMaxCapacity,
          absoluteUsedCapacity: queueInfo.absoluteUsedCapacity,
          capacity: queueInfo.capacity,
          maxApplications: queueInfo.maxApplications,
          maxApplicationsPerUser: queueInfo.maxApplicationsPerUser,
          maxCapacity: queueInfo.maxCapacity,
          numActiveApplications: queueInfo.numActiveApplications,
          numApplications: queueInfo.numApplications,
          numContainers: queueInfo.numContainers,
          numPendingApplications: queueInfo.numPendingApplications,
          resourcesUsed: queueInfo.resourcesUsed,
          state: queueInfo.state,
          usedCapacity: queueInfo.usedCapacity,
        });
        queueDict[queueInfo.queueName] = queueInfo;
      } else {
        for (var queue in queueInfo.queues) {
            traverse(queue, queueDict);
        }
      }
    };
    traverse(queueInfo, queues);
    return queues;
  }
}

// module exports
module.exports = Vc;