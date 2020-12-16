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
const launcherConfig = require('@pai/config/launcher');
const config = require('@pai/config/index');
const yarnConfig = require('@pai/config/yarn');
const subClusterUtil = require('@pai/utils/subCluster');
const jobUtils = require('@pai/utils/jobUtils');
const logger = require('@pai/config/logger');

const list = async () => {
  // send request to framework controller
  let response;
  try {
    response = await axios({
      method: 'get',
      url: launcherConfig.summaryFrameworkListPath(),
      timeout: 30000,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }

  let rmResponse;
  try {
    rmResponse = await axios({
      method: 'get',
      url: yarnConfig.yarnApplicationsPath(),
      params: {
        applicationTypes: 'LAUNCHER',
      },
      timeout: 30000,
    });
  } catch (error) {
    if (error.response != null) {
      rmResponse = error.response;
    } else {
      throw error;
    }
  }

  let jobList = {
    'jobs': {},
  };
  let rmJobList = {
    'jobs': {},
  };
  let mergedJobList = {
    'jobs': {},
  };

  if (response.status === status('OK')) {
    if (response.data.SummarizedFrameworkInfos) {
      jobList.jobs.job = response.data.SummarizedFrameworkInfos.map(convertFrameworkSummary).filter((framework) => framework);
      jobList.jobs.job.sort((a, b) => b.createdTime - a.createdTime);
    } else {
      return response.data;
    }
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }

  if (rmResponse.status === status('OK') && rmResponse.data.apps.app) {
    rmJobList.jobs.job = rmResponse.data.apps.app.map(convertGenericFrameworkSummary);
    mergedJobList.jobs.job = mergeFrameworkSummary(rmJobList, jobList);
    rmJobList = null;
    jobList = null;
    return mergedJobList;
  } else {
    return jobList;
  }
};

const execute = async (frameworkName, executionType) => {
  // send request to framework launcher
  let response;
  try {
    response = await axios({
      method: 'put',
      url: launcherConfig.frameworkExecutionTypePath(frameworkName),
      data: {
        ExecutionType: `${executionType}`,
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
  if (response.status === status('Not Found')) {
    throw createError(response.status, 'NoJobError', response.data.message);
  } else if (response.status !== status('Accepted')) {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const get = async (frameworkName) => {
  // send request to framework controller
  logger.debug('Fetch launcher job from ', launcherConfig.summaryFrameworkPath(frameworkName));
  let launcherResponse;
  try {
    launcherResponse = await axios({
      method: 'get',
      url: launcherConfig.summaryFrameworkPath(frameworkName),
      timeout: 30000,
    });
  } catch (error) {
    if (error.response != null) {
      launcherResponse = error.response;
      if (launcherResponse.status === status('Not Found')) {
        throw createError('Not Found', 'NoJobError', `Job ${frameworkName} is not found.`);
      } else {
        throw createError(launcherResponse.status, 'UnknownError', launcherResponse.data.message);
      }
    } else {
      throw error;
    }
  }
  let jobDetail = convertFrameworkDetail(launcherResponse.data);
  jobDetail.jobStatus = Object.assign(convertFrameworkSummary(launcherResponse.data.SummarizedFrameworkInfo), jobDetail.jobStatus);

  // Try to get allocatedMB, allocatedVCores & priority from yarn RM
  try {
    const yarnResponse = await axios({
      method: 'get',
      url: yarnConfig.yarnApplicationPath(jobDetail.appId),
      timeout: 30000,
    });
    const yarnAppInfo = convertGenericFrameworkSummary(yarnResponse.data.app);
    Object.assign(jobDetail.jobStatus, yarnAppInfo);
  } catch (err) {
    // It's acceptable to retrieve nothing from yarn RM
    logger.info(`Unable to get application [${jobDetail.appId}] from yarn resource manager`);
  }

  return jobDetail;
};

const mergeFrameworkSummary = (rmJobList, jobList) => {
  let mergedJobList = {
    'jobs': {},
  };

  mergedJobList.jobs.job = [];
  // eslint-disable-next-line guard-for-in
  for (let i = 0; i < jobList.jobs.job.length; i++) {
    let found = false;
    for (let j = 0; j < rmJobList.jobs.job.length; j++) {
      if (jobList.jobs.job[i].appId === rmJobList.jobs.job[j].appId) {
        mergedJobList.jobs.job.push(Object.assign(jobList.jobs.job[i], rmJobList.jobs.job[j], jobList.jobs.job[i]));
        found = true;
        break;
      }
    }
    if (!found) {
      mergedJobList.jobs.job.push(jobList.jobs.job[i]);
    }
  }
  return mergedJobList.jobs.job;
};

const convertGenericFrameworkSummary = (jobInfo) => {
  const job = {
    appId: jobInfo.id,
    allocatedMB: jobInfo.allocatedMB > 0 ? jobInfo.allocatedMB : 0,
    allocatedVCores: jobInfo.allocatedVCores > 0 ? jobInfo.allocatedVCores : 0,
    priority: jobInfo.priority,
  };
  return job;
};

const convertFrameworkSummary = (frameworkInfo) => {
  // 1. transientNormalRetriedCount
  //    Failed, and it can ensure that it will success within a finite retry times:
  //    such as dependent components shutdown, machine error, network error,
  //    configuration error, environment error...
  // 2. transientConflictRetriedCount
  //    A special TRANSIENT_NORMAL which indicate the exit due to resource conflict
  //    and cannot get required resource to run.
  // 3. unKnownRetriedCount
  //    Usually caused by user's code.
  const totalRetries = frameworkInfo.FrameworkRetryPolicyState.TotalRetriedCount;
  const platformRetries = frameworkInfo.FrameworkRetryPolicyState.TransientNormalRetriedCount;
  const resourceRetries = frameworkInfo.FrameworkRetryPolicyState.TransientConflictRetriedCount;
  const userRetries = frameworkInfo.FrameworkRetryPolicyState.NonTransientRetriedCount;
  const unknownRetries = frameworkInfo.FrameworkRetryPolicyState.UnKnownRetriedCount;
  let jobGroupId = null;

  if (typeof (frameworkInfo.Tags) !== 'undefined') {
    jobGroupId = jobUtils.getGroupIdByAppTagsArray(frameworkInfo.Tags);
  }

  if (jobGroupId === null && config.enableGroupIdCompatibility && frameworkInfo.FrameworkDescription !== '') {
    try {
      let value = JSON.parse(frameworkInfo.FrameworkDescription);
      if (typeof (value.GroupTag) !== 'undefined') {
        jobGroupId = jobUtils.getGroupId(value.GroupTag);
      }
    } catch (e) {
      logger.debug(`${frameworkInfo.FrameworkDescription} failed to parse and groupid.`);
    }
  }

  const job = {
    name: frameworkInfo.FrameworkName,
    moduleName: frameworkInfo.FrameworkName,
    appId: frameworkInfo.ApplicationId,
    username: frameworkInfo.UserName,
    state: convertJobState(frameworkInfo.FrameworkState, frameworkInfo.ApplicationExitCode),
    attemptState: convertJobAttemptState(frameworkInfo.FrameworkState, frameworkInfo.ApplicationExitCode),
    subState: convertFrameworkState(frameworkInfo.FrameworkState),
    executionType: convertExecutionType(frameworkInfo.ExecutionType),
    attemptId: totalRetries,
    version: frameworkInfo.FrameworkVersion,
    retries: totalRetries,
    retryDetails: {
      user: userRetries,
      platform: platformRetries,
      resource: resourceRetries,
      unknown: unknownRetries,
    },
    createdTime: (frameworkInfo.FirstRequestTimestamp * 1000) || new Date(2018, 1, 1).getTime(),
    completedTime: (frameworkInfo.FrameworkCompletedTimestamp * 1000),
    appExitCode: frameworkInfo.ApplicationExitCode,
    virtualCluster: frameworkInfo.Queue,
    totalGpuNumber: 0,
    totalTaskNumber: frameworkInfo.TotalTaskNumber,
    totalTaskRoleNumber: frameworkInfo.TotalTaskRoleNumber,
    jobType: jobUtils.isJobWrapper(frameworkInfo.FrameworkName) === true ? 'JOBWRAPPER': 'LAUNCHER',
    jobDetailLink: jobGroupId === null ? `job-detail.html?jobName=${frameworkInfo.FrameworkName}&subCluster=${subClusterUtil.getCurrentSubClusterInfo().subCluster}`:`job-detail.html?jobName=${frameworkInfo.FrameworkName}&groupId=${jobGroupId}&subCluster=${subClusterUtil.getCurrentSubClusterInfo().subCluster}`,
    runningDataCenter: config.dataCenter,
    appTrackingUrl: '',
    appExitDiagnostics: '',
    appTag: '',
    allocatedMB: 0,
    allocatedVCores: 0,
    priority: 0,
    groupId: jobGroupId,
  };

  // Work around for application progress.
  // Wait launcher to fix the issue.
  job.applicationProgress = job.subState === 'FrameworkCompleted' ? '100%' : `${frameworkInfo.ApplicationProgress * 100}%`;
  return job;
};

const convertExecutionType = (type) => {
  let executionType = '';
  switch (type) {
    case 0:
      executionType = 'START';
      break;
    case 1:
      executionType = 'STOP';
      break;
    default:
      executionType = 'UNKNOWN';
  }
  return executionType;
};

const convertJobState = (frameworkState, exitCode) => {
  let jobState = '';
  switch (frameworkState) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 5:
    case 6:
      jobState = 'WAITING';
      break;
    case 4:
      jobState = 'RUNNING';
      break;
    case 7:
      if (exitCode === 0) {
        jobState = 'SUCCEEDED';
      } else if (exitCode === -170090) {
        jobState = 'STOPPED';
      } else {
        jobState = 'FAILED';
      }
      break;
    default:
      jobState = 'UNKNOWN';
  }
  return jobState;
};

const convertJobAttemptState = (frameworkState, exitCode) => {
  let jobAttemptState = '';
  switch (frameworkState) {
    case 0:
    case 1:
    case 2:
    case 3:
    case 5:
      jobAttemptState = 'WAITING';
      break;
    case 4:
      jobAttemptState = 'RUNNING';
      break;
    case 6:
    case 7:
      if (exitCode === 0) {
        jobAttemptState = 'SUCCEEDED';
      } else if (exitCode === -170090) {
        jobAttemptState = 'STOPPED';
      } else {
        jobAttemptState = 'FAILED';
      }
      break;
    default:
      jobAttemptState = 'UNKNOWN';
  }
  return jobAttemptState;
};

const convertFrameworkDetail = (framework) => {
  let jobDetail = {
    'jobStatus': {},
    'taskRoles': {},
  };
  const frameworkStatus = framework.AggregatedFrameworkStatus.FrameworkStatus;
  const summarizedFrameworkInfo = framework.SummarizedFrameworkInfo;
  if (frameworkStatus && summarizedFrameworkInfo) {
    const jobState = convertJobState(
      frameworkStatus.FrameworkState,
      frameworkStatus.ApplicationExitCode,
    );
    const jobAttemptState = convertJobAttemptState(
      frameworkStatus.FrameworkState,
      frameworkStatus.ApplicationExitCode,
    );

    const totalRetries = frameworkStatus.FrameworkRetryPolicyState.TotalRetriedCount;
    const platformRetries = frameworkStatus.FrameworkRetryPolicyState.TransientNormalRetriedCount;
    const resourceRetries = frameworkStatus.FrameworkRetryPolicyState.TransientConflictRetriedCount;
    const userRetries = frameworkStatus.FrameworkRetryPolicyState.NonTransientRetriedCount;
    const unknownRetries = frameworkStatus.FrameworkRetryPolicyState.UnKnownRetriedCount;
    jobDetail.jobStatus = {
      name: summarizedFrameworkInfo.FrameworkName,
      username: summarizedFrameworkInfo.UserName,
      state: jobState,
      attemptState: jobAttemptState,
      virtualCluster: summarizedFrameworkInfo.Queue,
      subState: convertFrameworkState(frameworkStatus.FrameworkState),
      executionType: convertExecutionType(summarizedFrameworkInfo.ExecutionType),
      attemptId: totalRetries,
      version: summarizedFrameworkInfo.FrameworkVersion,
      retries: totalRetries,
      retryDetails: {
        user: userRetries,
        platform: platformRetries,
        resource: resourceRetries,
        unknown: unknownRetries,
      },
      createdTime: (summarizedFrameworkInfo.FirstRequestTimestamp * 1000),
      completedTime: (frameworkStatus.FrameworkCompletedTimestamp * 1000),
      appId: frameworkStatus.ApplicationId,
      appProgress: frameworkStatus.ApplicationProgress,
      appTrackingUrl: frameworkStatus.ApplicationTrackingUrl,
      appLaunchedTime: (frameworkStatus.ApplicationLaunchedTimestamp * 1000),
      appCompletedTime: (frameworkStatus.ApplicationCompletedTimestamp * 1000),
      appExitCode: frameworkStatus.ApplicationExitCode,
      appExitSpec: null,
      appExitDiagnostics: frameworkStatus.ApplicationExitDiagnostics,
      appExitMessages: {
        container: null,
        runtime: null,
        launcher: null,
      },
      appExitTriggerMessage: null,
      appExitTriggerTaskRoleName: null,
      appExitTriggerTaskIndex: null,
      appliedCpuNumber: summarizedFrameworkInfo.TotalCpuNumber,
      appliedMemoryMB: summarizedFrameworkInfo.TotalMemoryMB,
    };
  }
  const taskRoleStatuses = framework.AggregatedFrameworkStatus.AggregatedTaskRoleStatuses;
  if (taskRoleStatuses) {
    for (let taskRole of Object.keys(taskRoleStatuses)) {
      jobDetail.taskRoles[taskRole] = {
        taskRoleStatus: {
          name: taskRole,
        },
        taskStatuses: taskRoleStatuses[taskRole].TaskStatuses.TaskStatusArray.map(convertTaskDetail),
      };
    }
  }
  return jobDetail;
};

const convertTaskDetail = (task) => {
  const containerPorts = {};
  const platformRetries = task.TaskRetryPolicyState ? task.TaskRetryPolicyState.TransientConflictRetriedCount + task.TaskRetryPolicyState.TransientNormalRetriedCount : 'N/A';
  const userRetries = task.TaskRetryPolicyState ? task.TaskRetryPolicyState.NonTransientRetriedCount : 'N/A';
  const unknownRetries = task.TaskRetryPolicyState ? task.TaskRetryPolicyState.UnKnownRetriedCount : 'N/A';
  return {
    taskIndex: task.TaskIndex,
    taskState: convertTaskState(task.TaskState, task.ContainerExitCode),
    containerId: task.ContainerId,
    containerIp: task.ContainerIPAddress,
    containerHostName: task.ContainerHostName,
    containerPorts,
    containerGpus: 0,
    containerLog: task.ContainerLogHttpAddress,
    containerExitCode: task.ContainerExitCode,
    containerLaunchedTimestamp: task.ContainerLaunchedTimestamp * 1000,
    containerCompletedTimestamp: task.ContainerCompletedTimestamp * 1000,
    containerExitDiagnostics: task.ContainerExitDiagnostics,
    containerExitType: convertTaskExitType(task.ContainerExitType),
    retryDetails: {
      user: userRetries,
      platform: platformRetries,
      unknown: unknownRetries,
    },
  };
};

const convertTaskExitType = (exitType) => {
  switch (exitType) {
    case 0:
      return 'SUCCEEDED';
    case 1:
      return 'TRANSIENT_NORMAL';
    case 2:
      return 'TRANSIENT_CONFLICT';
    case 3:
      return 'NON_TRANSIENT';
    case 4:
      return 'UNKNOWN';
    default:
      return 'NOT_AVAILABLE';
  }
};

const convertTaskState = (taskState, exitCode) => {
  switch (taskState) {
    case 0:
    case 1:
    case 2:
    case 5:
      return 'WAITING';
    case 4:
      return 'RUNNING';
    case 6:
      if (exitCode === 0) {
        return 'SUCCEEDED';
      } else if (exitCode === -170091) {
        return 'STOPPED';
      } else {
        return 'FAILED';
      }
    default:
      return 'UNKNOWN';
  }
};

const convertFrameworkState = (frameworkState) => {
  let subState = '';
  switch (frameworkState) {
    case 0:
      subState = 'FrameworkWaiting';
      break;
    case 1:
      subState = 'ApplicationCreated';
      break;
    case 2:
      subState = 'ApplicationLaunched';
      break;
    case 3:
      subState = 'ApplicationWaiting';
      break;
    case 4:
      subState = 'ApplicationRunning';
      break;
    case 5:
      subState = 'ApplicationRetrievingDiagnostics';
      break;
    case 6:
      subState = 'ApplicationCompleted';
      break;
    case 7:
      subState = 'FrameworkCompleted';
      break;
    default:
      subState = 'UNKNOWN';
  }
  return subState;
};

const put = async () => {
  throw createError('Not Found', 'NoApiError', 'This put API is not supported');
};

const getConfig = async (frameworkName) => {
  throw createError('Not Found', 'NoJobConfigError', `Config of job ${frameworkName} is not found.`);
};

const getSshInfo = async (frameworkName) => {
  throw createError('Not Found', 'NoJobSshInfoError', `SSH info of job ${frameworkName} is not found.`);
};

const getAttempt = async (frameworkName, frameworkVersion, frameworkAttemptId) => {
  let response;
  try {
    response = await axios({
      method: 'get',
      url: launcherConfig.frameworkAttemptPath(frameworkName, frameworkVersion, frameworkAttemptId),
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
    return {
      frameworkFullDetail: convertFrameworkDetail(response.data),
      frameworkInfo: convertFrameworkSummary(response.data.SummarizedFrameworkInfo),
    };
  }
  if (response.status === status('Not Found')) {
    throw createError('Not Found', 'NoFrameworkAttemptError', `[Version: ${frameworkVersion}][AttemptId: ${frameworkAttemptId}] attempt of job ${frameworkName} is not found.`);
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const getAttempts = async (frameworkName, frameworkVersion) => {
  let response;
  try {
    response = await axios({
      method: 'get',
      url: launcherConfig.frameworkAttemptsPath(frameworkName, frameworkVersion),
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
    return {
      attempts: response.data.FrameworkAttempts,
    };
  }
  if (response.status === status('Not Found')) {
    throw createError('Not Found', 'NoFrameworkAttemptsError', `[Version: ${frameworkVersion}] No list of attempts found for framework ${frameworkName}.`);
  } else {
    throw createError(response.status, 'UnknownError', response.data.message + `\nThe version is digital only, probably because the version is in the wrong format.`);
  }
};

const getVersions = async (frameworkName) => {
  let response;
  try {
    response = await axios({
      method: 'get',
      url: launcherConfig.frameworkVersionsPath(frameworkName),
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
    return {
      versions: response.data.FrameworkVersions,
    };
  }
  if (response.status === status('Not Found')) {
    throw createError('Not Found', 'NoFrameworkVersionsError', `No list of versions found for framework ${frameworkName}.`);
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

// module exports
module.exports = {
  list,
  get,
  put,
  execute,
  getConfig,
  getSshInfo,
  getAttempt,
  getAttempts,
  getVersions,
};
