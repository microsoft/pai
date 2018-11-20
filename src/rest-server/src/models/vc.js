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
const xml2js = require('xml2js');
const yarnConfig = require('../config/yarn');
const createError = require('../util/error');
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
          error = createError('Not Found', 'NoVirtualClusterError', `Virtual cluster ${name} is not found.`);
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
            next(null, createError('Internal Server Error', 'BadConfigurationError',
              `Scheduler type ${schedulerInfo.type} is not supported.`));
          }
        } catch (error) {
          next(null, error);
        }
      });
  }

  generateUpdateInfo(updateData) {
    let jsonBuilder = new xml2js.Builder({rootName:'sched-conf'});
    let data = [];
    if (updateData.hasOwnProperty("pendingAdd")) {
        for (let item of updateData["pendingAdd"]) {
            let singleQueue = {
                "queue-name": "root." + item,
                "params": {
                    "entry": {
                        "key": "capacity",
                        "value": updateData["pendingAdd"][item]
                    }
                }
            };
            data.push({"add-queue": singleQueue});
        }
    }
    if (updateData.hasOwnProperty("pendingUpdate")) {
        for (let item of updateData["pendingUpdate"]) {
            let singleQueue = {
                "queue-name": "root." + item,
                "params": {
                    "entry": {
                        "key": "capacity",
                        "value": updateData["pendingAdd"][item]
                    }
                }
            };
            data.push({"update-queue": singleQueue});
        }
    }
    return jsonBuilder.buildObject(data)
  }

  sendUpdateInfo(updateXml, callback) {
    logger.debug(updateXml)  
    unirest.put(yarnConfig.yarnVcUpdatePath)
        .headers(yarnConfig.webserviceUpdateQueueHeaders)
        .send(updateXml)
        .end((res) => {
        try {
          logger.debug(res.body);
          callback(res, null);
        } catch (error) {
          callback(null, error);
        }
      })
  }

  addVc(vcName, capacity, callback) {
    this.getVcList((vcList, err) => {
      if (err) {
        return callback(err);
      } else if (!vcList) {
        // Unreachable
        logger.warn('list virtual clusters error, no virtual cluster found');
      } else {
        if (vcList.hasOwnProperty(vcName)) {
          return callback(createError('Forbidden', 'NoVirtualClusterError', `Can't add a exist virtual cluster ${vcName}.`));
        }
        else if (!vcList.hasOwnProperty("default")){
          return callback(createError('Forbidden', 'NoVirtualClusterError', `No default vc found, can't allocate resource`));
        }
        else if (vcList["default"]<capacity) {
          return callback(createError('Forbidden', 'NoVirtualClusterError', `No enough resource`));
        }
        else {
          let data = {"pendingAdd": [], "pendingUpdate": []};
          let addQueue = {};
          addQueue[vcName] = capacity;
          data["pendingAdd"].push(addQueue);
          let updateQueue = {};
          updateQueue["default"] = vcList["default"] - capacity;
          data["pendingUpdate"].push(updateQueue);
          const vcdataXml = this.generateUpdateInfo(data);
          this.sendUpdateInfo(vcdataXml, (res, err) => {
              if(err){
                  return callback(err)
              }
          })

        }

      }
    })
  }


}

// module exports
module.exports = VirtualCluster;
