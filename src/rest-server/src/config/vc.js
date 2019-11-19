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
      types: {},
    };
    if (virtualClusters[vc].hasOwnProperty('virtualCells')) {
      for (let vCell of virtualClusters[vc].virtualCells) {
        const cellType = vCell.cellType.split('.').slice(-1)[0];
        if (!cellTypeMap.hasOwnProperty(cellType)) {
          throw new Error(`hived error: cellType: ${cellType} not found in cell types`);
        }
        if (!(cellType in virtualCellCapacity[vc].types)) {
          virtualCellCapacity[vc].types[cellType] = {
            cpu: 0,
            memory: 0,
            gpu: 0,
          };
        }
        const cellGpu = cellTypeMap[cellType].gpuNumber * vCell.cellNumber;
        virtualCellCapacity[vc].types[cellType].gpu += cellGpu;
        virtualCellCapacity[vc].types[cellType].cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].cpu * cellGpu;
        virtualCellCapacity[vc].types[cellType].memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
      }
    }
    if (virtualClusters[vc].hasOwnProperty('reservedCells')) {
      for (let vCell of virtualClusters[vc].reservedCells) {
        const rId = vCell.reservationId;
        const cellType = reservationCells[rId];
        if (!reservationCells.hasOwnProperty(rId)) {
          throw new Error(`hived error: reservationId: ${rId} not found in physical cells`);
        }
        if (!(rId in virtualCellCapacity[vc].types)) {
          virtualCellCapacity[vc].types[rId] = {
            cpu: 0,
            memory: 0,
            gpu: 0,
          };
        }
        const cellGpu = cellTypeMap[cellType].gpuNumber;
        virtualCellCapacity[vc].types[rId].gpu += cellGpu;
        virtualCellCapacity[vc].types[rId].cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].cpu * cellGpu;
        virtualCellCapacity[vc].types[rId].memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
      }
    }
  }

  // calculate every node resource, stored in clusterNodeGpu
  const addNodesInfo = (cellInstance, cellType) => {
    if (cellTypeMap[cellType].isNode) {
      const cellIp = cellInstance.cellAddress;
      const cellGpu = cellTypeMap[cellType].gpuNumber;
      clusterNodeGpu[cellIp] = {
        gpu: cellGpu,
        bindings: {},
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

  const bindings = {
    virtual: {},
    reserved: {},
  };
  for (let physicalCell of physicalCells) {
    if (!(physicalCell.cellType in bindings.virtual)) {
      bindings.virtual[physicalCell.cellType] = [];
    }
    for (let cellChild of physicalCell.cellChildren) {
      if (cellChild.reservationId) {
        if (!(cellChild.reservationId in bindings.reserved)) {
          bindings.reserved[cellChild.reservationId] = [];
        }
        bindings.reserved[cellChild.reservationId].push(cellChild.cellAddress);
      } else if (cellChild.cellAddress) {
        bindings.virtual[physicalCell.cellType].push(cellChild.cellAddress);
      }
    }
  }
  for (let vc of Object.keys(virtualClusters)) {
    if ('virtualCells' in virtualClusters[vc]) {
      for (let virtualCell of virtualClusters[vc].virtualCells) {
        for (let node of bindings.virtual[virtualCell.cellType.split('.')[0]]) {
          const cellType = virtualCell.cellType.split('.').slice(-1)[0];
          if (!(vc in clusterNodeGpu[node].bindings)) {
            clusterNodeGpu[node].bindings[vc] = {
              type: cellType,
              gpu: 0,
              cpu: 0,
              memory: 0,
            };
          }
          const cellGpu = cellTypeMap[cellType].gpuNumber;
          clusterNodeGpu[node].bindings[vc].gpu += cellGpu;
          clusterNodeGpu[node].bindings[vc].cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].cpu * cellGpu;
          clusterNodeGpu[node].bindings[vc].memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
        }
      }
    }
    if ('reservedCells' in virtualClusters[vc]) {
      for (let reservedCell of virtualClusters[vc].reservedCells) {
        for (let node of bindings.reserved[reservedCell.reservationId]) {
          const cellType = reservationCells[reservedCell.reservationId];
          if (!(vc in clusterNodeGpu[node].bindings)) {
            clusterNodeGpu[node].bindings[vc] = {
              type: reservedCell.reservationId,
              gpu: 0,
              cpu: 0,
              memory: 0,
            };
          }
          const cellGpu = cellTypeMap[cellType].gpuNumber;
          clusterNodeGpu[node].bindings[vc].gpu += cellGpu;
          clusterNodeGpu[node].bindings[vc].cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].cpu * cellGpu;
          clusterNodeGpu[node].bindings[vc].memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
        }
      }
    }
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
