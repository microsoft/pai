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
let launcherConfig = {
  hdfsUri: process.env.HDFS_URI,
  webhdfsUri: process.env.WEBHDFS_URI,
  webserviceUri: process.env.LAUNCHER_WEBSERVICE_URI,
  webserviceRequestHeaders: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  jobRootDir: './frameworklauncher',
  jobDirCleanUpIntervalSecond: 7200,
  jobConfigFileName: 'JobConfig.json',
  frameworkDescriptionFilename: 'FrameworkDescription.json',
};

launcherConfig.healthCheckPath = () => {
  return `${launcherConfig.webserviceUri}/v1`;
};

launcherConfig.frameworksPath = () => {
  return `${launcherConfig.webserviceUri}/v1/Frameworks`;
};

launcherConfig.frameworkPath = (frameworkName) => {
  return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}`;
};

launcherConfig.frameworkStatusPath = (frameworkName) => {
  return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/FrameworkStatus`;
};

launcherConfig.frameworkRequestPath = (frameworkName) => {
  return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/FrameworkRequest`;
};

launcherConfig.frameworkExecutionTypePath = (frameworkName) => {
  return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/ExecutionType`;
};

// define launcher config schema
const launcherConfigSchema = Joi.object().keys({
  hdfsUri: Joi.string()
    .uri()
    .required(),
  webhdfsUri: Joi.string()
    .uri()
    .required(),
  webserviceUri: Joi.string()
    .uri()
    .required(),
  healthCheckPath: Joi.func()
    .arity(0)
    .required(),
  frameworksPath: Joi.func()
    .arity(0)
    .required(),
  frameworkPath: Joi.func()
    .arity(1)
    .required(),
  frameworkStatusPath: Joi.func()
    .arity(1)
    .required(),
  frameworkRequestPath: Joi.func()
    .arity(1)
    .required(),
  frameworkExecutionTypePath: Joi.func()
    .arity(1)
    .required(),
  webserviceRequestHeaders: Joi.object()
    .required(),
  jobRootDir: Joi.string()
    .default('./frameworklauncher'),
  jobDirCleanUpIntervalSecond: Joi.number()
    .integer()
    .min(30 * 60)
    .default(120 * 60),
  jobConfigFileName: Joi.string()
    .default('JobConfig.json'),
  frameworkDescriptionFilename: Joi.string()
    .default('FrameworkDescription.json'),
}).required();

const {error, value} = Joi.validate(launcherConfig, launcherConfigSchema);
if (error) {
  throw new Error(`launcher config error\n${error}`);
}
launcherConfig = value;

// framework launcher health check
if (config.env !== 'test') {
  unirest.get(launcherConfig.healthCheckPath())
  .timeout(2000)
  .end((res) => {
    if (res.status === 200) {
      logger.info('connected to framework launcher successfully');
    } else {
      throw new Error('cannot connect to framework launcher');
    }
  });
}

// module exports
module.exports = launcherConfig;
