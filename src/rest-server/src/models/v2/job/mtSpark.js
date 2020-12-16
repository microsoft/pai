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
const {sparkHistoryServerConfig} = require('@pai/config/spark');
const config = require('@pai/config/index');
const subClusterUtil = require('@pai/utils/subCluster');
const jobUtils = require('@pai/utils/jobUtils');

const list = async () => {
  // send request to resource manager
  let response;
  try {
    response = await axios({
      method: 'get',
      url: sparkHistoryServerConfig.applicationListPath(),
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
     if (response.data) {
       jobList = response.data.map(convertSparkApplication).filter((application) => application);
       jobList.sort((a, b) => b.createdTime - a.createdTime);
       return jobList;
     } else {
       return jobList;
     }
   } else {
     throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const get = async (appId) => {
  let response = await axios({
    method: 'get',
    url: sparkHistoryServerConfig.applicationPath(appId),
    timeout: 30000,
  });
  return convertSparkApplication(response.data);
};

const convertSparkApplication = (application) => {
  let jobGroupId = null;

  if (typeof (application.tags) !== 'undefined') {
    jobGroupId = jobUtils.getGroupIdByAppTagsStr(application.tags);
  }

  if (config.enableGroupIdCompatibility && null === jobGroupId) {
    jobGroupId = jobUtils.getGroupId(application.name);
  }

  const job = {
    name: jobUtils.removeGrouIdPrefix(application.name),
    moduleName: application.name,
    appId: application.id,
    username: application.attempts[0].sparkUser,
    state: getJobState(application),
    subState: getJobState(application),
    executionType: getJobState(application),
    retries: 'UNKNOWN',
    retryDetails: {
      user: null,
      platform: null,
      resource: null,
    },
    createdTime: getCreateTime(application),
    completedTime: getCompletedTime(application),
    appExitCode: null,
    virtualCluster: '',
    totalGpuNumber: 0,
    totalTaskNumber: -1,
    totalTaskRoleNumber: -1,
    applicationProgress: '100%',
    jobType: 'SPARK',
    runningDataCenter: config.dataCenter,
    appTrackingUrl: null,
    appExitDiagnostics: null,
    appTag: '',
    jobDetailLink: getJobDetailUrl(application),
    allocatedMB: 0,
    allocatedVCores: 0,
    priority: null,
    attemptInfo: application.attempts,
    subCluster: application.subCluster,
    groupId: jobGroupId,
  };
  return job;
};

const getJobState = (application) => {
    if (application.finalStatus) {
      return convertJobState(application.finalStatus);
    }
    let completed = true;
    for (let attempt of application.attempts) {
        completed = completed && attempt.completed;
    }
    if (completed) {
        return 'ARCHIVED';
    } else {
        return 'STOPPED';
    }
};

const convertJobState = (finalStatus) => {
  let jobState = '';
  switch (finalStatus) {
    case 'SUCCEEDED':
      jobState = 'SUCCEEDED';
      break;
    case 'FAILED':
      jobState = 'FAILED';
      break;
    case 'KILLED':
      jobState = 'STOPPED';
      break;
    default:
      jobState = 'UNKNOWN';
  }
  return jobState;
};

const getCreateTime = (application) => {
    // set attempts[application.attempts.length - 1].startTime as default start time
    let createTime = Date.parse(application.attempts[application.attempts.length - 1].startTime.replace('T', ' ').replace('G', ' G'));
    let minAttemptId = 999999;
    for (let attempt of application.attempts) {
        if (Number(attempt.attemptId) < minAttemptId) {
            minAttemptId = Number(attempt.attemptId);
            createTime = Date.parse(attempt.startTime.replace('T', ' ').replace('G', ' G'));
        }
    }
    return createTime;
};

const getCompletedTime = (application) => {
    // set attempts[0].endTime as default completed time
    let completedTime = Date.parse(application.attempts[0].endTime.replace('T', ' ').replace('G', ' G'));
    if (completedTime <= 0) {
      completedTime = Date.parse(application.attempts[0].lastUpdated.replace('T', ' ').replace('G', ' G'));
    }
    let maxAttemptId = -1;
    for (let attempt of application.attempts) {
        if (Number(attempt.attemptId) > maxAttemptId) {
            maxAttemptId = Number(attempt.attemptId);
            completedTime = Date.parse(attempt.endTime.replace('T', ' ').replace('G', ' G'));
            if (completedTime <= 0) {
              return Date.parse(attempt.lastUpdated.replace('T', ' ').replace('G', ' G'));
            }
        }
    }
    return completedTime;
};

const getJobDetailUrl = (application) => {
  let groupId = jobUtils.getGroupId(application.name);
  if (groupId !== null) {
    return `job-detail.html?appId=${application.id}&groupId=${groupId}&subCluster=${subClusterUtil.getCurrentSubClusterInfo().subCluster}`;
  } else {
    return `job-detail.html?appId=${application.id}&subCluster=${subClusterUtil.getCurrentSubClusterInfo().subCluster}`;
  }
};

// module exports
module.exports = {
  get,
  list,
};
