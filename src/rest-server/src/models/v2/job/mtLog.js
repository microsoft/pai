// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the 'Software'), to deal in the Software without restriction, including without limitation
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
const axios = require('@pai/utils/non-strict-axios');
const status = require('statuses');
const createError = require('@pai/utils/error');
const merged = require('@pai/models/v2/job/merged');
const launcherConfig = require('@pai/config/launcher');
const logger = require('@pai/config/logger');
const yarnConfig = require('@pai/config/yarn');
const {sparkHistoryServerConfig} = require('@pai/config/spark');

// limit 100M max size for download log
let logMaxSize = 100 * 1024 * 1024;


const computeLogOffset = async (dumpParam) => {
  let startOffset = parseInt(dumpParam.start);
  let endOffset = undefined;
  if (dumpParam.end === null || dumpParam.end === undefined) {
    if (startOffset >= 0) {
      endOffset = startOffset + logMaxSize;
    } else {
      if (Math.abs(startOffset) > logMaxSize) {
        endOffset = startOffset + logMaxSize;
      }
    }
  } else {
    endOffset = parseInt(dumpParam.end);
    let logLength = endOffset - startOffset;
    if (logLength <= 0) {
      logger.info('end offset should be bigger than start offset');
    } else {
      if (logLength > logMaxSize) {
        endOffset = startOffset + logMaxSize;
      }
    }
  }

  let offsetUrl = undefined;
  if (endOffset === undefined) {
    offsetUrl = `?start=${startOffset.toString()}`;
  } else {
    offsetUrl = `?start=${dumpParam.start}&end=${endOffset.toString()}`;
  }

  return offsetUrl;
};

const generateSparkBaseUrl = async (jobStatus) => {
  let baseUrl = undefined;
  if (jobStatus.state === 'RUNNING') {
    baseUrl = `${launcherConfig.yarnProxyServicePath(jobStatus.appId)}/${jobStatus.appId}`;
  } else {
    baseUrl = sparkHistoryServerConfig.applicationPath(jobStatus.appId);
  }
  return baseUrl;
};

const fetchSparkContainerLogUrl = async (baseUrl, dumpParam) => {
  let fetchResult = await fetch(baseUrl);
  let executorUrl = undefined;
  let attemptIdValid = false;
  if (fetchResult.attempts) {
    for (let attempt of fetchResult.attempts) {
      if (attempt.attemptId === dumpParam.attemptId) {
        attemptIdValid = true;
        break;
      }
    }
  }
  if (attemptIdValid) {
    executorUrl = `${baseUrl}/${dumpParam.attemptId}/allexecutors`;
  } else {
    executorUrl = baseUrl + '/allexecutors';
  }
  let executors = await fetch(executorUrl);
  let containerlogUrl = undefined;
  for (let executor of executors) {
    if (executor.id === dumpParam.executorId) {
      if (executor.executorLogs.stdout) {
          containerlogUrl = executor.executorLogs.stdout;
          containerlogUrl = containerlogUrl.substring(0, containerlogUrl.lastIndexOf('/'));
          return containerlogUrl;
      } else {
          throw Error(`ExecutorId ${dumpParam.executorId} does not have log files!`);
      }
    }
  }
  return null;
};

