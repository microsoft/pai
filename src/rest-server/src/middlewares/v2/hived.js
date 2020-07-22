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
const createError = require('@pai/utils/error');
const logger = require('@pai/config/logger');
const hivedSchema = require('@pai/config/v2/hived');
const {resourceUnits} = require('@pai/config/vc');
const {hivedWebserviceUri} = require('@pai/config/launcher');


const convertPriority = (priorityClass='test') => {
  // TODO: make it a cluster-wise config
  // allowed range: [-1, 126], default priority 0
  const priorityMap = {
    crit: 120,
    prod: 100,
    test: 10,
    oppo: -1,
  };
  return priorityClass in priorityMap ? priorityMap[priorityClass] : null;
};

const skuToString = (sku) => {
  return `(${sku.gpu} GPU, ${sku.cpu} CPU, ${sku.memory}MB memory)`;
};

const getCellStatus = async (virtualCluster) => {
  let vcStatus;
  try {
    vcStatus = (await axios.get(`${hivedWebserviceUri}/v1/inspect/clusterstatus/virtualclusters/${virtualCluster}`)).data;
  } catch (error) {
    logger.warn('Failed to inspect vc from hived scheduler: ', error.response ? error.response.data : error);
    return {
      cellQuota: Number.MAX_SAFE_INTEGER,
      cellUnits: Object.values(resourceUnits),
    };
  }

  let cellQuota = 0;
  const cellUnits = [...new Set(vcStatus.map((cell) => cell.gpuType))]
    .filter((key) => key in resourceUnits)
    .reduce((arr, key) => ([...arr, resourceUnits[key]]), []);
  const cellQueue = [...vcStatus];
  while (cellQueue.length > 0) {
    const curr = cellQueue.shift();
    if (curr.cellPriority === -1) {
      continue;
    }
    if (curr.cellChildren) {
      cellQueue.push(...curr.cellChildren);
    } else {
      cellQuota += 1;
    }
  }
  return {cellQuota, cellUnits};
};

