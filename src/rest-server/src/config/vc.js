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
const fs = require('fs');
const Joi = require('joi');
const yaml = require('js-yaml');
const k8s = require('@pai/utils/k8sUtils');
const { enabledHived, hivedSpecPath } = require('@pai/config/launcher');

// define the input schema for the 'create vc' api
const vcCreateInputSchema = Joi.object()
  .keys({
    vcCapacity: Joi.number().min(0).max(100).required(),
    vcMaxCapacity: Joi.number().min(Joi.ref('vcCapacity')).max(100).optional(),
    description: Joi.string().empty(''),
    externalName: Joi.string().empty(''),
  })
  .required();

// define the input schema for the 'put vc status' api
const vcStatusPutInputSchema = Joi.object()
  .keys({
    vcStatus: Joi.string().valid(['stopped', 'running']).required(),
  })
  .required();

const resourceUnits = {};

if (enabledHived) {
  const hivedConfig = yaml.safeLoad(fs.readFileSync(hivedSpecPath));
  if (
    !(
      'physicalCluster' in hivedConfig &&
      !!hivedConfig.physicalCluster.skuTypes &&
      hivedConfig.physicalCluster.skuTypes.constructor === Object &&
      Object.keys(hivedConfig.physicalCluster.skuTypes).length > 0
    )
  ) {
    throw new Error('Cannot find skuTypes in hivedscheduler config.');
  }

  for (const [key, val] of Object.entries(
    hivedConfig.physicalCluster.skuTypes,
  )) {
    resourceUnits[key] = {
      cpu: k8s.atoi(val.cpu),
      memory: k8s.convertMemoryMb(val.memory),
      gpu: k8s.atoi(val.gpu),
    };
  }
}

// module exports
module.exports = {
  vcCreateInputSchema,
  vcStatusPutInputSchema,
  resourceUnits,
};
