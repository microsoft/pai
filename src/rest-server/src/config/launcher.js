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


// define yarn launcher config schema
const yarnLauncherConfigSchema = Joi.object().keys({
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
  frameworkAggregatedStatusPath: Joi.func()
    .arity(1)
    .required(),
  frameworkRequestPath: Joi.func()
    .arity(1)
    .required(),
  frameworkExecutionTypePath: Joi.func()
    .arity(1)
    .required(),
  frameworkInfoWebhdfsPath: Joi.func()
    .arity(1)
    .required(),
  webserviceRequestHeaders: Joi.func()
    .arity(1)
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
  amResource: Joi.object().keys({
    cpuNumber: Joi.number()
      .integer()
      .min(1)
      .default(1),
    memoryMB: Joi.number()
      .integer()
      .min(1024)
      .default(4096),
    diskType: Joi.number()
      .integer()
      .default(0),
    diskMB: Joi.number()
      .integer()
      .min(0)
      .default(0),
  }),
}).required();

// define k8s launcher config schema
const k8sLauncherConfigSchema = Joi.object().keys({
  apiServerUri: Joi.string()
    .uri()
    .required(),
  apiVersion: Joi.string()
    .required(),
  runtimeImage: Joi.string()
    .required(),
  runtimeImagePullSecrets: Joi.string()
    .required(),
  requestHeaders: Joi.object(),
  healthCheckPath: Joi.func()
    .arity(0)
    .required(),
  frameworksPath: Joi.func()
    .arity(0)
    .required(),
  frameworkPath: Joi.func()
    .arity(1)
    .required(),
}).required();

let launcherConfig;
const launcherType = process.env.LAUNCHER_TYPE;
if (launcherType === 'yarn') {
  // get config from environment variables
  launcherConfig = {
    hdfsUri: process.env.HDFS_URI,
    webhdfsUri: process.env.WEBHDFS_URI,
    webserviceUri: process.env.LAUNCHER_WEBSERVICE_URI,
    webserviceRequestHeaders: (namespace) => {
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (namespace) {
        headers['UserName'] = namespace;
      }
      return headers;
    },
    jobRootDir: './frameworklauncher',
    jobDirCleanUpIntervalSecond: 7200,
    jobConfigFileName: 'JobConfig.json',
    frameworkDescriptionFilename: 'FrameworkDescription.json',
    amResource: {
      cpuNumber: 1,
      memoryMB: 1024,
      diskType: 0,
      diskMB: 0,
    },
    healthCheckPath: () => {
      return `${launcherConfig.webserviceUri}/v1`;
    },
    frameworksPath: () => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks`;
    },
    frameworkPath: (frameworkName) => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}`;
    },
    frameworkStatusPath: (frameworkName) => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/FrameworkStatus`;
    },
    frameworkAggregatedStatusPath: (frameworkName) => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/AggregatedFrameworkStatus`;
    },
    frameworkRequestPath: (frameworkName) => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/FrameworkRequest`;
    },
    frameworkExecutionTypePath: (frameworkName) => {
      return `${launcherConfig.webserviceUri}/v1/Frameworks/${frameworkName}/ExecutionType`;
    },
    frameworkInfoWebhdfsPath: (frameworkName) => {
      return `${launcherConfig.webhdfsUri}/webhdfs/v1/Launcher/${frameworkName}/FrameworkInfo.json?op=OPEN`;
    },
  };

  const {error, value} = Joi.validate(launcherConfig, yarnLauncherConfigSchema);
  if (error) {
    throw new Error(`launcher config error\n${error}`);
  }
  launcherConfig = value;
  launcherConfig.type = launcherType;
} else if (launcherType === 'k8s') {
  launcherConfig = {
    apiServerUri: process.env.K8S_APISERVER_URI,
    apiVersion: 'frameworkcontroller.microsoft.com/v1',
    runtimeImage: process.env.LAUNCHER_RUNTIME_IMAGE,
    runtimeImagePullSecrets: process.env.LAUNCHER_RUNTIME_IMAGE_PULL_SECRETS,
    requestHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    healthCheckPath: () => {
      return `${launcherConfig.apiServerUri}/apis/${launcherConfig.apiVersion}`;
    },
    frameworksPath: (namespace='default') => {
      return `${launcherConfig.apiServerUri}/apis/${launcherConfig.apiVersion}/namespaces/${namespace}/frameworks`;
    },
    frameworkPath: (frameworkName, namespace='default') => {
      return `${launcherConfig.apiServerUri}/apis/${launcherConfig.apiVersion}/namespaces/${namespace}/frameworks/${frameworkName}`;
    },
  };

  const {error, value} = Joi.validate(launcherConfig, k8sLauncherConfigSchema);
  if (error) {
    throw new Error(`launcher config error\n${error}`);
  }
  launcherConfig = value;
  launcherConfig.type = launcherType;
} else {
  throw new Error(`unknown launcher type ${launcherType}`);
}

// module exports
module.exports = launcherConfig;
