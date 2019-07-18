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
const hivedConfig = require('@pai/config/v2/hived');
const yaml = require('js-yaml');
const fs = require('fs');

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

let resourceUnits;
if (hivedConfig.enabledHived) {
  resourceUnits = yaml.safeLoad(fs.readFileSync(hivedConfig.hivedSpecPath)).physicalCluster.cellTypes.leaves;
} else {
  resourceUnits = {
    DEFAULT: {
      gpu: 1,
      cpu: 4,
      memory: '8192Mi',
    },
  };
}

const convertMemory = (memoryStr) => {
  let memoryMb = parseInt(memoryStr);
  switch (memoryStr.replace(/[0-9]/g, '')) {
    case 'Ti':
      memoryMb *= 1000000;
      break;
    case 'Gi':
      memoryMb *= 1000;
      break;
    case 'Mi':
      break;
    case 'Ki':
      memoryMb /= 1000;
      break;
    default:
      memoryMb /= 1000000;
  }
  return memoryMb;
};

for (let gpuType of Object.keys(resourceUnits)) {
  resourceUnits[gpuType].memoryMB = convertMemory(resourceUnits[gpuType].memory);
  delete resourceUnits[gpuType].memory;
}

// module exports
module.exports = {
  vcPutInputSchema: vcPutInputSchema,
  vcStatusPutInputSchema: vcStatusPutInputSchema,
  resourceUnits: resourceUnits,
};
