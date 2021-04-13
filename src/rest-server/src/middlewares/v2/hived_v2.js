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
const _ = require('lodash');
const createError = require('@pai/utils/error');
const logger = require('@pai/config/logger');
const { schemaValidate } = require('@pai/config/v2/hived_v2');
const { resourceUnits } = require('@pai/config/vc');
const { hivedWebserviceUri } = require('@pai/config/launcher');

const convertPriority = (priorityClass = 'test') => {
  // TODO: make it a cluster-wise config
  // allowed range: [-1, 126], default priority 10
  const priorityMap = {
    crit: 120,
    prod: 100,
    test: 10,
    oppo: -1,
  };
  return priorityClass in priorityMap ? priorityMap[priorityClass] : null;
};

const initVcCellInfo = (cellList, vcCellInfo) => {
  for (const cell of cellList) {
    const cellType = cell.cellType
    if (!(cellType in vcCellInfo)) {
      vcCellInfo[cellType] = { quota: 0, gpu: 0, memory: 0, cpu: 0 }
    }
    if (cell.cellChildren) {
      vcCellInfo[cellType].isLeafCell = false
      initVcCellInfo(cell.cellChildren, vcCellInfo)
    } else {
      vcCellInfo[cellType].isLeafCell = true
    }
  }
}

const calculateQuota = (cellList, vcCellInfo) => {
  for (const cell of cellList) {
    const cellType = cell.cellType
    vcCellInfo[cellType].quota += 1
    if (cell.cellChildren) {
      calculateQuota(cell.cellChildren, vcCellInfo)
    }
  }
}

const calculateResource = (cellList, vcCellInfo) => {
  for (const cell of cellList) {
    const cellType = cell.cellType
    // once resource is calculated, we can skip the following calculation for this type
    if (vcCellInfo[cellType].gpu > 0 || vcCellInfo[cellType].cpu > 0 || vcCellInfo[cellType].memory > 0) {
      continue
    }
    if (cell.cellChildren) {
      calculateResource(cell.cellChildren, vcCellInfo)
      const childCellType = cell.cellChildren[0].cellType
      const childCellNumber = cell.cellChildren.length
      vcCellInfo[cellType].gpu = vcCellInfo[childCellType].gpu * childCellNumber
      vcCellInfo[cellType].cpu = vcCellInfo[childCellType].cpu * childCellNumber
      vcCellInfo[cellType].memory = vcCellInfo[childCellType].memory * childCellNumber
    } else {
      vcCellInfo[cellType].gpu = resourceUnits[cellType].gpu
      vcCellInfo[cellType].cpu = resourceUnits[cellType].cpu
      vcCellInfo[cellType].memory = resourceUnits[cellType].memory
    }
  }
}

const getVcCellInfo = async (virtualCluster) => {
  // Return vcCellInfo. It is a map:
  //  key: cell type at all levels in this vc
  //  value: { isLeafCell: bool, quota: <maximum number at this level>, gpu: number; cpu: number; memory: number }
  let vcStatus;
  try {
    vcStatus = (
      await axios.get(
        `${hivedWebserviceUri}/v1/inspect/clusterstatus/virtualclusters/${virtualCluster}`,
      )
    ).data;
  } catch (error) {
    throw createError('Internal Server Error', 'CannotReachHiveDScheduler', error.response ? error.response.data : error)
  }

  // use resourceUnits to filter unknown leaf cell type
  vcStatus = vcStatus.filter((cell) => cell.leafCellType in resourceUnits)
  const vcCellInfo = {}
  initVcCellInfo(vcStatus, vcCellInfo)
  calculateQuota(vcStatus, vcCellInfo)
  calculateResource(vcStatus, vcCellInfo)
  return vcCellInfo
};

