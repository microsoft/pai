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

const resourcesEmpty = {
  cpu: 0,
  memory: 0,
  gpu: 0,
};

if (launcherConfig.enabledHived) {
  const hivedObj = yaml.safeLoad(fs.readFileSync(launcherConfig.hivedSpecPath));

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
    addReservation(cellInstance, cellInstance.cellType);
  }

  // calculate vc quota
  for (let vc of Object.keys(virtualClusters)) {
    virtualCellCapacity[vc] = {
      quota: {},
    };
    if (virtualClusters[vc].hasOwnProperty('virtualCells')) {
      for (let vCell of virtualClusters[vc].virtualCells) {
        const cellType = vCell.cellType.split('.').slice(-1)[0];
        if (!cellTypeMap.hasOwnProperty(cellType)) {
          throw new Error(`hived error: cellType: ${cellType} not found in cell types`);
        }
        if (!(cellType in virtualCellCapacity[vc].quota)) {
          virtualCellCapacity[vc].quota[cellType] = {...resourcesEmpty};
        }
        const cellGpu = cellTypeMap[cellType].gpuNumber * vCell.cellNumber;
        virtualCellCapacity[vc].quota[cellType].gpu += cellGpu;
        virtualCellCapacity[vc].quota[cellType].cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].cpu * cellGpu;
        virtualCellCapacity[vc].quota[cellType].memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
      }
    }
    if (virtualClusters[vc].hasOwnProperty('reservedCells')) {
      for (let vCell of virtualClusters[vc].reservedCells) {
        const rId = vCell.reservationId;
        const cellType = reservationCells[rId];
        if (!reservationCells.hasOwnProperty(rId)) {
          throw new Error(`hived error: reservationId: ${rId} not found in physical cells`);
        }
        if (!(rId in virtualCellCapacity[vc].quota)) {
          virtualCellCapacity[vc].quota[rId] = {...resourcesEmpty};
        }
        const cellGpu = cellTypeMap[cellType].gpuNumber;
        virtualCellCapacity[vc].quota[rId].gpu += cellGpu;
        virtualCellCapacity[vc].quota[rId].cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].cpu * cellGpu;
        virtualCellCapacity[vc].quota[rId].memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
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
}

// module exports
module.exports = vcExports;
