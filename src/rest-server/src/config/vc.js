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
const createError = require('@pai/utils/error');

// define the input schema for the 'update vc' api
const vcPutInputSchema = Joi.object().keys({
  vcCapacity: Joi.number()
    .min(0)
    .max(100)
    .required(),
  vcMaxCapacity: Joi.number()
    .min(Joi.ref('vcCapacity'))
    .max(100)
    .optional(),
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
if (launcherConfig.enabledHived) {
  const hivedObj = yaml.load(fs.readFileSync(launcherConfig.hivedSpecPath));

  const cellTypeLeaves = hivedObj.physicalCluster.cellTypes.leaves;
  const cellTypeParents = hivedObj.physicalCluster.cellTypes.parents;
  const physicalCells = hivedObj.physicalCluster.physicalCells;
  const virtualClusters = hivedObj.virtualClusters;
  for (let gpuType of Object.keys(cellTypeLeaves)) {
    resourceUnits[gpuType] = {
      vCores: parseInt(cellTypeLeaves[gpuType].cpu),
      memory: k8s.convertMemory(resourceUnits[gpuType].memory),
      GPUs: parseInt(cellTypeLeaves[gpuType].gpu),
    };
  }

  const cellTypeMap = {};
  // initialize cellTypeMap to leaves
  for (let gpuType of Object.keys(cellTypeLeaves)) {
    cellTypeMap[gpuType] = {
      gpuType: gpuType,
      gpuNumber: cellTypeLeaves[gpuType].gpu,
      childCellType: null,
    };
  }

  const addCellType = (cellType) => {
    if (cellTypeMap.hasOwnProperty(cellType)) {
      // already added
      return;
    }
    const spec = cellTypeParents[cellType];
    if (spec == null) {
      // TODO: error: `Leaf cell: ${cellType} not found in cell types`
    }
    addCellType(spec.childCellType);
    const childEle = cellTypeMap[spec.childCellType];
    cellTypeMap[cellType] = {
      gpuType: childEle.gpuType,
      gpuNumber: childEle.gpuNumber * spec.childCellNumber,
      childCellType: spec.childCellType,
    };
  };

  for (let cellType of Object.keys(cellTypeParents)) {
    addCellType(cellType);
  }

  const reservationCells = {};

  const addReservation = (cellInstance, cellType) => {
    if (!cellTypeMap.hasOwnProperty(cellType)) {
      createError('Internal Server Error', 'BadConfigurationError', `Hived error: cellType: ${cellType} not found in cell types`);
    }
    if (cellInstance.hasOwnProperty('reservationId')) {
      const rId = cellInstance.reservationId;
      if (reservationCells.hasOwnProperty(rId)) {
        createError('Internal Server Error', 'BadConfigurationError', `Hived error: duplicate reservationId found: ${rId}`);
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

  for (let vc of Object.keys(virtualClusters)) {
    virtualCellCapacity[vc] = {
      resourceTotal: {
        gpu: 0,
        memory: 0,
        cpu: 0,
      },
      resourceShared: {
        gpu: 0,
        memory: 0,
        cpu: 0,
      },
      resourceReserved: {
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
          createError('Internal Server Error', 'BadConfigurationError', `Hived error: cellType: ${cellType} not found in cell types`);
        }
        const cellGpu = cellTypeMap[cellType].gpuNumber * vCell.cellNumber;
        virtualCellCapacity[vc].resourceShared.gpu += cellGpu;
        virtualCellCapacity[vc].resourceShared.cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].vCores * cellGpu;
        virtualCellCapacity[vc].resourceShared.memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
      }
    }
    if (virtualClusters[vc].hasOwnProperty('reservedCells')) {
      for (let vCell of virtualClusters[vc].reservedCells) {
        const rId = vCell.reservationId;
        if (!reservationCells.hasOwnProperty(rId)) {
          createError('Internal Server Error', 'BadConfigurationError', `Hived error: reservationId: ${rId} not found in physical cells`);
        }
        const cellType = reservationCells[rId];
        const cellGpu = cellTypeMap[cellType].gpuNumber;
        virtualCellCapacity[vc].resourceReserved.gpu += cellGpu;
        virtualCellCapacity[vc].resourceReserved.cpu += resourceUnits[(cellTypeMap[cellType].gpuType)].vCores * cellGpu;
        virtualCellCapacity[vc].resourceReserved.memory += resourceUnits[(cellTypeMap[cellType].gpuType)].memory * cellGpu;
      }
    }
    virtualCellCapacity[vc].resourceTotal.gpu = virtualCellCapacity[vc].resourceShared.gpu + virtualCellCapacity[vc].resourceReserved.gpu;
    virtualCellCapacity[vc].resourceTotal.cpu = virtualCellCapacity[vc].resourceShared.cpu + virtualCellCapacity[vc].resourceReserved.cpu;
    virtualCellCapacity[vc].resourceTotal.memory = virtualCellCapacity[vc].resourceShared.memory + virtualCellCapacity[vc].resourceReserved.memory;
  }
}

// module exports
module.exports = {
  vcPutInputSchema: vcPutInputSchema,
  vcStatusPutInputSchema: vcStatusPutInputSchema,
  resourceUnits: resourceUnits,
  virtualCellCapacity: virtualCellCapacity,
  podsUrl: `${launcherConfig.apiServerUri}/api/v1/pods?labelSelector=type=kube-launcher-task`,
  clusterTotalGpu: clusterTotalGpu,
};
