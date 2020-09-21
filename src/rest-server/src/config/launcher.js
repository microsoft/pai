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

// define k8s launcher config schema
const k8sLauncherConfigSchema = Joi.object()
  .keys({
    hivedWebserviceUri: Joi.string().uri().required(),
    enabledPriorityClass: Joi.boolean().required(),
    apiVersion: Joi.string().required(),
    podGracefulDeletionTimeoutSec: Joi.number()
      .integer()
      .default(30 * 60),
    scheduler: Joi.string().required(),
    enabledHived: Joi.boolean().required(),
    hivedSpecPath: Joi.string().required(),
    runtimeImage: Joi.string().required(),
    runtimeImagePullSecrets: Joi.string().required(),
    requestHeaders: Joi.object(),
    sqlConnectionString: Joi.string().required(),
    sqlMaxConnection: Joi.number().integer().required(),
    enabledJobHistory: Joi.boolean().required(),
    writeMergerUrl: Joi.string().required(),
    healthCheckPath: Joi.func().arity(0).required(),
    frameworksPath: Joi.func().arity(0).required(),
    frameworkPath: Joi.func().arity(1).required(),
    priorityClassesPath: Joi.func().arity(0).required(),
    priorityClassPath: Joi.func().arity(1).required(),
    secretsPath: Joi.func().arity(0).required(),
    secretPath: Joi.func().arity(1).required(),
    podPath: Joi.func().arity(1).required(),
  })
  .required();

let launcherConfig;
const launcherType = process.env.LAUNCHER_TYPE;
if (launcherType === 'k8s') {
  launcherConfig = {
    hivedWebserviceUri: process.env.HIVED_WEBSERVICE_URI,
    enabledPriorityClass: process.env.LAUNCHER_PRIORITY_CLASS === 'true',
    apiVersion: 'frameworkcontroller.microsoft.com/v1',
    podGracefulDeletionTimeoutSec: 600,
    scheduler: process.env.LAUNCHER_SCHEDULER,
    runtimeImage: process.env.LAUNCHER_RUNTIME_IMAGE,
    runtimeImagePullSecrets: process.env.LAUNCHER_RUNTIME_IMAGE_PULL_SECRETS,
    enabledHived: process.env.LAUNCHER_SCHEDULER === 'hivedscheduler',
    hivedSpecPath:
      process.env.HIVED_SPEC_PATH || '/hived-spec/hivedscheduler.yaml',
    requestHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    sqlConnectionString: process.env.SQL_CONNECTION_STR || 'unset',
    sqlMaxConnection: parseInt(process.env.SQL_MAX_CONNECTION),
    enabledJobHistory: process.env.JOB_HISTORY === 'true',
    writeMergerUrl: process.env.WRITE_MERGER_URL,
    healthCheckPath: () => {
      return `/apis/${launcherConfig.apiVersion}`;
    },
    frameworksPath: (namespace = 'default') => {
      return `/apis/${launcherConfig.apiVersion}/namespaces/${namespace}/frameworks`;
    },
    frameworkPath: (frameworkName, namespace = 'default') => {
      return `/apis/${launcherConfig.apiVersion}/namespaces/${namespace}/frameworks/${frameworkName}`;
    },
    priorityClassesPath: () => {
      return `/apis/scheduling.k8s.io/v1/priorityclasses`;
    },
    priorityClassPath: (priorityClassName) => {
      return `/apis/scheduling.k8s.io/v1/priorityclasses/${priorityClassName}`;
    },
    secretsPath: (namespace = 'default') => {
      return `/api/v1/namespaces/${namespace}/secrets`;
    },
    secretPath: (secretName, namespace = 'default') => {
      return `/api/v1/namespaces/${namespace}/secrets/${secretName}`;
    },
    podPath: (podName, namespace = 'default') => {
      return `/api/v1/namespaces/${namespace}/pods/${podName}`;
    },
  };

  const { error, value } = Joi.validate(
    launcherConfig,
    k8sLauncherConfigSchema,
  );
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
