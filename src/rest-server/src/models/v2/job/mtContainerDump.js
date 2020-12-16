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
const createError = require('@pai/utils/error');
const merged = require('@pai/models/v2/job/merged');
const mtLog = require('@pai/models/v2/job/mtLog');
const launcherConfig = require('@pai/config/launcher');

// fetch heapdump url by the containerLogUrl
const fetchContainerHeapDumpUrl = async (containerLogUrl, heapdumpParam) => {
  if (containerLogUrl === null) {
    return null;
  }
  let containerId = containerLogUrl.substring(containerLogUrl.lastIndexOf('container'));
  containerId = containerId.substring(0, containerId.indexOf('/'));
  let nodeHttpProxyAddress = containerLogUrl.substring(0, containerLogUrl.lastIndexOf('/node/'));
  let containerHeapDumpUrl = `${nodeHttpProxyAddress}/ws/v1/node/containers/${containerId}/heapDump?isLive=${heapdumpParam.isLive}`;
  return containerHeapDumpUrl;
};

// fetch precessTreeDump url by the containerLogUrl
const fetchContainerProcessTreeDumpUrl = async (containerLogUrl, pTreeDumpParam) => {
  if (containerLogUrl === null) {
    return null;
  }
  let containerId = containerLogUrl.substring(containerLogUrl.lastIndexOf('container'));
  containerId = containerId.substring(0, containerId.indexOf('/'));
  let nodeHttpProxyAddress = containerLogUrl.substring(0, containerLogUrl.lastIndexOf('/node/'));
  let containerProcessTreeDumpUrl = `${nodeHttpProxyAddress}/ws/v1/node/containers/${containerId}/processTreeDump?isAllContainers=${pTreeDumpParam.isAllContainers}`;
  return containerProcessTreeDumpUrl;
};

// fetch threadDump url by the containerLogUrl, only supported for Launcher job
const fetchLauncherContainerThreadDumpUrl = async (containerLogUrl) => {
  if (containerLogUrl === null) {
    return null;
  }
  let containerId = containerLogUrl.substring(containerLogUrl.lastIndexOf('container'));
  containerId = containerId.substring(0, containerId.indexOf('/'));
  let nodeHttpProxyAddress = containerLogUrl.substring(0, containerLogUrl.lastIndexOf('/node/'));
  let containerThreadDumpUrl = `${nodeHttpProxyAddress}/ws/v1/node/containers/${containerId}/threadDump`;
  return containerThreadDumpUrl;
};

// fetch threadDump url by the containerLogUrl, only supported for Spark job
const fetchSparkExecutorThreadDumpUrl = async (baseUrl, threadDumpParam) => {
  let fetchResult = await mtLog.fetch(baseUrl);
  let executorInfoUrl = undefined;
  let executorThreadDumpUrl = undefined;
  let attemptIdValid = false;
  if (fetchResult.attempts) {
    for (let attempt of fetchResult.attempts) {
      if (attempt.attemptId === threadDumpParam.attemptId) {
        attemptIdValid = true;
        break;
      }
    }
  }
  if (attemptIdValid) {
    executorInfoUrl = `${baseUrl}/${threadDumpParam.attemptId}/executors`;
  } else {
    executorInfoUrl = `${baseUrl}/executors`;
  }
  // make sure that this executor is existed
  let executorInfo = await mtLog.fetch(executorInfoUrl);
  if (executorInfo) {
    for (let oneExecutorInfo of executorInfo) {
      if (oneExecutorInfo.id === threadDumpParam.executorId) {
        executorThreadDumpUrl = `${executorInfoUrl}/${oneExecutorInfo.id}/threads`;
        return executorThreadDumpUrl;
      }
    }
  }
  return null;
};

// Only support for Launcher job
const heapDumpContainerByJobName = async (heapdumpParam) => {
  let jobInfo = await merged.getGenericInfoByName(heapdumpParam.jobName);
  // Step 1: make sure the job is RUNNING
  if (jobInfo.jobStatus.state.toString().toLowerCase() !== 'running') {
    throw createError('Bad Request', 'InvalidParametersError', 'Job is not running,can not heapdump');
  }
  // Step 2: fetch containerLogUrl for the job taskIndex
  let containerLogUrl = await mtLog.fetchLauncherContainerLogUrl(heapdumpParam);
  if (containerLogUrl === null || containerLogUrl === undefined) {
    throw createError('Not Found', 'InvalidParametersError', 'Not found containerLogUrl for the container');
  }
  try {
    // Step 3: fetch heapDumpUrl for the container
    let containerHeapDumpUrl = await fetchContainerHeapDumpUrl(containerLogUrl, heapdumpParam);
    // Step 4: fetch heapdump response, may be need a lot of time
    let heapdumpResponse = await mtLog.fetch(containerHeapDumpUrl);
    return heapdumpResponse;
  } catch (error) {
    throw createError('Internal Server Error', 'NoDumpError', `${error.message}`);
  }
};

