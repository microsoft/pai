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
  getCapacitySchedulerInfo(queueInfo) {
    let queues = {};

    function traverse(queueInfo, queueDict) {
      if (queueInfo.type === 'capacitySchedulerLeafQueueInfo') {
        queueDict[queueInfo.queueName] = {
          capacity: Math.round(queueInfo.absoluteCapacity),
          maxCapacity: Math.round(queueInfo.absoluteMaxCapacity),
          usedCapacity: queueInfo.absoluteUsedCapacity,
          numActiveJobs: queueInfo.numActiveApplications,
          numJobs: queueInfo.numApplications,
          numPendingJobs: queueInfo.numPendingApplications,
          resourcesUsed: queueInfo.resourcesUsed,
          status: queueInfo.state,
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

  getVcListPromise() {
    return new Promise((res, rej) => {
      unirest.get(yarnConfig.yarnVcInfoPath)
        .headers(yarnConfig.webserviceRequestHeaders)
        .end((response) => {
          if (response.error) {
            rej(response.error);
          } else {
            res(response.body);
          }
        });
    });
  }

  async getVcListAsyc() {
    try {
      const response = await this.getVcListPromise();
      // eslint-disable-next-line no-console
      console.log(response);
      const resJson = typeof response.body === 'object' ?
        response.body : JSON.parse(response.body);
      // eslint-disable-next-line no-console
      console.log(resJson);
      const schedulerInfo = resJson.scheduler.schedulerInfo;
      if (schedulerInfo.type === 'capacityScheduler') {
        const vcInfo = this.getCapacitySchedulerInfo(schedulerInfo);
        return vcInfo;
      } else {
        throw createError('Internal Server Error', 'BadConfigurationError',
          `Scheduler type ${schedulerInfo.type} is not supported.`);
      }
    } catch (error) {
      throw error;
    }
  }

  generateUpdateInfo(updateData) {
    let jsonBuilder = new xml2js.Builder({rootName: 'sched-conf'});
    let data = [];
    for (let action of Object.keys(updateData)) {
      if (action === 'remove-queue') {
        for (let vcName of Object.keys(updateData[action])) {
          data.push({[action]: 'root.' + vcName});
        }
      } else {
        for (let vcName of Object.keys(updateData[action])) {
          let singleQueue = {
            'queue-name': 'root.' + vcName,
            'params': {
              'entry': [],
            },
          };
          for (let paramKey of Object.keys(updateData[action][vcName])) {
            singleQueue['params']['entry'].push({
                'key': paramKey,
                'value': updateData[action][vcName][paramKey],
              },
            );
          }
          data.push({[action]: singleQueue});
        }
      }
    }

    return jsonBuilder.buildObject(data);
  }

  sendUpdateInfo(updateXml, callback) {
    unirest.put(yarnConfig.yarnVcUpdatePath)
      .headers(yarnConfig.webserviceUpdateQueueHeaders)
      .send(updateXml)
      .end((res) => {
        if (res.ok) {
          return callback(null);
        } else {
          return callback(createError('Internal Server Error', 'UnknownError', res.body));
        }
      });
  }

  getVc(vcName, callback) {
    this.getVcList((vcList, err) => {
      if (err) {
        return callback(err);
      } else if (!vcList) {
        // Unreachable
        logger.warn('list virtual clusters error, no virtual cluster found');
      } else if (!vcList.hasOwnProperty(vcName)) {
        return callback(null, createError('Not Found', 'NoVirtualClusterError', `Vc ${vcName} not found`));
      } else {
        return callback(vcList[vcName], null);
      }
    });
  }

  updateVc(vcName, capacity, maxCapacity, callback) {
    this.getVcList((vcList, err) => {
      if (err) {
        return callback(err);
      } else if (!vcList) {
        // Unreachable
        logger.warn('list virtual clusters error, no virtual cluster found');
      } else {
        if (!vcList.hasOwnProperty('default')) {
          return callback(createError('Not Found', 'NoVirtualClusterError', `No default vc found, can't allocate quota`));
        } else {
          let defaultQuotaIfUpdated = vcList['default']['capacity'] + (vcList[vcName] ? vcList[vcName]['capacity'] : 0) - capacity;
          if (defaultQuotaIfUpdated < 0) {
            return callback(createError('Forbidden', 'NoEnoughQuotaError', `No enough quota`));
          }

          let data = {'add-queue': {}, 'update-queue': {}};
          if (vcList.hasOwnProperty(vcName)) {
            data['update-queue'][vcName] = {
              'capacity': capacity,
              'maximum-capacity': maxCapacity,
            };
          } else {
            data['add-queue'][vcName] = {
              'capacity': capacity,
              'maximum-capacity': maxCapacity,
            };
          }
          data['update-queue']['default'] = {
            'capacity': defaultQuotaIfUpdated,
            'maximum-capacity': defaultQuotaIfUpdated,
          };

          // logger.debug('raw data to generate: ', data);
          const vcdataXml = this.generateUpdateInfo(data);
          // logger.debug('Xml send to yarn: ', vcdataXml);
          this.sendUpdateInfo(vcdataXml, (err) => {
            if (err) {
              return callback(err);
            } else {
              return callback(null);
            }
          });
        }
      }
    });
  }

  stopVc(vcName, callback) {
    this.getVcList((vcList, err) => {
      if (err) {
        return callback(err);
      } else if (!vcList) {
        // Unreachable
        logger.warn('list virtual clusters error, no virtual cluster found');
      } else {
        if (!vcList.hasOwnProperty(vcName)) {
          return callback(createError('Not Found', 'NoVirtualClusterError', `Vc ${vcName} not found, can't stop`));
        } else {
          let data = {
            'update-queue': {
              [vcName]: {
                'state': 'STOPPED',
              },
            },
          };

          // logger.debug('raw data to generate: ', data);
          const vcdataXml = this.generateUpdateInfo(data);
          // logger.debug('Xml send to yarn: ', vcdataXml);
          this.sendUpdateInfo(vcdataXml, (err) => {
            if (err) {
              return callback(err);
            } else {
              return callback(null);
            }
          });
        }
      }
    });
  }

  activeVc(vcName, callback) {
    this.getVcList((vcList, err) => {
      if (err) {
        return callback(err);
      } else if (!vcList) {
        // Unreachable
        logger.warn('list virtual clusters error, no virtual cluster found');
      } else {
        if (!vcList.hasOwnProperty(vcName)) {
          return callback(createError('Not Found', 'NoVirtualClusterError', `Vc ${vcName} not found, can't active`));
        } else {
          let data = {
            'update-queue': {
              [vcName]: {
                'state': 'RUNNING',
              },
            },
          };

          // logger.debug('raw data to generate: ', data);
          const vcdataXml = this.generateUpdateInfo(data);
          // logger.debug('Xml send to yarn: ', vcdataXml);
          this.sendUpdateInfo(vcdataXml, (err) => {
            if (err) {
              return callback(err);
            } else {
              return callback(null);
            }
          });
        }
      }
    });
  }

  removeVc(vcName, callback) {
    this.getVcList((vcList, err) => {
      if (err) {
        return callback(err);
      } else if (!vcList) {
        // Unreachable
        logger.warn('list virtual clusters error, no virtual cluster found');
      } else {
        if (!vcList.hasOwnProperty('default')) {
          return callback(createError('Not Found', 'NoVirtualClusterError', `No default vc found, can't free quota`));
        } else if (!vcList.hasOwnProperty(vcName)) {
          return callback(createError('Not Found', 'NoVirtualClusterError', `Can't delete a nonexistent vc ${vcName}`));
        } else if (vcList[vcName]['numJobs'] > 0) {
          return callback(createError('Forbidden', 'RemoveRunningVcError',
            `Can't delete vc ${vcName}, ${vcList[vcName]['numJobs']} jobs are running, stop them before delete vc`));
        } else {
          this.stopVc(vcName, (err) => {
            if (err) {
              return callback(err);
            } else {
              let defaultQuotaIfUpdated = vcList['default']['capacity'] + vcList[vcName]['capacity'];
              let data = {
                'update-queue': {
                  [vcName]: {
                    'capacity': 0,
                    'maximum-capacity': 0,
                  },
                  'default': {
                    'capacity': defaultQuotaIfUpdated,
                    'maximum-capacity': defaultQuotaIfUpdated,
                  },
                },
                'remove-queue': {
                  [vcName]: null,
                },
              };

              // logger.debug('Raw data to generate: ', data);
              const vcdataXml = this.generateUpdateInfo(data);
              // logger.debug('Xml send to yarn: ', vcdataXml);
              this.sendUpdateInfo(vcdataXml, (err) => {
                if (err) {
                  this.activeVc(vcName, (errInfo) => {
                    if (errInfo) {
                      return callback(errInfo);
                    } else {
                      return callback(err);
                    }
                  });
                } else {
                  return callback(null);
                }
              });
            }
          });
        }
      }
    });
  }
}

// module exports
module.exports = VirtualCluster;
