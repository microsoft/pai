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
const status = require('statuses');
const axios = require('@pai/utils/non-strict-axios');
const createError = require('@pai/utils/error');
const yarnConfig = require('@pai/config/yarn');
const config = require('@pai/config/index');
const subClusterUtil = require('@pai/utils/subCluster');
const jobUtils = require('@pai/utils/jobUtils');

const list = async () => {
  // send request to resource manager
  let response;
  try {
    response = await axios({
      method: 'get',
      url: yarnConfig.yarnApplicationsPath(),
      params: {
        applicationTypes: 'SPARK',
      },
      timeout: 30000,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }

  if (response.status === status('OK')) {
    let jobList = [];
    if (response.data.apps.app) {
      jobList = response.data.apps.app.map(convertYarnApplication).filter((application) => application);
      jobList.sort((a, b) => b.createdTime - a.createdTime);
      return jobList;
    } else {
      return jobList;
    }
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const getQueueAcl = async (vcName, user, queueAclType) => {
  // send request to resource manager
  let response;
  try {
    response = await axios({
      method: 'get',
      url: yarnConfig.yarnCheckUserAccessToQueue(vcName, user, queueAclType),
      timeout: 30000,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }
  return response.data;
};

const execute = async (appId, executionType, userName) => {
  // send request to resource manager
  let response;
  let state = convertYarnState(executionType);
  if (state === 'KILLED') {
    try {
      response = await axios({
        url: yarnConfig.yarnAppStatePath(appId),
        method: 'put',
        data: {
          state: `${state}`,
        },
      });
    } catch (error) {
      if (error.response != null) {
        response = error.response;
      } else {
        throw error;
      }
    }
    if (response.status === status('Not Found')) {
      throw createError(response.status, 'NoJobError', response.data.message);
    } else if (response.status !== status('OK') && response.status !== status('Accepted')) {
      throw createError(response.status, 'UnknownError', response.data.message);
    }
  } else {
    throw createError('Bad Request', 'InvalidParametersError', 'executionType: ' + executionType + ' not support.');
  }
};

const get = async (appId) => {
  let response = await axios({
    method: 'get',
    url: yarnConfig.yarnApplicationPath(appId),
    timeout: 30000,
  });

  return convertYarnApplication(response.data.app);
};

const convertYarnApplication = (application) => {
  let jobGroupId = null;

  jobGroupId = jobUtils.getGroupIdByAppTagsStr(application.applicationTags);

  if (config.enableGroupIdCompatibility && null === jobGroupId) {
    jobGroupId = jobUtils.getGroupId(application.name);
  }
  const job = {
    name: jobUtils.removeGrouIdPrefix(application.name),
    moduleName: application.name,
    appId: application.id,
    username: application.user,
    state: convertJobState(application.state, application.finalStatus),
    subState: application.state,
    executionType: convertJobExecutionType(application.finalStatus),
    retries: 'UNKNOWN',
    retryDetails: {
      user: null,
      platform: null,
      resource: null,
    },
    createdTime: application.startedTime,
    completedTime: application.finishedTime,
    appExitCode: null,
    virtualCluster: application.queue,
    totalGpuNumber: 0,
    totalTaskNumber: -1,
    totalTaskRoleNumber: -1,
    applicationProgress: `${application.progress}%`,
    jobType: application.applicationTags ? convertJobType(application.applicationTags, application.applicationType) : application.applicationType,
    runningDataCenter: config.dataCenter,
    appTrackingUrl: application.trackingUrl,
    appExitDiagnostics: application.diagnostics,
    appTag: application.applicationTags,
    jobDetailLink: generateJobDetailUri(application),
    allocatedMB: application.allocatedMB > 0 ? application.allocatedMB : 0,
    allocatedVCores: application.allocatedVCores > 0 ? application.allocatedVCores : 0,
    priority: application.priority,
    groupId: jobGroupId,
    containerAnalysis: application.applicationContainerAnalysis,
  };
  return job;
};

const generateJobDetailUri = (application) => {
  if (application) {
    if (application.applicationType === 'LAUNCHER') {
      return `job-detail.html?jobName=${application.name}`;
    } else if (application.applicationType === 'SPARK') {
      let groupId = jobUtils.getGroupId(application.name);
      if (groupId !== null) {
        return `job-detail.html?appId=${application.id}&groupId=${groupId}&subCluster=${subClusterUtil.getCurrentSubClusterInfo().subCluster}`;
      } else {
        return `job-detail.html?appId=${application.id}&subCluster=${subClusterUtil.getCurrentSubClusterInfo().subCluster}`;
      }
    }
  }
};

const convertJobType = (tag, originType) => {
  if (config.jobTagTypeMap) {
    for (const [key, value] of config.jobTagTypeMap.entries()) {
      if (tag.includes(key)) {
        return value;
      }
    }
  }
  return originType;
};

const convertJobExecutionType = (finalStatus) => {
  let executionType = '';
  switch (finalStatus) {
    case 'KILLED':
    case 'SUCCEEDED':
    case 'FAILED':
      executionType = 'STOP';
      break;
    default:
      executionType = 'START';
  }
  return executionType;
};

const convertYarnState = (executionType) => {
  let state = '';
  switch (executionType) {
    case 'STOP':
      state = 'KILLED';
      break;
    default:
      state = 'UNSUPPORT';
  }
  return state;
};

const convertJobState = (state, finalStatus) => {
  let jobState = '';
  switch (state) {
    case 'NEW':
    case 'NEW_SAVING':
    case 'SUBMITTED':
    case 'ACCEPTED':
      jobState = 'WAITING';
      break;
    case 'RUNNING':
      jobState = 'RUNNING';
      break;
    case 'FINISHED':
    case 'KILLED':
    case 'FAILED':
      if (finalStatus === 'SUCCEEDED') {
        jobState = 'SUCCEEDED';
      } else if (finalStatus === 'FAILED') {
        jobState = 'FAILED';
      } else if (finalStatus === 'KILLED') {
        jobState = 'STOPPED';
      } else {
        jobState = 'UNKNOWN';
      }
      break;
    default:
      jobState = 'UNKNOWN';
  }
  return jobState;
};

// module exports
module.exports = {
  list,
  get,
  execute,
  getQueueAcl,
};
