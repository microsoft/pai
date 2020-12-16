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
const mtYarnModel = require('@pai/models/v2/job/mtYarn');
const mtSparkModel = require('@pai/models/v2/job/mtSpark');
const mtLauncherModel = require('@pai/models/v2/job/mtLauncher');
const yarnConfig = require('@pai/config/yarn');
const config = require('@pai/config/index');
const logger = require('@pai/config/logger');
const apiGateways = require('@pai/config/api-gateway');
const subClusterUtil = require('@pai/utils/subCluster');

/**
 * Merged jobs consist launcher jobs and spark jobs.
 */
class MergedJobListCache {
  constructor() {
    this._launcherJobList = []; // Use a map could be faster, but cpu timing is not main bottleneck now.
    this._sparkJobMap = new Map();
    this._jobRefreshInterval = config.jobRefreshInterval * 1000; // unit: milliseconds
  }

  async refreshJobList() {
    this._launcherJobList = (await mtLauncherModel.list()).jobs.job;
    this._sparkJobMap = await fetchSparkTypeJobs();
  }

  /* The real interval is (time for refreshJobList + config.jobRefreshInterval) */
  async keepRefreshing() {
    try {
      await this.refreshJobList();
      logger.debug('Finished refresing job list cache!');
    } catch (err) {
      logger.error(`Refresh merged job list failed: ${err}`);
    }
    setTimeout(() => {
      this.keepRefreshing();
    }, this._jobRefreshInterval);
  }

  get jobList() {
    return [...this._launcherJobList, ...this._sparkJobMap.values()];
  }

  getCachedSparkJobByName(jobName) {
    let job = undefined;
    for (let sparkJob of this._sparkJobMap.values()) {
      if (sparkJob.name !== jobName) {
        continue;
      }
      // Spark jobs may have same name. Currently we fetch the one with the biggest appId, which means it's the latest one.
      if (job === undefined || job.appId < sparkJob.appId) {
        job = sparkJob;
      }
    }
    return job;
  }

  async getJobByAppId(appId) {
    // Both spark job and launcher job support getByAppId
    let job = this._sparkJobMap.get(appId); // Returns undefined if not found
    if (job === undefined) {
      job = this._launcherJobList.find((job) => job.appId === appId);
    }

    // Need to fetch from yarn or spark history server
    if (job === undefined) {
      try {
        job = await mtYarnModel.get(appId);
      } catch (err) {
        logger.info(`Unable to get job [${appId}] from yarn`);
      }
    }

    if (job === undefined) {
      try {
        job = await mtSparkModel.get(appId);
      } catch (err) {
        logger.info(`Unable to get job [${appId}] from spark history server`);
      }
    }

    if (job !== undefined) {
      if (job.jobType in ['LAUNCHER', 'JOBWRAPPER']) {
        this._launcherJobList.push(job);
      } else if (job.jobType in ['SPARK', 'LIVY-SESSION', 'LIVY-BATCH']) {
        this._sparkJobMap.set(appId, job);
      } else {
        logger.warn(`Invalid job type: ${job.jobType}`);
      }
    }

    return job;
  }

  async getJobByJobName(jobName) {
    // Launcher jobs will be returned immediately. Spark jobs will be returned with some delay.
    // For legacy code structure reasons, the types are not consistent.
    let job = this._launcherJobList.find((job) => job.jobName === jobName); // This is a job summary (See convertFrameworkSummary function in mtLauncher.js)
    if (job === undefined) {
      job = this.getCachedSparkJobByName(jobName);
    }
    if (job === undefined) {
      try {
        const jobDetail = await mtLauncherModel.get(jobName); // This is a job detail (See convertFrameworkDetail function in mtLauncher.js). A job detail should be superset of job summary
        job = jobDetail.jobStatus;
        this._launcherJobList.push(job);
      } catch (err) {
        logger.info(`Unable to get job [${jobName}] from launcher or spark history server`);
      }
    }
    return job; // Returns a job-like object if found, undefined if not found
  }
}

const mergedJobListCache = new MergedJobListCache();
mergedJobListCache.keepRefreshing();

let MAX_RETRY_COUNT = 5;

let appsFilters = ['SUCCEEDED_24', 'SUCCEEDED', 'FAILED_24', 'FAILED', 'STOPPED_24', 'STOPPED'];

