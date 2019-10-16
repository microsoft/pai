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
const Joi = require('joi');
const launcherConfig = require('@pai/config/launcher');
const yaml = require('js-yaml');
const fs = require('fs');
const logger = require('@pai/config/logger');
const k8s = require('@pai/utils/k8sUtils');

// define the input schema for the 'create vc' api
const vcCreateInputSchema = Joi.object().keys({
  vcCapacity: Joi.number()
    .min(0)
    .max(100)
    .required(),
  vcMaxCapacity: Joi.number()
    .min(Joi.ref('vcCapacity'))
    .max(100)
    .optional(),
  description: Joi.string()
    .empty(''),
  externalName: Joi.string()
    .empty(''),
}).required();

// define the input schema for the 'put vc status' api
const vcStatusPutInputSchema = Joi.object().keys({
  vcStatus: Joi.string()
    .valid(['stopped', 'running'])
    .required(),
}).required();

const resourceUnits = {};
const virtualCellCapacity = {};
let clusterTotalGpu = 0;
const clusterNodeGpu = {};
if (launcherConfig.enabledHived) {
  let hivedObj;
  try {
    hivedObj = yaml.safeLoad(fs.readFileSync(launcherConfig.hivedSpecPath));
  } catch (_) {
    // TODO: this is a hardcode for demo, this exception shouldn't be catch and ignored
    hivedObj = {
      physicalCluster: {
        gpuTypes: {
          K80: {
            gpu: 1,
            cpu: 4,
            memory: '8192Mi',
          },
        },
        cellTypes: {
        },
        physicalCells: [],
      },
      virtualClusters: {
        default: {},
        },
    };
    logger.warn(`Hived spec not found or illegal: ${launcherConfig.hivedSpecPath}`);
    logger.warn(`Init hived spec to: `, JSON.stringify(hivedObj, undefined, 2));
  }

  const gpuTypes = hivedObj.physicalCluster.gpuTypes;
  const cellTypes = hivedObj.physicalCluster.cellTypes;
  const physicalCells = hivedObj.physicalCluster.physicalCells;
  const virtualClusters = hivedObj.virtualClusters;
  // generate gputype resource unit
  for (let gpuType of Object.keys(gpuTypes)) {
    resourceUnits[gpuType] = {
      cpu: k8s.atoi(gpuTypes[gpuType].cpu),
      memory: k8s.convertMemoryMb(gpuTypes[gpuType].memory),
      gpu: k8s.atoi(gpuTypes[gpuType].gpu),
    };
  }

  // generate cell type map, stored in cellTypeMap
  const cellTypeMap = {};
  // initialize cellTypeMap to leaves
  for (let gpuType of Object.keys(gpuTypes)) {
    cellTypeMap[gpuType] = {
      gpuType: gpuType,
      gpuNumber: gpuTypes[gpuType].gpu,
      childCellType: null,
    };
  }
  const addCellType = (cellType) => {
    if (cellTypeMap.hasOwnProperty(cellType)) {
      // already added
      return;
    }
    const spec = cellTypes[cellType];
    if (spec == null) {
      throw new Error(`hived error: leaf cell: ${cellType} not found in cell types`);
    }
    addCellType(spec.childCellType);
    const childEle = cellTypeMap[spec.childCellType];
    cellTypeMap[cellType] = {
      gpuType: childEle.gpuType,
      gpuNumber: childEle.gpuNumber * spec.childCellNumber,
      childCellType: spec.childCellType,
      isNode: spec.isNodeLevel === true,
    };
  };
  for (let cellType of Object.keys(cellTypes)) {
    addCellType(cellType);
  }

  // generate reservation info, stored in reservationCells
  const reservationCells = {};
  const addReservation = (cellInstance, cellType) => {
    if (!cellTypeMap.hasOwnProperty(cellType)) {
      throw new Error(`hived error: cellType: ${cellType} not found in cell types`);
    }
    if (cellInstance.hasOwnProperty('reservationId')) {
      const rId = cellInstance.reservationId;
      if (reservationCells.hasOwnProperty(rId)) {
        throw new Error(`hived error: duplicate reservationId found: ${rId}`);
      }
      reservationCells[rId] = cellType;
    }

    // recursively check cellChildren if not null or empty
    if (cellInstance.cellChildren) {
      for (let childCellInstance of cellInstance.cellChildren) {
        addReservation(childCellInstance, cellTypeMap[cellType].childCellType);
      }
    }
  };
  for (let cellInstance of physicalCells) {
    clusterTotalGpu += cellTypeMap[cellInstance.cellType].gpuNumber;
    addReservation(cellInstance, cellInstance.cellType);
  }

  // calculate vc quota
  for (let vc of Object.keys(virtualClusters)) {
    virtualCellCapacity[vc] = {
      resourcesTotal: {
        gpu: 0,
        memory: 0,
        cpu: 0,
      },
      resourcesShared: {
        gpu: 0,
        memory: 0,
        cpu: 0,
      },
      resourcesReserved: {
        gpu: 0,
        memory: 0,
        cpu: 0,
      },
    };
    if (virtualClusters[vc].hasOwnProperty('virtualCells')) {
      for (let vCell of virtualClusters[vc].virtualCells) {
        const cellTypeArray = vCell.cellType.split('.');
        const cellType = cellTypeArray[cellTypeArray.length-1];
        if (!cellTypeMap.hasOwnProperty(cellType)) {
          throw new Error(`hived error: cellType: ${cellType} not found in cell types`);
        }
        const cellGpu = cellTypeMap[cellType].gpuNumber * vCell.cellNumber;
        virtualCellCapacity[vc].resourcesShared.gpu += cellGpu;
        virtualCellCapacity[vc].resourcesShared.cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].cpu * cellGpu;
        virtualCellCapacity[vc].resourcesShared.memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
      }
    }
    if (virtualClusters[vc].hasOwnProperty('reservedCells')) {
      for (let vCell of virtualClusters[vc].reservedCells) {
        const rId = vCell.reservationId;
        if (!reservationCells.hasOwnProperty(rId)) {
          throw new Error(`hived error: reservationId: ${rId} not found in physical cells`);
        }
        const cellType = reservationCells[rId];
        const cellGpu = cellTypeMap[cellType].gpuNumber;
        virtualCellCapacity[vc].resourcesReserved.gpu += cellGpu;
        virtualCellCapacity[vc].resourcesReserved.cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].cpu * cellGpu;
        virtualCellCapacity[vc].resourcesReserved.memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
      }
    }
    virtualCellCapacity[vc].resourcesTotal.gpu = virtualCellCapacity[vc].resourcesShared.gpu + virtualCellCapacity[vc].resourcesReserved.gpu;
    virtualCellCapacity[vc].resourcesTotal.cpu = virtualCellCapacity[vc].resourcesShared.cpu + virtualCellCapacity[vc].resourcesReserved.cpu;
    virtualCellCapacity[vc].resourcesTotal.memory = virtualCellCapacity[vc].resourcesShared.memory + virtualCellCapacity[vc].resourcesReserved.memory;
  }

  // calculate every node resource, stored in clusterNodeGpu
  const addNodesInfo = (cellInstance, cellType) => {
    if (cellTypeMap[cellType].isNode) {
      const cellIp = cellInstance.cellAddress;
      const cellGpu = cellTypeMap[cellType].gpuNumber;
      clusterNodeGpu[cellIp] = {
        gpu: cellGpu,
      };
    }

    // recursively check cellChildren if not null or empty
    if (cellInstance.cellChildren) {
      for (let childCellInstance of cellInstance.cellChildren) {
        addNodesInfo(childCellInstance, cellTypeMap[cellType].childCellType);
      }
    }
  };
  for (let cellInstance of physicalCells) {
    addNodesInfo(cellInstance, cellInstance.cellType);
  }
}

const vcExports = {
  vcCreateInputSchema,
  vcStatusPutInputSchema,
};

if (launcherConfig.type === 'k8s') {
  vcExports.resourceUnits = resourceUnits;
  vcExports.virtualCellCapacity = virtualCellCapacity;
  vcExports.clusterTotalGpu = clusterTotalGpu;
  vcExports.clusterNodeGpu = clusterNodeGpu;
}

// module exports
module.exports = vcExports;
