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
  jobName: Joi.string()
    .regex(/^[A-Za-z0-9\-._~]+$/)
    .required(),
  image: Joi.string()
    .required(),
  authFile: Joi.string()
    .allow('')
    .default(''),
  dataDir: Joi.string()
    .allow('')
    .default(''),
  outputDir: Joi.string()
    .allow('')
    .default(''),
  codeDir: Joi.string()
    .allow('')
    .default(''),
  taskRoles: Joi.array()
    .items(Joi.object().keys({
        name: Joi.string()
          .regex(/^[A-Za-z0-9._~]+$/)
          .required(),
        taskNumber: Joi.number()
          .integer()
          .default(1),
        cpuNumber: Joi.number()
          .integer()
          .default(1),
        memoryMB: Joi.number()
          .integer()
          .default(100),
        gpuNumber: Joi.number()
          .integer()
          .default(0),
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
        command: Joi.string()
          .required(),
      }))
    .min(1)
    .required(),
  gpuType: Joi.string()
    .allow('')
    .default(''),
  killAllOnCompletedTaskNumber: Joi.number()
    .integer()
    .default(1),
  virtualCluster: Joi.string()
    .allow('')
    .default('default'),
  retryCount: Joi.number()
    .integer()
    .default(0),
}).required();

// module exports
module.exports = {schema: jobConfigSchema};