const listMergedJobs = async (query) => {
  try {
    let response = await generateListResponse(query);
    return response;
  } catch (error) {
    throw createError('Internal Server Error', 'UnknownError', `get merged job list failed ${error}`);
  }
};

const getAppsCount = async (query) => {
  let emptyQuery = {};
  let staleAppsCountInfo = {
    'appsCount': {},
  };
  try {
    let response = await generateListResponse(emptyQuery);

    const totalApps = response.mergedJobs.length;
    for (let i = 0; i < totalApps; i++) {
      const appInfo = response.mergedJobs[i];
      const appVirtualCluster = appInfo.virtualCluster ? appInfo.virtualCluster : 'UNKNOWN';
      if (!staleAppsCountInfo.appsCount.hasOwnProperty(appVirtualCluster)) {
        staleAppsCountInfo.appsCount[appVirtualCluster] = {
          'RUNNING': 0,
          'PREPARING': 0,
          'WAITTING': 0,
          'SUCCEEDED_24': 0,
          'SUCCEEDED': 0,
          'FAILED_24': 0,
          'FAILED': 0,
          'STOPPED_24': 0,
          'STOPPED': 0,
          'ARCHIVED': 0,
          'INCOMPLETED': 0,
        };
      }

      for (let j = 0; j < appsFilters.length; j++) {
        const filter = appsFilters[j];
        let split = filter.split('_');
        if (split[0] === appInfo.state) {
          const hours = Math.floor((Date.now() - appInfo.completedTime) / 1000 / 3600);
          if ((split.length > 1 && hours < split[1]) || (split.length === 1)) {
            if ( !staleAppsCountInfo.appsCount[appVirtualCluster].hasOwnProperty(filter)) {
              staleAppsCountInfo.appsCount[appVirtualCluster][filter] = 0;
            }
            staleAppsCountInfo.appsCount[appVirtualCluster][filter] += 1;
          }
        }
      }

      if (!appsFilters.includes(appInfo.state)) {
        if (!staleAppsCountInfo.appsCount[appVirtualCluster].hasOwnProperty(appInfo.state)) {
          staleAppsCountInfo.appsCount[appVirtualCluster][appInfo.state] = 0;
        }
        staleAppsCountInfo.appsCount[appVirtualCluster][appInfo.state] += 1;
      }
    }

    return staleAppsCountInfo;
  } catch (error) {
    throw createError('Internal Server Error', 'UnknownError', `get merged job count failed ${error}`);
  }
};

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const fetchSparkTypeJobs = async () => {
  const tempJobListMapByAppid = new Map();

  try {
    let mtYarnResponse = [];
    let lastError;
    let i = 0;
    for (i = 0; i < MAX_RETRY_COUNT; i++) {
      try {
        mtYarnResponse = await mtYarnModel.list();
        break;
      } catch (error) {
        lastError = error;
        await sleep(10000);
      }
    }
    if (mtYarnResponse.length === 0) {
      logger.error(`Fail to get job list from yarn. Last Error: ${lastError.message}`);
    } else {
      mtYarnResponse.map((job) => {
        tempJobListMapByAppid.set(job.appId, job);
      });
    }

    let mtSparkResponse = [];
    for (i = 0; i < MAX_RETRY_COUNT; i++) {
      try {
        mtSparkResponse = await mtSparkModel.list();
        break;
      } catch (error) {
        lastError = error;
        await sleep(10000);
      }
    }
    if (mtSparkResponse.length === 0) {
      logger.error(`Fail to get job list from Sparkhistory server. Last Error: ${lastError.message}`);
    } else {
      mtSparkResponse.map((job) => {
        if (!tempJobListMapByAppid.has(job.appId)) {
          // if the subCluster returned from shs server is null or the value equals to restserver environment cluster, the job is valid
          if (job.subCluster === null || job.subCluster === '' || job.subCluster === undefined ||
            job.subCluster.toLowerCase() === config.subCluster.toLowerCase()) {
            tempJobListMapByAppid.set(job.appId, job);
          }
        }
      });
    }
  } catch (error) {
    logger.error(`Failed to get latest job list ${error}`);
  }

  return tempJobListMapByAppid;
};

const getQueueAcl = async (vcName, user, queueAclType) => {
  try {
    let mtYarnResponse = await mtYarnModel.getQueueAcl(vcName, user, queueAclType);
    return mtYarnResponse;
  } catch (error) {
    throw createError('Internal Server Error', 'UnknownError', `Failed to get queue acl information ${error}`);
  }
};