const fetchLauncherAMContainerLogUrl = async (jobSummary) => {
  if (!jobSummary.appTrackingUrl) {
    throw Error('appTrackingUrl not exist!');
  }
  let containerLogUrl = undefined;
  let amLogContent = await fetch(jobSummary.appTrackingUrl);
  amLogContent = amLogContent.substring(amLogContent.indexOf('attemptsTableData='), amLogContent.length);
  const matches = amLogContent.match(/<a href=.*?<\/a>/g);
  if (!matches) {
    throw Error(`Can't find container log url in appTrackingPage: ${jobSummary.appTrackingUrl}`);
  }
  matches.forEach((match) => {
     if (match.includes('>Logs</a>')) {
       const matchResult = match.match(/http(s)?:\/\/.*'/g);
       if (matchResult) {
         containerLogUrl = matchResult[0].replace('\'', '');
       }
     }
  });
  if (!containerLogUrl) {
    throw Error(`can not match container log url in ${jobSummary.appTrackingUrl}`);
  }
  return containerLogUrl;
};

const fetchLauncherContainerLogUrl = async (dumpParam) => {
  let containerlogUrl = undefined;

  let taskIndex = parseInt(dumpParam.taskIndex);
  let jobSummary = await getSummaryByFrameworkName(dumpParam.jobName);
  if (dumpParam.taskIndex === undefined || dumpParam.taskIndex === 'undefined') {
    containerlogUrl = await fetchLauncherAMContainerLogUrl(jobSummary);
  } else {
    let roleName = (dumpParam.taskRoleName === undefined || dumpParam.taskRoleName === 'undefined') ? Object.keys(jobSummary.taskRoles)[0]:dumpParam.taskRoleName;
    for (let taskStatus of jobSummary.taskRoles[roleName].taskStatuses) {
        if (taskStatus.taskIndex === taskIndex) {
          containerlogUrl = taskStatus.containerLog;
          break;
        }
    }
  }
  return containerlogUrl;
};

const fetchLogsByFilePattern = async (containerlogUrl, logOffset, dumpParam) => {
  let fileInfoList = await fetchLogFileList(`${containerlogUrl}?user.name=${dumpParam.userName}`);
  let filePattern = dumpParam.logFile;
  let containerLogs = [];
  let matchedFiles = [];
  for (let fileInfo of fileInfoList) {
    if (filePattern.toLowerCase() === 'all') {
      let containerlogInfo = await fetchContainerLog(containerlogUrl, fileInfo, logOffset, dumpParam, false);
      containerLogs.push(containerlogInfo);
      matchedFiles.push(containerlogInfo.fileName);
    } else {
      if (fileInfo.fileName.toLowerCase().startsWith(filePattern.toLowerCase())) {
        let containerlogInfo = await fetchContainerLog(containerlogUrl, fileInfo, logOffset, dumpParam, true);
        containerLogs.push(containerlogInfo);
        matchedFiles.push(containerlogInfo.fileName);
      }
    }
  }
  return containerLogs;
};

const fetchLogFileList = async (containerlogUrl) => {
  let containerLog = await fetch(containerlogUrl);
  containerLog = containerLog.substring(containerLog.indexOf('class="content"'), containerLog.length);
  let logFiles = [];
  if (containerLog.indexOf('Log Type') != -1) {
    let logFileNames = [];
    let logLengths = [];
    let matches = containerLog.match(/Log Type:.*\r\n/g);
    matches.forEach((match) => {
      logFileNames.push(match.split(':')[1].trim());
    });

    matches = containerLog.match(/Log Length:.*\r\n/g);
    matches.forEach((match) => {
      logLengths.push(match.split(':')[1].trim());
    });

    for (let i = 0; i < logFileNames.length; i++) {
      let fileInfo = {
        fileName: undefined,
        fileLength: undefined,
      };
      fileInfo.fileName = logFileNames[i];
      fileInfo.fileLength = logLengths[i];
      logFiles.push(fileInfo);
    }
  } else {
    let matches = containerLog.match(/<a href.*<\/a>/g);
    if (matches) {
      matches.forEach((match) => {
        let fileInfo = {
          fileName: undefined,
          fileLength: undefined,
        };
        fileInfo.fileName = match.split('>')[1].split('<')[0].split(':')[0].trim();
        fileInfo.fileLength = match.split('>')[1].split('<')[0].split(':')[1].trim().match(/[0-9]+/)[0];
        logFiles.push(fileInfo);
      });
    }
  }
  if (logFiles.length === 0) {
    throw Error(containerLog);
  }
  return logFiles;
};

const fetchContainerLog = async (containerlogUrl, fileInfo, offset, dumpParam, fetContent=false) => {
  let containLogInfo = {
    fileName: undefined,
    fileLength: undefined,
    content: undefined,
    start: undefined,
    end: undefined,
  };

  containLogInfo.fileName = fileInfo.fileName;
  containLogInfo.fileLength = fileInfo.fileLength;
  containLogInfo.start = dumpParam.start;
  containLogInfo.end = dumpParam.end;
  if (containerlogUrl.endsWith('/')) {
    containerlogUrl = `${containerlogUrl}${fileInfo.fileName}${offset}`;
  } else {
    containerlogUrl = `${containerlogUrl}/${fileInfo.fileName}${offset}`;
  }
  containerlogUrl = `${containerlogUrl}&user.name=${dumpParam.userName}`;
  if (fetContent) {
    let containerLog = await fetch(containerlogUrl);
    containLogInfo.content = containerLog.substring(containerLog.indexOf('<pre>') + 5, containerLog.lastIndexOf('</pre>'));
  }
  return containLogInfo;
};

const getSummaryByFrameworkName = async (frameworkName) => {
  // send request to framework controller
  let response;
  try {
    logger.info('launcherConfig.summaryFrameworkPath(frameworkName): '+launcherConfig.summaryFrameworkPath(frameworkName));
    response = await axios({
      method: 'get',
      url: launcherConfig.summaryFrameworkPath(frameworkName),
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }
  if (response.status === status('OK')) {
    return (await convertFrameworkSummary(response.data));
  }
  if (response.status === status('Not Found')) {
    throw createError('Not Found', 'NoJobError', `Job ${frameworkName} is not found.`);
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const convertFrameworkSummary = async (framework) => {
  let jobDetail = {
    'taskRoles': {},
    'appTrackingUrl': undefined,
  };
  jobDetail.appTrackingUrl = yarnConfig.yarnAppPagePath(framework.AggregatedFrameworkStatus.FrameworkStatus.ApplicationId);
  const taskRoleStatuses = framework.AggregatedFrameworkStatus.AggregatedTaskRoleStatuses;
  if (taskRoleStatuses) {
    for (let taskRole of Object.keys(taskRoleStatuses)) {
      jobDetail.taskRoles[taskRole] = {
        taskRoleStatus: {
          name: taskRole,
        },
        taskStatuses: await Promise.all(taskRoleStatuses[taskRole].TaskStatuses.TaskStatusArray.map(
          async (taskStatus) => await convertTaskDetail(taskStatus))
        ),
      };
    }
  }
  return jobDetail;
};

const convertTaskDetail = async (task) => {
  const containerPorts = {};
  const platformRetries = task.TaskRetryPolicyState ? task.TaskRetryPolicyState.TransientConflictRetriedCount + task.TaskRetryPolicyState.TransientNormalRetriedCount : 'N/A';
  const userRetries = task.TaskRetryPolicyState ? task.TaskRetryPolicyState.NonTransientRetriedCount : 'N/A';
  const unknownRetries = task.TaskRetryPolicyState ? task.TaskRetryPolicyState.UnKnownRetriedCount : 'N/A';
  return {
    taskIndex: task.TaskIndex,
    containerId: task.ContainerId,
    containerIp: task.ContainerIPAddress,
    containerHostName: task.ContainerHostName,
    containerPorts,
    containerGpus: 0,
    containerLog: task.ContainerLogHttpAddress,
    containerExitCode: task.ContainerExitCode,
    containerLaunchedTimestamp: task.ContainerLaunchedTimestamp * 1000,
    containerCompletedTimestamp: task.ContainerCompletedTimestamp * 1000,
    retryDetails: {
      user: userRetries,
      platform: platformRetries,
      unknown: unknownRetries,
    },
  };
};

const dumpContainerLogByAppId = async (dumpParam) => {
  try {
    let containerLogUrl;
    if (dumpParam.logType === 'launcherAM') {
      // fetch am container log, use appId to form app tracking url
      let appTrackingUrl = yarnConfig.yarnAppPagePath(dumpParam.appId);
      let jobSummary = {'appTrackingUrl': appTrackingUrl};
      containerLogUrl = await fetchLauncherAMContainerLogUrl(jobSummary);
    } else {
      let baseUrl = '';
      if (dumpParam.jobStatus && dumpParam.jobStatus.toString().toLowerCase() !== 'running') {
        baseUrl = sparkHistoryServerConfig.applicationPath(dumpParam.appId);
      } else {
        // step 1: fetch job info by appId
        let jobGenericDetail = await merged.getGenericInfoByAppId(dumpParam.appId);
        // step 2: generate base url for RUNNING or Completed job.
        baseUrl = await generateSparkBaseUrl(jobGenericDetail.jobStatus);
      }
      // step 3: fetch container log url by attemptId and executorId
      containerLogUrl = await fetchSparkContainerLogUrl(baseUrl, dumpParam);
    }
    // step 4: Compute log offset by start and end. Limite max log size
    let logOffset = await computeLogOffset(dumpParam);

    // step 5: fetch container log by log file pattern
    let containerLog = await fetchLogsByFilePattern(containerLogUrl, logOffset, dumpParam);
    return containerLog;
  } catch (error) {
    throw createError('Not Found', 'NoLogError', `${error.message}`);
  }
};

const dumpContainerLogByName = async (dumpParam) => {
  try {
    if (dumpParam.jobType === 'Launcher') {
      let containerLogUrl;
      if (dumpParam.containerLogUrl !== undefined) {
        // step 1: fetch container log url by taskIndex and jobName
        containerLogUrl = dumpParam.containerLogUrl;
      } else {
        containerLogUrl = await fetchLauncherContainerLogUrl(dumpParam);
      }
      // step 2: Compute log offset by start and end. Limite max log size
      let logOffset = await computeLogOffset(dumpParam);

      // step 3: fetch container log by log file pattern
      let containerLog = await fetchLogsByFilePattern(containerLogUrl, logOffset, dumpParam);
      return containerLog;
    } else if (dumpParam.jobType === 'Spark') {
      let jobInfo = await merged.getGenericInfoByName(dumpParam.jobName);
      // step 1: fetch job info by jobName
      dumpParam.appId = jobInfo.jobStatus.appId;

      // step 2: fetch spark log by AppId
      let containerLog = await dumpContainerLogByAppId(dumpParam);
      return containerLog;
    }
    return null;
  } catch (error) {
    throw createError('Not Found', 'NoLogError', `${error.message}`);
  }
};

const fetch = async (fetchUrl) => {
  // send request to resource manager
  let response;
  try {
    response = await axios({
      method: 'get',
      url: fetchUrl,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw Error(`Can not fetch ${fetchUrl}, error: ${error}`);
    }
  }
  if (response.status === status('OK')) {
    if (response.data) {
      return response.data;
    } else {
      return response.data;
    }
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

// module exports
module.exports = {
  dumpContainerLogByAppId,
  dumpContainerLogByName,
  fetch,
  fetchSparkContainerLogUrl,
  fetchLauncherContainerLogUrl,
  fetchLauncherAMContainerLogUrl,
  generateSparkBaseUrl,
};