// Only support for Spark job
const heapDumpContainerByAppId = async (heapdumpParam) => {
  let jobGenericDetail = await merged.getGenericInfoByAppId(heapdumpParam.appId);
  let latestAttemptId = jobGenericDetail.jobStatus.latestAttemptId;
  if (jobGenericDetail.jobStatus.state.toString().toLowerCase() !== 'running') {
    throw createError('Bad Request', 'InvalidParametersError', 'Job is not running, can not heapDump');
  }
  try {
    let baseUrl = '';
    // step 1: generate base url for RUNNING job
    baseUrl = await mtLog.generateSparkBaseUrl(jobGenericDetail.jobStatus);
    // step 2: fetch container log url by attemptId and executorId
    if (heapdumpParam.attemptId === null || heapdumpParam.attemptId === undefined) {
      heapdumpParam.attemptId = latestAttemptId;
    } else if (heapdumpParam.attemptId !== latestAttemptId) {
      throw createError('Bad Request', 'InvalidParametersError', 'The attemptId is not the latest, can not heapDump');
    }
    let containerLogUrl = await mtLog.fetchSparkContainerLogUrl(baseUrl, heapdumpParam);
    if (containerLogUrl === null || containerLogUrl === undefined) {
      throw createError('Not Found', 'InvalidParametersError', 'Not found containerLogUrl for the executor');
    }
    // step 3: fetch container heapdump url by containerLogUrl
    let containerHeapDumpUrl = await fetchContainerHeapDumpUrl(containerLogUrl, heapdumpParam);
    // step 4: heapdump by heapdumpContainerUrl
    let heapdumpResponse = await mtLog.fetch(containerHeapDumpUrl);
    return heapdumpResponse;
  } catch (error) {
    throw createError('Internal Server Error', 'NoDumpError', `${error.message}`);
  }
};

// Only support for Launcher job
const processTreeDumpContainerByJobName = async (pTreeDumpParam) => {
  let jobInfo = await merged.getGenericInfoByName(pTreeDumpParam.jobName);
  // Step 1: make sure the job is RUNNING
  if (jobInfo.jobStatus.state.toString().toLowerCase() !== 'running') {
    throw createError('Bad Request', 'InvalidParametersError', 'Job is not running, can not processTreeDump');
  }
  // Step 2: fetch containerLogUrl for the job taskIndex
  let containerLogUrl = await mtLog.fetchLauncherContainerLogUrl(pTreeDumpParam);
  if (containerLogUrl === null || containerLogUrl === undefined) {
    throw createError('Not Found', 'InvalidParametersError', 'Not found containerLogUrl for the container');
  }
  try {
    // step 3: fetch container processTreeDump url  by containerLogUrl
    let containerProcessTreeDumpUrl = await fetchContainerProcessTreeDumpUrl(containerLogUrl, pTreeDumpParam);
    // Step 4: fetch processTreeDump response
    let processTreeDumpResponse = await mtLog.fetch(containerProcessTreeDumpUrl);
    return processTreeDumpResponse;
  } catch (error) {
    throw createError('Internal Server Error', 'NoDumpError', `${error.message}`);
  }
};

