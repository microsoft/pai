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
const unirest = require('unirest');
const xml2js = require('xml2js');
const yarnConfig = require('@pai/config/yarn');
const createError = require('@pai/utils/error');
const logger = require('@pai/config/logger');

class VirtualCluster {
  getCapacitySchedulerInfo(queueInfo) {
    let queues = {};

    function traverse(queueInfo, queueDict) {
      if (queueInfo.type === 'capacitySchedulerLeafQueueInfo') {
        let queueDefaultLabel = queueInfo.defaultNodeLabelExpression;
        if (typeof queueDefaultLabel === 'undefined' || queueDefaultLabel === '<DEFAULT_PARTITION>') {
          queueDefaultLabel = '';
        }
        let defaultPartitionInfo = null;
        for (let partition of queueInfo.capacities.queueCapacitiesByPartition) {
          if (partition.partitionName === queueDefaultLabel) {
            defaultPartitionInfo = partition;
            break;
          }
        }
        let defaultPartitionResource = null;
        for (let partition of queueInfo.resources.resourceUsagesByPartition) {
          if (partition.partitionName === queueDefaultLabel) {
            defaultPartitionResource = partition;
            break;
          }
        }

        queueDict[queueInfo.queueName] = {
          capacity: defaultPartitionInfo.absoluteCapacity,
          maxCapacity: defaultPartitionInfo.absoluteMaxCapacity,
          usedCapacity: defaultPartitionInfo.absoluteUsedCapacity,
          numActiveJobs: queueInfo.numActiveApplications,
          numJobs: queueInfo.numApplications,
          numPendingJobs: queueInfo.numPendingApplications,
          resourcesUsed: defaultPartitionResource.used,
          status: queueInfo.state,
          defaultLabel: queueDefaultLabel,
          dedicated: queueDefaultLabel !== '',
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

  getResourceByLabel(nodeInfo) {
    let resourceByLabel = {};
    for (let node of nodeInfo) {
      let nodeLabel = node.nodeLabels || [''];
      nodeLabel = nodeLabel[0];
      if (!resourceByLabel.hasOwnProperty(nodeLabel)) {
        resourceByLabel[nodeLabel] = {
          vCores: 0,
          memory: 0,
          GPUs: 0,
        };
      }
      resourceByLabel[nodeLabel].vCores += node.usedVirtualCores + node.availableVirtualCores;
      resourceByLabel[nodeLabel].memory += node.usedMemoryMB + node.availMemoryMB;
      resourceByLabel[nodeLabel].GPUs += node.usedGPUs + node.availableGPUs;
    }
    return resourceByLabel;
  }

  getNodesByLabel(nodeInfo) {
    let nodesByLabel = {};
    for (let node of nodeInfo) {
      let nodeLabel = node.nodeLabels || [''];
      nodeLabel = nodeLabel[0];
      let nodeHostName = node.nodeHostName;
      if (!nodesByLabel.hasOwnProperty(nodeLabel)) {
        nodesByLabel[nodeLabel] = [];
      }
      nodesByLabel[nodeLabel].push(nodeHostName);
    }
    return nodesByLabel;
  }

  addDedicatedInfo(vcInfo, next) {
    unirest.get(yarnConfig.yarnNodeInfoPath)
      .headers(yarnConfig.webserviceRequestHeaders)
      .end((res) => {
        try {
          const resJson = typeof res.body === 'object' ?
            res.body : JSON.parse(res.body);
          let nodeInfo = [];
          if (resJson.nodes && resJson.nodes.node) {
            nodeInfo = resJson.nodes.node;
          }
          let labeledResource = this.getResourceByLabel(nodeInfo);
          let labeledNodes = this.getNodesByLabel(nodeInfo);
          for (let vcName of Object.keys(vcInfo)) {
            let resourcesTotal = {
              vCores: 0,
              memory: 0,
              GPUs: 0,
            };
            let vcLabel = vcInfo[vcName].defaultLabel;
            delete vcInfo[vcName].defaultLabel;
            if (labeledResource.hasOwnProperty(vcLabel)) {
              let p = vcInfo[vcName].capacity;
              resourcesTotal.vCores = labeledResource[vcLabel].vCores * p / 100;
              resourcesTotal.memory = labeledResource[vcLabel].memory * p / 100;
              resourcesTotal.GPUs = labeledResource[vcLabel].GPUs * p / 100;
            }
            vcInfo[vcName].resourcesTotal = resourcesTotal;
            vcInfo[vcName].nodeList = labeledNodes[vcLabel] || [];
          }
          next(null, vcInfo);
        } catch (error) {
          next(error);
        }
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
            let vcInfo = this.getCapacitySchedulerInfo(schedulerInfo);
            // next(vcInfo, null);
            this.addDedicatedInfo(vcInfo, next);
          } else {
            next(createError('Internal Server Error', 'BadConfigurationError',
              `Scheduler type ${schedulerInfo.type} is not supported.`));
          }
        } catch (error) {
          next(error);
        }
      });
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
    this.getVcList((err, vcList) => {
      if (err) {
        return callback(err);
      } else if (!vcList) {
        // Unreachable
        logger.warn('list virtual clusters error, no virtual cluster found');
      } else if (!vcList.hasOwnProperty(vcName)) {
        return callback(createError('Not Found', 'NoVirtualClusterError', `Vc ${vcName} not found`));
      } else {
        return callback(null, vcList[vcName]);
      }
    });
  }

  getResourceUnits() {
    // TODO: get it from yarn or cluster configuration
    throw createError('Bad Request', 'NotImplementedError', 'getResourceUnits not implemented in yarn');
  }

  async getNodeResource(next) {
    unirest.get(yarnConfig.yarnNodeInfoPath)
      .headers(yarnConfig.webserviceRequestHeaders)
      .end((res) => {
        try {
          const resJson = typeof res.body === 'object' ?
            res.body : JSON.parse(res.body);
          let nodeInfo = [];
          if (resJson.nodes && resJson.nodes.node) {
            nodeInfo = resJson.nodes.node;
          }
          const nodeResource = {};
          for (let node of nodeInfo) {
            nodeResource[node.nodeHostName] = {
              gpuTotal: node.usedGPUs + node.availableGPUs,
              gpuUsed: node.usedGPUs,
              gpuAvaiable: node.availableGPUs,
            };
          }
          next(null, nodeResource);
        } catch (error) {
          next(error);
        }
    });
  }

  updateVc(vcName, capacity, maxCapacity, callback) {
    this.getVcList((err, vcList) => {
      if (err) {
        return callback(err);
      } else if (!vcList) {
        // Unreachable
        logger.warn('list virtual clusters error, no virtual cluster found');
      } else {
        if (!vcList.hasOwnProperty('default')) {
          return callback(createError('Not Found', 'NoVirtualClusterError', `No default vc found, can't allocate quota`));
        } else {
          // let defaultQuotaIfUpdated = vcList['default']['capacity'] + (vcList[vcName] ? vcList[vcName]['capacity'] : 0) - capacity;
          let defaultQuotaIfUpdated = 100.0;
          defaultQuotaIfUpdated -= capacity;
          for (let vc of Object.keys(vcList)) {
            if (vc !== vcName && vc !== 'default' && vcList[vc].dedicated === false) {
              defaultQuotaIfUpdated -= vcList[vc].capacity;
            }
          }
          if (defaultQuotaIfUpdated < 0) {
            return callback(createError('Forbidden', 'NoEnoughQuotaError', `No enough quota`));
          }
          let data = {'add-queue': {}, 'update-queue': {}};
          if (vcList.hasOwnProperty(vcName)) {
            if (vcList[vcName].dedicated) {
              return callback(createError('Forbidden', 'ReadOnlyVcError', `Dedicated vc is read-only, can't be updated by rest-api`));
            }
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
          if (vcList.default.maxCapacity === 100 || vcList.default.maxCapacity > vcList.default.capacity) {
            data['update-queue']['default']['maximum-capacity'] = 100;
          }

          // logger.debug('raw data to generate: ', data);
          const vcdataXml = this.generateUpdateInfo(data);
          // logger.debug('Xml send to yarn: ', vcdataXml);
          this.sendUpdateInfo(vcdataXml, async (err) => {
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
    this.getVcList((err, vcList) => {
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
    this.getVcList((err, vcList) => {
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
    this.getVcList((err, vcList) => {
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
        } else if (vcList[vcName].dedicated) {
          return callback(createError('Forbidden', 'ReadOnlyVcError', `Dedicated vc is read-only, can't be removed by rest-api`));
        } else if (vcList[vcName]['numJobs'] > 0) {
          return callback(createError('Forbidden', 'RemoveRunningVcError',
            `Can't delete vc ${vcName}, ${vcList[vcName]['numJobs']} jobs are running, stop them before delete vc`));
        } else {
          this.stopVc(vcName, (err) => {
            if (err) {
              return callback(err);
            } else {
              let defaultQuotaIfUpdated = 100.0;
              for (let vc of Object.keys(vcList)) {
                if (vc !== vcName && vc !== 'default' && vcList[vc].dedicated === false) {
                  defaultQuotaIfUpdated -= vcList[vc].capacity;
                }
              }
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
              if (vcList.default.maxCapacity === 100 || vcList.default.maxCapacity > vcList.default.capacity) {
                data['update-queue']['default']['maximum-capacity'] = 100;
              }

              // logger.debug('Raw data to generate: ', data);
              const vcdataXml = this.generateUpdateInfo(data);
              // logger.debug('Xml send to yarn: ', vcdataXml);
              this.sendUpdateInfo(vcdataXml, async (err) => {
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
  getNodeResource: () => util.promisify(vc.getNodeResource.bind(vc))()
    .then((nodeResource) => nodeResource)
    .catch((err) => {
      throw createError.unknown(err);
    }),
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