// if sku num is set, we use the sku num directly
// if sku num is not set, we calculate it from taskRoles.resourcePerInstance.{gpu, cpu, memeory}
// before this function is called, skuNum and skuType could be null
// after this function is called, skuNum can't be null, skuType could also be null
const calculateSkuNum = (protocolObj, opportunistic, vcCellInfo) => {
  const hivedConfig = _.get(protocolObj, 'extras.hivedScheduler');
  for (const taskRole of _.keys(protocolObj.taskRoles)) {
    const taskroleResourceSpec = hivedConfig.taskRoles[taskRole].resourcePerInstance
    if (taskroleResourceSpec.skuNum === null) {
      // resource per cell is the resource provided by cluster
      // if skuType is not null, it is the corresponding skuType's resource
      // if skuType is null and opportunistic is false, it is the minimum resource unit in the VC:
      // if skuType is null and opportunistic is false, it is the minimum resource unit the cluster:
      const resourcePerCell = {};
      for (const t of ['gpu', 'cpu', 'memory']) {
        if (taskroleResourceSpec.skuType !== null) {
          // notice: taskroleResourceSpec.skuType can be non-leaf cell level sku type
          resourcePerCell[t] = vcCellInfo[taskroleResourceSpec.skuType][t];
        } else {
          if (opportunistic) {
             resourcePerCell[t] = _.min(_.values(resourceUnits).map(unit => _.get(unit, t)))
          } else {
            resourcePerCell[t] = _.min(_.values(vcCellInfo).filter(cellInfo => cellInfo.isLeafCell).map(cellInfo => _.get(cellInfo, t)))
          }
        }
      }
      // handle empty resource
      const { gpu = 0, cpu, memoryMB } = protocolObj.taskRoles[
        taskRole
      ].resourcePerInstance;
      let requestedResource = '';
      let emptyResource = '';
      if (resourcePerCell.gpu === 0 && gpu > 0) {
        requestedResource = gpu;
        emptyResource = 'GPU';
      } else if (resourcePerCell.cpu === 0 && cpu > 0) {
        requestedResource = cpu;
        emptyResource = 'CPU';
      } else if (resourcePerCell.memory === 0 && memoryMB > 0) {
        requestedResource = memoryMB;
        emptyResource = 'memory';
      }
      if (emptyResource !== '') {
        throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Taskrole ${taskRole} requests ${requestedResource} ${emptyResource}, but SKU does not ` +
            `configure ${emptyResource}. Please contact admin if the taskrole needs ${emptyResource} resources.`,
        );
      }
      const skuNum = _.max([
        gpu === 0 ? 0 : _.ceil(gpu / resourcePerCell.gpu),
        cpu === 0 ? 0 : _.ceil(cpu / resourcePerCell.cpu),
        memoryMB === 0 ? 0 : _.ceil(memoryMB / resourcePerCell.memory),
      ]);
      taskroleResourceSpec.skuNum = skuNum
    }
  }
}


const validateSkuType = (hivedConfig, opportunistic, vcCellInfo) => {
  // TODO:
  //  1. for opportunistic job, it can use all types of cells in the cluster.
  //  Currently we do not gather such information, leave the validation to future work.
  //  2. skuType here should only allow cell level which is lower than node.
  for (const taskRole of _.keys(hivedConfig.taskRoles)) {
    const skuType = hivedConfig.taskRoles[taskRole].resourcePerInstance.skuType
    if (skuType === null) {
      continue
    }
    if (!opportunistic && !(skuType in vcCellInfo)) {
      throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Taskrole ${taskRole} has unknown skuType ${skuType}`,
      );
    }
  }
}

const validateWithinOne = (hivedConfig, opportunistic, vcCellInfo) => {
  // TODO: for opportunistic job, it can use all types of cells in the cluster.
  // Currently we do not gather such information, leave the validation to future work.
  for (const taskRole of _.keys(hivedConfig.taskRoles)) {
    const withinOneCell = hivedConfig.taskRoles[taskRole].withinOne
    if (withinOneCell === null) {
      continue
    }
    if (!opportunistic && !(withinOneCell in vcCellInfo)) {
      throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Taskrole ${taskRole} has unknown withinOne cell type ${withinOneCell}`,
      );
    }
  }
  for (const taskRoleGroup of _.get(hivedConfig, 'taskRoleGroups', [])) {
    const withinOneCell = taskRoleGroup.withinOne
    if (withinOneCell === null) {
      continue
    }
    if (!opportunistic && !(withinOneCell in vcCellInfo)) {
      throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Taskrole group ${taskRoleGroup.taskRoles} has unknown withinOne cell type ${withinOneCell}`,
      );
    }
  }
}


const hivedValidate = async (protocolObj, username) => {
  const [isSchemaOK, schemaError] = schemaValidate(protocolObj)
  if (!isSchemaOK) {
    throw createError(
      'Bad Request',
      'InvalidProtocolError',
      schemaError,
    );
  }

  const hivedConfig = _.get(protocolObj, 'extras.hivedScheduler');
  const opportunistic = !!(_.get(hivedConfig, 'jobPriorityClass') === 'oppo');
  // for v2 schema, gangAllocation can be true, false, null
  let gangAllocation = _.get(protocolObj, 'extras.gangAllocation', null)
  if ( gangAllocation !== true || gangAllocation !== false || gangAllocation !== null ) {
    gangAllocation = null
  }
  const virtualCluster = _.get(protocolObj, 'defaults.virtualCluster', 'default');
  const vcCellInfo = await getVcCellInfo(virtualCluster);
  logger.info(vcCellInfo)
  validateSkuType(hivedConfig, opportunistic, vcCellInfo)
  validateWithinOne(hivedConfig, opportunistic, vcCellInfo)
  calculateSkuNum(protocolObj, opportunistic, vcCellInfo)

  throw createError(
      'Bad Request',
      'V2 OK',
      `V2 OK!`,
    );
  return protocolObj
}


const isV2Schema = (protocolObj) => {
  const taskRoles = _.get(protocolObj, 'extras.hivedScheduler.taskRoles', null);
  if (_.isObject(taskRoles)) {
    for (const taskrole in taskRoles) {
      if (_.has(taskRoles[taskrole], 'skuType') || _.has(taskRoles[taskrole], 'skuNum')){
        return false;
      }
    }
  }
  return true;
}


module.exports = {
  validate: hivedValidate,
  isV2Schema: isV2Schema,
};