// Only support for Spark job
const processTreeDumpContainerByAppId = async (pTreeDumpParam) => {
  let jobGenericDetail = await merged.getGenericInfoByAppId(pTreeDumpParam.appId);
  let latestAttemptId = jobGenericDetail.jobStatus.latestAttemptId;
  if (jobGenericDetail.jobStatus.state.toString().toLowerCase() !== 'running') {
    throw createError('Bad Request', 'InvalidParametersError', 'Job is not running, can not processTreeDump');
  }
  let baseUrl = '';
  // step 1: generate base url for RUNNING job
  baseUrl = await mtLog.generateSparkBaseUrl(jobGenericDetail.jobStatus);
  // step 2: fetch container log url by attemptId and executorId
  if (pTreeDumpParam.attemptId === null || pTreeDumpParam.attemptId === undefined) {
    pTreeDumpParam.attemptId = latestAttemptId;
  } else if (pTreeDumpParam.attemptId !== latestAttemptId) {
    throw createError('Bad Request', 'InvalidParametersError', 'The attemptId is not the latest, can not processTreeDump');
  }
  let containerLogUrl = await mtLog.fetchSparkContainerLogUrl(baseUrl, pTreeDumpParam);
  if (containerLogUrl === null || containerLogUrl === undefined) {
    throw createError('Not Found', 'InvalidParametersError', 'Not found containerLogUrl for the executor');
  }
  try {
    // step 3: fetch container processTreeDumpUrl  by containerLogUrl
    let containerProcessTreeDumpUrl = await fetchContainerProcessTreeDumpUrl(containerLogUrl, pTreeDumpParam);
    let containerId = containerProcessTreeDumpUrl.substring(containerProcessTreeDumpUrl.lastIndexOf('container_'), containerProcessTreeDumpUrl.lastIndexOf('/processTreeDump'));
    // step 4: processTreeDump by processTreeDumpContainerUrl
    let processTreeDumpResponse = await mtLog.fetch(containerProcessTreeDumpUrl);
    // step 5: Spark Job don't have executorId and containerId map, so add containerId to sure which is current container
    let pTreeDumpResponseForAppId = {
      'containerId': containerId,
      'processTreeDump': processTreeDumpResponse,
    };
    return pTreeDumpResponseForAppId;
  } catch (error) {
    throw createError('Internal Server Error', 'NoDumpError', `${error.message}`);
  }
};

// Only support for Launcher job
const threadDumpContainerByJobName = async (threadDumpParam) => {
  let jobInfo = await merged.getGenericInfoByName(threadDumpParam.jobName);
  // Step 1: make sure the job is RUNNING
  if (jobInfo.jobStatus.state.toString().toLowerCase() !== 'running') {
    throw createError('Bad Request', 'InvalidParametersError', 'Job is not running,can not threadDump');
  }
  // Step 2: fetch containerLogUrl for the job taskIndex
  let containerLogUrl = await mtLog.fetchLauncherContainerLogUrl(threadDumpParam);
  if (containerLogUrl === null || containerLogUrl === undefined) {
    throw createError('Not Found', 'InvalidParametersError', 'Not found containerLogUrl for the container');
  }
  try {
    // step 3: fetch container threadDump url  by containerLogUrl
    let containerThreadDumpUrl = await fetchLauncherContainerThreadDumpUrl(containerLogUrl, threadDumpParam);
    // Step 4: fetch threadDump response
    let threadDumpResponse = await mtLog.fetch(containerThreadDumpUrl);
    return threadDumpResponse;
  } catch (error) {
    throw createError('Internal Server Error', 'NoDumpError', `${error.message}`);
  }
};

// Only support for Spark job
const threadDumpContainerByAppId = async (threadDumpParam) => {
  let jobGenericDetail = await merged.getGenericInfoByAppId(threadDumpParam.appId);
  let latestAttemptId = jobGenericDetail.jobStatus.latestAttemptId;
  if (threadDumpParam.attemptId === null || threadDumpParam.attemptId === undefined) {
    threadDumpParam.attemptId = latestAttemptId;
  } else if (threadDumpParam.attemptId !== latestAttemptId) {
    throw createError('Bad Request', 'InvalidParametersError', 'The attemptId is not the latest, can not processTreeDump');
  }
  if (jobGenericDetail.jobStatus.state.toString().toLowerCase() !== 'running') {
    throw createError('Bad Request', 'InvalidParametersError', 'Job is not running,can not threadDump');
  }
  let baseUrl = '';
  // step 1: generate base url for RUNNING job
  baseUrl = await mtLog.generateSparkBaseUrl(jobGenericDetail.jobStatus);
  try {
    // step 2: fetch executor threadDumpUrl
    let executorThreadDumpUrl = await fetchSparkExecutorThreadDumpUrl(baseUrl, threadDumpParam);
    if (executorThreadDumpUrl === null || executorThreadDumpUrl === undefined) {
      throw createError('Not Found', 'InvalidParametersError', 'Not found executor threadDumpUrl for the executor');
    }

    let threadDumpResponse = mtLog.fetch(executorThreadDumpUrl);
    return threadDumpResponse;
  } catch (error) {
    throw createError('Internal Server Error', 'NoDumpError', `${error.message}`);
  }
};