const hivedValidate = async (protocolObj, username) => {
  if (!hivedSchema.validate(protocolObj)) {
    throw createError('Bad Request', 'InvalidProtocolError', hivedSchema.validate.errors);
  }
  let hivedConfig = null;
  const affinityGroups = {};
  let opportunistic = false;
  const gangAllocation = ('extras' in protocolObj && protocolObj.extras.gangAllocation === false) ? false : true;
  const virtualCluster = ('defaults' in protocolObj && protocolObj.defaults.virtualCluster != null) ?
    protocolObj.defaults.virtualCluster : 'default';

  if ('extras' in protocolObj && 'hivedScheduler' in protocolObj.extras) {
    hivedConfig = protocolObj.extras.hivedScheduler;
    if (hivedConfig && hivedConfig.jobPriorityClass === 'oppo') {
      opportunistic = true;
    }

    for (let taskRole of Object.keys(hivedConfig.taskRoles || {})) {
      // must be a valid taskRole
      if (!(taskRole in protocolObj.taskRoles)) {
        throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Taskrole ${taskRole} does not exist.`
        );
      }

      const taskRoleConfig = hivedConfig.taskRoles[taskRole];
      // at most one of [pinnedCellId, skuType] allowed
      if (taskRoleConfig.pinnedCellId !== null && taskRoleConfig.skuType !== null) {
        throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Taskrole ${taskRole} has both pinnedCellId and skuType, only one allowed.`
        );
      }

      if (taskRoleConfig.skuType !== null && !(taskRoleConfig.skuType in resourceUnits)) {
        throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `Taskrole ${taskRole} has unknown skuType ${taskRoleConfig.skuType}, allow ${Object.keys(resourceUnits)}.`
        );
      }

      const affinityGroupName = taskRoleConfig.affinityGroupName;
      // affinityGroup should have uniform pinnedCellId and skuType
      if (affinityGroupName !== null) {
        if (affinityGroupName in affinityGroups) {
          if (taskRoleConfig.pinnedCellId === null) {
            taskRoleConfig.pinnedCellId = affinityGroups[affinityGroupName].pinnedCellId;
          }
          if (taskRoleConfig.skuType === null) {
            taskRoleConfig.skuType = affinityGroups[affinityGroupName].skuType;
          }
          if (taskRoleConfig.pinnedCellId !== affinityGroups[affinityGroupName].pinnedCellId ||
            taskRoleConfig.skuType !== affinityGroups[affinityGroupName].skuType) {
            throw createError(
              'Bad Request',
              'InvalidProtocolError',
              `AffinityGroup ${affinityGroupName} has inconsistent skuType or pinnedCellId.`
            );
          }
        } else {
          affinityGroups[affinityGroupName] = {
            pinnedCellId: taskRoleConfig.pinnedCellId,
            skuType: taskRoleConfig.skuType,
            affinityTaskList: [],
          };
        }
        const {gpu = 0, cpu} = protocolObj.taskRoles[taskRole].resourcePerInstance;
        affinityGroups[affinityGroupName].affinityTaskList.push({
          podNumber: protocolObj.taskRoles[taskRole].instances,
          gpuNumber: gpu === 0 ? cpu : gpu,
        });
      }
    }

    for (let affinityGroupName of Object.keys(affinityGroups)) {
      if (affinityGroups[affinityGroupName].skuType !== null &&
        affinityGroups[affinityGroupName].pinnedCellId !== null) {
        throw createError(
          'Bad Request',
          'InvalidProtocolError',
          `AffinityGroup ${affinityGroupName} has both pinnedCellId and skuType, only one allowed.`
        );
      }
    }
  }

  // generate default affinity group for the gang scheduling jobs
  let defaultAffinityGroup = null;
  if (!Object.keys(affinityGroups).length && gangAllocation) {
    defaultAffinityGroup = {
      affinityTaskList: Object.keys(protocolObj.taskRoles).map((taskRole) => {
        const {gpu = 0, cpu} = protocolObj.taskRoles[taskRole].resourcePerInstance;
        return {
          podNumber: protocolObj.taskRoles[taskRole].instances,
          gpuNumber: gpu === 0 ? cpu : gpu,
        };
      }),
    };
  }

  // generate podSpec for every taskRole
  let requestCellNumber = 0;
  const {cellQuota, cellUnits} = await getCellStatus(virtualCluster);
  const cellUnitsStr = cellUnits.map((unit) => skuToString(unit)).join(', ');
  for (let taskRole of Object.keys(protocolObj.taskRoles)) {
    const resourcePerCell = {};
    for (const t of ['gpu', 'cpu', 'memory']) {
      resourcePerCell[t] = Math.min(
        ...Array.from(opportunistic ? Object.values(resourceUnits) : cellUnits, (v) => v[t]));
    }

    const podSpec = {
      virtualCluster,
      priority: convertPriority(hivedConfig ? hivedConfig.jobPriorityClass : undefined),
      gpuType: null,
      pinnedCellId: null,
      gpuNumber: 0,
      affinityGroup: null,
    };
    if (hivedConfig && hivedConfig.taskRoles && taskRole in hivedConfig.taskRoles) {
      podSpec.gpuType = hivedConfig.taskRoles[taskRole].skuType;
      if (podSpec.gpuType !== null) {
        for (const t of ['gpu', 'cpu', 'memory']) {
          resourcePerCell[t] = resourceUnits[podSpec.gpuType][t];
        }
      }
      podSpec.pinnedCellId = hivedConfig.taskRoles[taskRole].pinnedCellId;

      const affinityGroupName = hivedConfig.taskRoles[taskRole].affinityGroupName;
      podSpec.affinityGroup = affinityGroupName ? {
        name: `${username}~${protocolObj.name}/${affinityGroupName}`,
        members: affinityGroups[affinityGroupName].affinityTaskList,
      } : null;
    }

    if (defaultAffinityGroup != null) {
      podSpec.affinityGroup = {
        name: `${username}~${protocolObj.name}/default`,
        members: defaultAffinityGroup.affinityTaskList,
      };
    }

    const {gpu = 0, cpu, memoryMB} = protocolObj.taskRoles[taskRole].resourcePerInstance;
    if (resourcePerCell.gpu === 0 && gpu > 0 ||
        resourcePerCell.cpu === 0 && cpu > 0 ||
        resourcePerCell.memory === 0 && memoryMB > 0) {
      throw createError(
        'Bad Request',
        'InvalidProtocolError',
        `Taskrole ${taskRole} requests (${gpu} GPU, ${cpu} CPU, ${memoryMB}MB memory), ` +
        `violate minimum sku ${skuToString(resourcePerCell)} per cell.`
      );
    }
    const cellNumber = Math.max(
      Math.ceil(gpu / resourcePerCell.gpu),
      Math.ceil(cpu / resourcePerCell.cpu),
      Math.ceil(memoryMB / resourcePerCell.memory),
    );
    podSpec.gpuNumber = cellNumber;
    requestCellNumber += protocolObj.taskRoles[taskRole].instances * cellNumber;

    protocolObj.taskRoles[taskRole].hivedPodSpec = podSpec;
  }

  if (requestCellNumber > cellQuota && gangAllocation && !opportunistic) {
    throw createError(
      'Bad Request',
      'InvalidProtocolError',
      `Job requests ${requestCellNumber} sku, violate ${cellQuota} sku [${cellUnitsStr}] quota in ${virtualCluster} VC.`
    );
  }

  return protocolObj;
};

module.exports = {
  validate: hivedValidate,
};
