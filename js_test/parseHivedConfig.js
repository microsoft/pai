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
const yaml = require('js-yaml');
const fs = require('fs');

const createError = (str1, str2, str3) => {
  return new Error(str3);
};

const hivedString = fs.readFileSync('demo_hivedscheduler.yaml');
const hivedObj = yaml.load(hivedString);

const cellTypeLeaves = hivedObj.physicalCluster.cellTypes.leaves;
const cellTypeParents = hivedObj.physicalCluster.cellTypes.parents;
const physicalCells = hivedObj.physicalCluster.physicalCells;
const virtualClusters = hivedObj.virtualClusters;

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
    //TODO: error: `Leaf cell: ${cellType} not found in cell types`
  }
  addCellType(spec.childCellType);
  const childEle = cellTypeMap[spec.childCellType];
  cellTypeMap[cellType] = {
    gpuType: childEle.gpuType,
    gpuNumber: childEle.gpuNumber * spec.childCellNumber,
    childCellType: spec.childCellType,
  }
};

for (let cellType of Object.keys(cellTypeParents)) {
  addCellType(cellType)
}

const reservationCells = {};

const addReservation = (cellInstance, cellType) => {
  if (!cellTypeMap.hasOwnProperty(cellType)) {
    //  TODO: error: `cellType: ${cellType} not found in cell types`
  }
  if (cellInstance.hasOwnProperty('reservationId')) {
    const rId = cellInstance.reservationId;
    if (reservationCells.hasOwnProperty(rId)) {
    //  TODO: error: `Duplicate reservationId found: ${rId}`
    }
    reservationCells[rId] = cellType
  }

  // recursively check cellChildren if not null or empty
  if (cellInstance.cellChildren) {
    for (let childCellInstance of cellInstance.cellChildren) {
      addReservation(childCellInstance, cellTypeMap[cellType].childCellType)
    }
  }
};

for (let cellInstance of physicalCells) {
  addReservation(cellInstance, cellInstance.cellType)
}

const virtualCellCapacity = {};

for (let vc of Object.keys(virtualClusters)) {
  virtualCellCapacity[vc] = {
    gpuTotal: 0,
    gpuShared: 0,
    gpuReserved: 0,
  };
  if (virtualClusters[vc].hasOwnProperty('virtualCells')) {
    for (let vCell of virtualClusters[vc].virtualCells) {
      const cellTypeArray = vCell.cellType.split('.');
      const cellType = cellTypeArray[cellTypeArray.length-1];
      if (!cellTypeMap.hasOwnProperty(cellType)) {
        //TODO: error: `cellType: ${cellType} not found in cell types`
      }
      const cellGpu = cellTypeMap[cellType].gpuNumber * vCell.cellNumber;
      virtualCellCapacity[vc].gpuShared += cellGpu;
    }
  }
  if (virtualClusters[vc].hasOwnProperty('reservedCells')) {
    for (let vCell of virtualClusters[vc].reservedCells) {
      const rId = vCell.reservationId;
      if (!reservationCells.hasOwnProperty(rId)) {
        //TODO: error: `reservationId: ${rId} not found in physical cells`
      }
      const cellType = reservationCells[rId];
      const cellGpu = cellTypeMap[cellType].gpuNumber;
      virtualCellCapacity[vc].gpuReserved += cellGpu;
    }
  }
  virtualCellCapacity[vc].gpuTotal = virtualCellCapacity[vc].gpuShared + virtualCellCapacity[vc].gpuReserved;
}

console.log(yaml.safeDump(virtualCellCapacity));