// Only support for Launcher job
const getContainerDumpFileUrlByJobName = async (dumpParam) => {
  try {
    if (dumpParam.jobType === 'Launcher') {
      let containerLogUrl;
      if (dumpParam.containerLogUrl !== undefined) {
        containerLogUrl = dumpParam.containerLogUrl;
      } else {
        containerLogUrl = await mtLog.fetchLauncherContainerLogUrl(dumpParam);
      }
      if (containerLogUrl === null || containerLogUrl === undefined) {
        throw createError('Not Found', 'NoLogError', 'Cannot get containerLogUrl for the container');
      }
      let request = require('sync-request');
      let res = request('GET', containerLogUrl.toString());
      let rediectContainerLogUrl = res.url;
      let downloadDumpFileRestAddress;
      if (rediectContainerLogUrl.toString().indexOf('jobhistory') >= 0) {
        downloadDumpFileRestAddress = rediectContainerLogUrl.substring(0, rediectContainerLogUrl.indexOf('applicationhistory')) + 'ws/v1/applicationhistory/containerlogs/'
            +rediectContainerLogUrl.substring(rediectContainerLogUrl.lastIndexOf('container'), rediectContainerLogUrl.lastIndexOf('/'));
      } else {
        let containerId = rediectContainerLogUrl.substring(rediectContainerLogUrl.lastIndexOf('container'));
        containerId = containerId.substring(0, containerId.indexOf('/'));
        downloadDumpFileRestAddress = rediectContainerLogUrl.substring(0, rediectContainerLogUrl.indexOf('node/')) + 'ws/v1/node/containerlogs/'
            +containerId;
      }
      let downloadDumpFileUrl = `${downloadDumpFileRestAddress}/${dumpParam.logFile}?get_raw_file=true`;
      return downloadDumpFileUrl;
    } else if (dumpParam.jobType === 'Spark') {
      let jobInfo = await merged.getGenericInfoByName(dumpParam.jobName);
      dumpParam.appId = jobInfo.jobStatus.appId;
      let downloadDumpFileUrl = await getContainerDumpFileUrlByAppId(dumpParam);
      return downloadDumpFileUrl;
    }
    return null;
  } catch (error) {
    throw createError('Not Found', 'NoLogError', `${error.message}`);
  }
};

const getContainerDumpFileUrlByAppId = async (dumpParam) => {
  let containerLogUrl;
  if (dumpParam.logType === 'launcherAM') {
    let appTrackingUrl = launcherConfig.yarnServicePath(dumpParam.appId);
    let jobSummary = {'appTrackingUrl': appTrackingUrl};
    containerLogUrl = await mtLog.fetchLauncherAMContainerLogUrl(jobSummary);
  } else {
    let baseUrl = '';
    let jobGenericDetail = await merged.getGenericInfoByAppId(dumpParam.appId);
    if (jobGenericDetail.jobStatus.state.toString().toLowerCase() !== 'running') {
      baseUrl = `${launcherConfig.sparkHistoryServicePath()}/${dumpParam.appId}`;
    } else {
      baseUrl = await mtLog.generateSparkBaseUrl(jobGenericDetail.jobStatus);
    }
    containerLogUrl = await mtLog.fetchSparkContainerLogUrl(baseUrl, dumpParam);
  }
  if (containerLogUrl === null || containerLogUrl === undefined) {
    throw createError('Not Found', 'NoLogError', 'Cannot get containerLogUrl for the executor');
  }
  try {
    let request = require('sync-request');
    let res = request('GET', containerLogUrl.toString());
    let rediectContainerLogUrl = res.url;
    let downloadDumpFileRestAddress;
    if (rediectContainerLogUrl.toString().indexOf('jobhistory') >= 0) {
      downloadDumpFileRestAddress = rediectContainerLogUrl.substring(0, rediectContainerLogUrl.indexOf('applicationhistory')) + 'ws/v1/applicationhistory/containerlogs/'
            +rediectContainerLogUrl.substring(rediectContainerLogUrl.lastIndexOf('container'), rediectContainerLogUrl.lastIndexOf('/'));
    } else {
      let containerId = rediectContainerLogUrl.substring(rediectContainerLogUrl.lastIndexOf('container'));
      containerId = containerId.substring(0, containerId.indexOf('/'));
      downloadDumpFileRestAddress = rediectContainerLogUrl.substring(0, rediectContainerLogUrl.indexOf('node/')) + 'ws/v1/node/containerlogs/'
          +containerId;
    }
    let downloadDumpFileUrl = `${downloadDumpFileRestAddress}/${dumpParam.logFile}?get_raw_file=true`;
    return downloadDumpFileUrl;
  } catch (error) {
    throw createError('Not Found', 'NoLogError', `${error.message}`);
  }
};

// module exports
module.exports = {
  heapDumpContainerByJobName,
  heapDumpContainerByAppId,
  processTreeDumpContainerByJobName,
  processTreeDumpContainerByAppId,
  threadDumpContainerByJobName,
  threadDumpContainerByAppId,
  getContainerDumpFileUrlByJobName,
  getContainerDumpFileUrlByAppId,
};
