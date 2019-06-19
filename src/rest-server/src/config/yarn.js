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
const unirest = require('unirest');
const config = require('./index');
const logger = require('./logger');

// get config from environment variables
let yarnConfig = {
  yarnUri: process.env.YARN_URI,
  webserviceRequestHeaders: {
    'Accept': 'application/json',
  },
  yarnVcInfoPath: `${process.env.YARN_URI}/ws/v1/cluster/scheduler`,
  yarnNodeInfoPath: `${process.env.YARN_URI}/ws/v1/cluster/nodes`,
  webserviceUpdateQueueHeaders: {
    'Content-Type': 'application/xml',
  },
  yarnVcUpdatePath: `${process.env.YARN_URI}/ws/v1/cluster/scheduler-conf`,
};


const yarnConfigSchema = Joi.object().keys({
  yarnUri: Joi.string()
    .uri()
    .required(),
  webserviceRequestHeaders: Joi.object()
    .required(),
  yarnVcInfoPath: Joi.string()
    .uri()
    .required(),
  yarnNodeInfoPath: Joi.string()
    .uri()
    .required(),
  webserviceUpdateQueueHeaders: Joi.object()
    .required(),
  yarnVcUpdatePath: Joi.string()
    .uri()
    .required(),
}).required();

const {error, value} = Joi.validate(yarnConfig, yarnConfigSchema);
if (error) {
  throw new Error(`yarn config error\n${error}`);
}
yarnConfig = value;


// framework launcher health check
if (config.env !== 'test') {
  unirest.get(yarnConfig.yarnVcInfoPath)
  .timeout(2000)
  .end((res) => {
    if (res.status === 200) {
      logger.info('connected to yarn successfully');
    } else {
      throw new Error('cannot connect to yarn');
    }
  });
}

module.exports = yarnConfig;
