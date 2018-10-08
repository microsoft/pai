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

// define job config schema
const jobConfigSchema = Joi.object().keys({
  protocol_version: Joi.string()
    .allow('')
    .default('v2'),
  name: Joi.string()
    .allow('')
    .default(''),
  type: Joi.string()
    .regex(/job/)
    .required(),
  version: Joi.string()
    .allow('')
    .default(''),
  contributor: Joi.string()
    .allow('')
    .default(''),
  description: Joi.string()
    .allow('')
    .default(''),
  retryCount: Joi.number()
    .integer()
    .default(1),
  gpuType: Joi.string()
    .allow('')
    .default(''),
  experiment: Joi.string()
    .allow('')
    .default(''),
  virtualCluster: Joi.string()
    .allow('')
    .default('default'),
  parameters: Joi.object(),
  tasks: Joi.array()
    .items(Joi.object().keys({
      role: Joi.string()
        .regex(/^[A-Za-z0-9._~]+$/)
        .required(),
      type: Joi.string()
        .allow('')
        .default('task'),
      data: Joi.string()
        .allow('')
        .default(''),
      script: Joi.string()
        .allow('')
        .default(''),
      dockerimage: Joi.string()
        .required(),
      resource: Joi.object().keys({
        instances: Joi.number()
          .integer()
          .default(1),
        resourcePerInstance: Joi.object().keys({
          cpu: Joi.number()
            .integer()
            .default(1),
          memoryMB: Joi.number()
            .integer().
            default(100),
          shmMB: Joi.number()
            .integer()
            .max(Joi.ref('memoryMB'))
            .default(64),
          gpu: Joi.number()
            .integer()
            .default(0),
        }),
        portList: Joi.array()
          .items(Joi.object().keys({
            label: Joi.string()
              .regex(/^[A-Za-z0-9._~]+$/)
              .required(),
            beginAt: Joi.number()
              .integer()
              .default(0),
            portNumber: Joi.number()
              .integer()
              .default(1),
          }))
          .optional()
          .default([]),
      }),
      minFailedTaskCount: Joi.number()
        .integer()
        .min(1)
        .allow(null)
        .default(1),
      minSucceededTaskCount: Joi.number()
        .integer()
        .min(1)
        .allow(null)
        .default(null),
      parameters: Joi.object()
        .optional()
        .default({}),
      command: Joi.array()
        .items(Joi.string())
        .required(),
    })).required(),

  prerequisites: Joi.array()
    .items(Joi.object().keys({
      protocol_version: Joi.string()
        .allow('')
        .default('v2'),
      name: Joi.string()
        .allow('')
        .default(''),
      type: Joi.string()
        .regex(/data|script|dockerimage/)
        .required(),
      version: Joi.string()
        .allow('')
        .default(''),
      contributor: Joi.string()
        .allow('')
        .default(''),
      description: Joi.string()
        .allow('')
        .default(''),
      uri: Joi.string()
        .allow('')
        .default(''),
      usage: Joi.object(),
    })),
}).required();

// module exports
module.exports = {schema: jobConfigSchema};
