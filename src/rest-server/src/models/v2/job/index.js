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
'use strict';


// module dependencies
const unirest = require('unirest');
const config = require('@pai/config/index');
const logger = require('@pai/config/logger');
const yarnConfig = require('@pai/config/yarn');
const launcherConfig = require('@pai/config/launcher');
const mtLauncherModel = require('@pai/models/v2/job/mtLauncher');
const mergedModel = require('@pai/models/v2/job/merged');
const mtLog = require('@pai/models/v2/job/mtLog');
const mtContainerDump = require('@pai/models/v2/job/mtContainerDump');

if (launcherConfig.type === 'yarn') {
  if (config.serviceName && config.serviceName.toLowerCase() === 'mt') {
    module.exports = {
      list: () => mtLauncherModel.list(),
      get: (frameworkName) => mtLauncherModel.get(frameworkName),
      listMergedJobs: (query) => mergedModel.listMergedJobs(query),
      getGenericInfoByName: (jobName) => mergedModel.getGenericInfoByName(jobName),
      execute: (frameworkName, executionType) => mtLauncherModel.execute(frameworkName, executionType),
      executeJobByJobName: (jobName, executionType, userName) => mergedModel.executeJobByJobName(jobName, executionType, userName),
      getGenericInfoByAppId: (appId) => mergedModel.getGenericInfoByAppId(appId),
      dumpContainerLogByAppId: (dumpParam) => mtLog.dumpContainerLogByAppId(dumpParam),
      dumpContainerLogByName: (dumpParam) => mtLog.dumpContainerLogByName(dumpParam),
      getResourceRequestsByAppId: (appId) => mergedModel.getResourceRequestsByAppId(appId),
      getAppsCount: () => mergedModel.getAppsCount(),
      executeJobByAppId: (appId, executionType, userName) => mergedModel.executeJobByAppId(appId, executionType, userName),
      getQueueAcl: (vcName, user, queueAclType) => mergedModel.getQueueAcl(vcName, user, queueAclType),
      getJobsByGroupId: (groupId, query) => mergedModel.getJobsByGroupId(groupId, query),
      getFrameworkAttemptInfo: (frameworkName, frameworkVersion, frameworkAttemptId) => mergedModel.getFrameworkAttemptInfo(frameworkName, frameworkVersion, frameworkAttemptId),
      getAttempts: (frameworkName, frameworkVersion) => mtLauncherModel.getAttempts(frameworkName, frameworkVersion),
      getVersions: (frameworkName) => mtLauncherModel.getVersions(frameworkName),
      heapDumpContainerByJobName: (heapdumpParam) => mtContainerDump.heapDumpContainerByJobName(heapdumpParam),
      heapDumpContainerByAppId: (heapdumpParam) => mtContainerDump.heapDumpContainerByAppId(heapdumpParam),
      threadDumpContainerByJobName: (threaddumpParam) => mtContainerDump.threadDumpContainerByJobName(threaddumpParam),
      threadDumpContainerByAppId: (threaddumpParam) => mtContainerDump.threadDumpContainerByAppId(threaddumpParam),
      processTreeDumpContainerByJobName: (pTreeDumpParam) => mtContainerDump.processTreeDumpContainerByJobName(pTreeDumpParam),
      processTreeDumpContainerByAppId: (pTreeDumpParam) => mtContainerDump.processTreeDumpContainerByAppId(pTreeDumpParam),
      getContainerDumpFileUrlByJobName: (dumpParam) => mtContainerDump.getContainerDumpFileUrlByJobName(dumpParam),
      getContainerDumpFileUrlByAppId: (dumpParam) => mtContainerDump.getContainerDumpFileUrlByAppId(dumpParam),
    };
  } else {
    if (config.env !== 'test') {
      // framework launcher health check
      unirest.get(launcherConfig.healthCheckPath())
      .timeout(2000)
      .end((res) => {
        if (res.status === 200) {
          logger.info('connected to framework launcher successfully');
        } else {
          throw new Error('cannot connect to framework launcher');
        }
      });
      // hadoop yarn health check
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
    module.exports = require('@pai/models/v2/job/yarn');
  }
} else if (launcherConfig.type === 'k8s') {
  module.exports = require('@pai/models/v2/job/k8s');
} else {
  throw new Error(`unknown launcher type ${launcherConfig.type}`);
}