const executeJobByAppId = async (appId, executionType, userName) => {
  // Errors are already handled in execute method
  await mtYarnModel.execute(appId, executionType, userName);
};

const executeJobByJobName = async (jobName, executionType, userName) => {
  // Not applicable for newly created spark job which is not fetched to cache
  // Errors are already handled in execute method
  let sparkJob = mergedJobListCache.getCachedSparkJobByName(jobName);
  if (sparkJob === undefined) {
    await mtLauncherModel.execute(jobName, executionType);
  } else {
    await executeJobByAppId(sparkJob.appId, executionType, userName);
  }
};

const generateListResponse = async (query) => {
  let jobs = mergedJobListCache.jobList;
  if (query.username) {
    jobs = jobs.filter((jobInfo) => jobInfo.username === query.username);
  }
  if (query.virtualCluster) {
    jobs = jobs.filter((jobInfo) => jobInfo.virtualCluster === query.virtualCluster);
  }
  // For job list, it just needs return the light weight summary infomration, which shouldn't include the details columns.
  return {
    mergedJobs: jobs.map(generateGenericSummary),
  };
};

const getJobsByGroupId = async (groupId, query) => {
  const jobs = mergedJobListCache.jobList;
  let matchJobs = jobs.filter((job) => job.groupId === groupId);
  if (query.jobtype) { // Inconsistent with other query params
    matchJobs = matchJobs.filter((job) => job.jobType === query.jobtype);
  }
  return {
    apps: matchJobs,
  };
};

const getFrameworkAttemptInfo = async (jobName, version, attemptId) => {
  const result = await mtLauncherModel.getAttempt(jobName, version, attemptId);
  result.frameworkInfo = await generateGenericDetail(result.frameworkInfo);
  return result;
};

// So far only Launcher job support get generic info by name
const getGenericInfoByName = async (jobName) => {
  // Currently we only support fetching launcher jobs by jobname. Spark job is not supported because two spark jobs may have the same job name.
  let job = await mergedJobListCache.getJobByJobName(jobName);
  if (job) {
    const jobGenericDetail = await generateGenericDetail(job);
    return jobGenericDetail;
  } else {
    throw createError('Not Found', 'NoJobError', `Job ${jobName} is not found.`);
  }
};

const getGenericInfoByAppId = async (appId) => {
  const job = await mergedJobListCache.getJobByAppId(appId);
  if (job) {
    const jobGenericDetail = await generateGenericDetail(job);
    return jobGenericDetail;
  } else {
    throw createError('Not Found', 'NoJobError', `Application ${appId} is not found.`);
  }
};

const getResourceRequestsByAppId = async (appId) => {
  try {
    // Removed the detection of whether the appId is in jobListMap,
    // because the Launcher JobHistory needs to get information about apps whose appId is not in the jobListMap.
    let jobResourceRequests = await generateResourceRequestsByAppId(appId);
    return jobResourceRequests;
  } catch (error) {
    throw error;
  }
};

const generateResourceRequestsByAppId = async (appId) => {
  let jobResourceRequests = {
    resourceRequests: [],
  };

  let response;
  try {
    response = await axios({
      method: 'get',
      url: yarnConfig.yarnAppResourceRequestsPath(appId),
      timeout: 30000,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }

  if (response.status === status('OK') && response.data.resourceRequests) {
    jobResourceRequests.resourceRequests = response.data.resourceRequests;
  }

  return jobResourceRequests;
};

// Generate the light weight summary infomration from the details infomation.
const generateGenericSummary = (jobInfo) => {
  if (jobInfo) {
    let jobInfoSummary = {
      name: jobInfo.name,
      username: jobInfo.username,
      appId: jobInfo.appId,
      state: jobInfo.state,
      executionType: jobInfo.executionType,
      virtualCluster: jobInfo.virtualCluster,
      allocatedMB: jobInfo.allocatedMB,
      allocatedVCores: jobInfo.allocatedVCores,
      priority: jobInfo.priority,
      retries: jobInfo.retries,
      jobType: jobInfo.jobType,
      createdTime: jobInfo.createdTime,
      completedTime: jobInfo.completedTime,
      totalGpuNumber: jobInfo.totalGpuNumber,
      totalTaskNumber: jobInfo.totalTaskNumber,
      applicationProgress: jobInfo.applicationProgress,
      jobDetailLink: jobInfo.jobDetailLink,
      groupId: jobInfo.groupId,
      containerAnalysis: jobInfo.applicationContainerAnalysis,
    };
    return jobInfoSummary;
  } else {
    return null;
  }
};

const generateGenericDetail = async (jobInfo) => {
  let jobGenericDetail = {
    'jobStatus': {},
  };
  jobGenericDetail.jobStatus = jobInfo;
  jobGenericDetail.jobStatus.queuePercentageUseage = 0;
  jobGenericDetail.jobStatus.allocatedMB = 0;
  jobGenericDetail.jobStatus.reservcedMB = 0;
  jobGenericDetail.jobStatus.utilizedMB = 0;
  jobGenericDetail.jobStatus.allocatedVCores = 0;
  jobGenericDetail.jobStatus.reservcedVCores = 0;
  jobGenericDetail.jobStatus.utilizedVCores = 0;
  jobGenericDetail.jobStatus.priority = 0;
  jobGenericDetail.jobStatus.reservedContainers = 0;
  jobGenericDetail.jobStatus.runningContianers = 0;
  jobGenericDetail.jobStatus.pendingContaines = 0;
  jobGenericDetail.jobStatus.resourceRequests = [];
  jobGenericDetail.jobStatus.preemptedResourceMB = 0;
  jobGenericDetail.jobStatus.preemptedResourceVCores = 0;
  jobGenericDetail.jobStatus.numNonAMContainerPreempted = 0;
  jobGenericDetail.jobStatus.numAMContainerPreempted = 0;
  jobGenericDetail.jobStatus.preemptedMemorySeconds = 0;
  jobGenericDetail.jobStatus.preemptedVcoreSeconds = 0;
  jobGenericDetail.jobStatus.utilizedVmemorySeconds = 0;
  jobGenericDetail.jobStatus.utilizedPmemorySeconds = 0;
  jobGenericDetail.jobStatus.utilizedVcoreSeconds = 0;
  jobGenericDetail.jobStatus.containerAnalysis = {};

  let response;
  let yarnUrl = yarnConfig.yarnApplicationPath(jobInfo.appId);
  try {
    response = await axios({
      method: 'get',
      url: yarnUrl,
      timeout: 30000,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    }
    logger.error(`Send request to ${yarnUrl} failed: ${error}`);
  }

  if (response.status === status('OK') && response.data.app) {
    let appInfo = response.data.app;
    jobGenericDetail.jobStatus.queuePercentageUseage = appInfo.queueUsagePercentage;
    jobGenericDetail.jobStatus.allocatedMB = appInfo.allocatedMB;
    jobGenericDetail.jobStatus.utilizedMB = appInfo.utilizationVmemMB < 0 ? 0 : appInfo.utilizationVmemMB;
    jobGenericDetail.jobStatus.reservcedMB = appInfo.reservedMB < 0 ? 0 : appInfo.reservedMB;
    jobGenericDetail.jobStatus.allocatedVCores = appInfo.allocatedVCores;
    jobGenericDetail.jobStatus.utilizedVCores = appInfo.utilizationVcores < 0 ? 0 : appInfo.utilizationVcores;
    jobGenericDetail.jobStatus.reservcedVCores = appInfo.reservedVCores < 0 ? 0 : appInfo.reservedVCores;
    jobGenericDetail.jobStatus.priority = appInfo.priority;
    jobGenericDetail.jobStatus.reservedContainers = appInfo.reservedContainers;
    jobGenericDetail.jobStatus.runningContianers = appInfo.runningContainers < 0 ? 0 : appInfo.runningContainers;
    jobGenericDetail.jobStatus.resourceRequests = appInfo.resourceRequests;
    jobGenericDetail.jobStatus.preemptedResourceMB = appInfo.preemptedResourceMB;
    jobGenericDetail.jobStatus.preemptedResourceVCores = appInfo.preemptedResourceVCores;
    jobGenericDetail.jobStatus.numNonAMContainerPreempted = appInfo.numNonAMContainerPreempted;
    jobGenericDetail.jobStatus.numAMContainerPreempted = appInfo.numAMContainerPreempted;
    jobGenericDetail.jobStatus.preemptedMemorySeconds = appInfo.preemptedMemorySeconds;
    jobGenericDetail.jobStatus.preemptedVcoreSeconds = appInfo.preemptedVcoreSeconds;
    jobGenericDetail.jobStatus.utilizedVmemorySeconds = appInfo.utilizedVmemorySeconds;
    jobGenericDetail.jobStatus.utilizedPmemorySeconds = appInfo.utilizedPmemorySeconds;
    jobGenericDetail.jobStatus.utilizedVcoreSeconds = appInfo.utilizedVcoreSeconds;
    jobGenericDetail.jobStatus.amContainerLogs = appInfo.amContainerLogs;
    jobGenericDetail.jobStatus.containerAnalysis = appInfo.applicationContainerAnalysis? appInfo.applicationContainerAnalysis: {};

    if (appInfo.resourceRequests!= undefined && appInfo.resourceRequests) {
      let pendingContainers = 0;
      for (let j = 0, len = appInfo.resourceRequests.length; j < len; j++) {
        pendingContainers += appInfo.resourceRequests[j].numContainers;
      }
      jobGenericDetail.jobStatus.pendingContaines = pendingContainers;
    }
  }

  // Add subcluster info
  let subClusterInfo = subClusterUtil.getCurrentSubClusterInfo();
  jobGenericDetail.jobStatus.webportalLink = `${config.webportalUri}/job-detail.html?jobName=${jobInfo.name}&subCluster=${subClusterInfo.subCluster}`;

  if (jobInfo.jobType === 'LAUNCHER' || jobInfo.jobType === 'JOBWRAPPER') {
    let currentAttemptId = jobInfo.retryDetails.user + jobInfo.retryDetails.platform + jobInfo.retryDetails.resource + 1;
    jobGenericDetail.jobStatus.latestAttemptId = currentAttemptId;
    jobGenericDetail.jobStatus.jobFullDetailUrl = `${apiGateways.RestServer}/api/v2/jobs/${jobInfo.name}?subCluster=${subClusterInfo.subCluster}`;
  } else if (jobInfo.jobType === 'SPARK' || jobInfo.jobType === 'LIVY-SESSION' || jobInfo.jobType === 'LIVY-BATCH') {
    if (jobInfo.attemptInfo) {
      jobGenericDetail.jobStatus.latestAttemptId = parseInt(jobInfo.attemptInfo[0].attemptId) || 1;
      jobGenericDetail.jobStatus.retries = jobGenericDetail.jobStatus.latestAttemptId - 1;
      jobGenericDetail.jobStatus.jobFullDetailUrl = `spark-detail.html?appId=${jobInfo.appId}&attemptId=${jobGenericDetail.jobStatus.latestAttemptId}`; // Here is a web url.
    } else {
      let attemptRepsonse;
      try {
        attemptRepsonse = await axios({
          method: 'get',
          url: yarnConfig.yarnAppAttemptPath(jobInfo.appId),
          timeout: 30000,
        });
      } catch (error) {
        if (error.response != null) {
          attemptRepsonse = error.response;
        } else {
          throw error;
        }
      }
      if (attemptRepsonse.status === status('OK')) {
        if (attemptRepsonse.data.appAttempts.appAttempt) {
          let attemptInfo = attemptRepsonse.data.appAttempts.appAttempt;
          jobGenericDetail.jobStatus.retries = attemptInfo[attemptInfo.length - 1].id - 1;
          jobGenericDetail.jobStatus.latestAttemptId = attemptInfo[attemptInfo.length - 1].id;
          jobGenericDetail.jobStatus.jobFullDetailUrl = `spark-detail.html?appId=${jobInfo.appId}&attemptId=${jobGenericDetail.jobStatus.latestAttemptId}`;
        }
      } else {
        throw createError(response.status, 'UnknownError', `Failed to get job ${jobInfo.name} attemptId from RM: ${attemptRepsonse.data.message}`);
      }
    }
  }

  return jobGenericDetail;
};

// module exports
module.exports = {
  listMergedJobs,
  getGenericInfoByName,
  getGenericInfoByAppId,
  getResourceRequestsByAppId,
  getAppsCount,
  executeJobByJobName,
  executeJobByAppId,
  getQueueAcl,
  getJobsByGroupId,
  getFrameworkAttemptInfo,
};
