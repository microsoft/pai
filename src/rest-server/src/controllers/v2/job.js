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
const asyncHandler = require('@pai/middlewares/v2/asyncHandler');
const job = require('@pai/models/v2/job');
const createError = require('@pai/utils/error');
const logger = require('@pai/config/logger');


const list = asyncHandler(async (req, res) => {
  const data = await job.list();
  res.json(data);
});

const get = asyncHandler(async (req, res) => {
  const data = await job.get(req.params.frameworkName);
  res.json(data);
});

const update = asyncHandler(async (req, res) => {
  const jobName = res.locals.protocol.name;
  const userName = req.user.username;
  const frameworkName = `${userName}~${jobName}`;
  // check duplicate job
  try {
    const data = await job.get(frameworkName);
    if (data != null) {
      throw createError('Conflict', 'ConflictJobError', `Job ${frameworkName} already exists.`);
    }
  } catch (error) {
    if (error.code !== 'NoJobError') {
      throw error;
    }
  }
  await job.put(frameworkName, res.locals.protocol, req.body);
  res.status(status('Accepted')).json({
    status: status('Accepted'),
    message: `Update job ${jobName} for user ${userName} successfully.`,
  });
});

const execute = asyncHandler(async (req, res) => {
  const userName = req.user.username;
  const admin = req.user.admin;
  const data = await job.get(req.params.frameworkName);
  if ((data.jobStatus.username === userName) || admin) {
    await job.execute(req.params.frameworkName, req.body.value);
    res.status(status('Accepted')).json({
      status: status('Accepted'),
      message: `Execute job ${req.params.frameworkName} successfully.`,
    });
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      `User ${userName} is not allowed to execute job ${req.params.frameworkName}.`
    );
  }
});

const getConfig = asyncHandler(async (req, res) => {
  try {
    const data = await job.getConfig(req.params.frameworkName);
    return res.status(200).type('text/yaml').send(data);
  } catch (error) {
    if (error.message.startsWith('[WebHDFS] 404')) {
      throw createError('Not Found', 'NoJobConfigError', `Config of job ${req.params.frameworkName} is not found.`);
    } else {
      throw createError.unknown(error);
    }
  }
});

const getSshInfo = asyncHandler(async (req, res) => {
  const data = await job.getSshInfo(req.params.frameworkName);
  res.json(data);
});

const getAttempt = asyncHandler(async (req, res) => {
  let version = 1;
  if (req.query.hasOwnProperty('version')) {
    version = Number(req.query['version']);
  }

  const data = await job.getFrameworkAttemptInfo(req.params.frameworkName, version, Number(req.params.frameworkAttemptId));
  res.json(data);
});

const getAttempts = asyncHandler(async (req, res) => {
  const data = await job.getAttempts(req.params.frameworkName, Number(req.query.version));
  res.json(data);
});

const getVersions = asyncHandler(async (req, res) => {
  const data = await job.getVersions(req.params.frameworkName);
  res.json(data);
});

const listMergedJobs = asyncHandler(async (req, res) => {
  const data = await job.listMergedJobs(req.query);
  res.json(data);
});

const getGenericInfoByName = asyncHandler(async (req, res) => {
  const data = await job.getGenericInfoByName(req.params.jobName);
  res.json(data);
});

const getGenericInfoByAppId = asyncHandler(async (req, res) => {
  const data = await job.getGenericInfoByAppId(req.params.appId);
  res.json(data);
});

const dumpContainerLogByAppId = asyncHandler(async (req, res) => {
  let dumpParam = {
    appId: req.params.appId,
    executorId: 'driver',
    attemptId: undefined,
    logFile: 'stdout',
    start: -4096,
    end: undefined,
    jobStatus: undefined,
    userName: req.user.username,
    logType: 'spark',
  };

  if (req.query.hasOwnProperty('jobStatus')) {
    dumpParam.jobStatus = req.query['jobStatus'];
  }

  if (req.query.hasOwnProperty('executorId')) {
    dumpParam.executorId = req.query['executorId'];
  }

  if (req.query.hasOwnProperty('attemptId')) {
    dumpParam.attemptId = req.query['attemptId'];
  }

  if (req.query.hasOwnProperty('logFile')) {
    dumpParam.logFile = req.query['logFile'];
  }

  if (req.query.hasOwnProperty('logType')) {
    dumpParam.logType = req.query['logType'];
  }

  if (req.query.hasOwnProperty('start')) {
    if (!isNaN(req.query['start'])) {
      dumpParam.start = req.query['start'];
    }
  }

  if (req.query.hasOwnProperty('end')) {
    if (!isNaN(req.query['end'])) {
      dumpParam.end = req.query['end'];
    }
  }

  const data = await job.dumpContainerLogByAppId(dumpParam);
  res.json(data);
});


const dumpContainerLogByName = asyncHandler(async (req, res) => {
  let dumpParam = {
    appId: undefined,
    executorId: 'driver',
    attemptId: undefined,
    jobStatus: undefined,
    containerLogUrl: undefined,
    jobType: 'Launcher',
    jobName: req.params.jobName,
    taskRoleName: undefined,
    taskIndex: 'driver',
    logFile: 'stdout',
    start: -4096,
    end: undefined,
    isFileList: undefined,
    userName: req.user.username,
  };

  if (req.query.hasOwnProperty('executorId')) {
    dumpParam.executorId = req.query['executorId'];
  }

  if (req.query.hasOwnProperty('attemptId')) {
    dumpParam.attemptId = req.query['attemptId'];
  }

  if (req.query.hasOwnProperty('jobType')) {
    dumpParam.jobType = req.query['jobType'];
  }

  if (req.query.hasOwnProperty('jobStatus')) {
    dumpParam.jobType = req.query['jobStatus'];
  }

  if (req.query.hasOwnProperty('taskRoleName')) {
    dumpParam.taskRoleName = req.query['taskRoleName'];
  }

  if (req.query.hasOwnProperty('taskIndex')) {
    dumpParam.taskIndex = req.query['taskIndex'];
  }

  if (req.query.hasOwnProperty('containerLogUrl')) {
    dumpParam.containerLogUrl = req.query['containerLogUrl'];
  }

  if (req.query.hasOwnProperty('logFile')) {
    dumpParam.logFile = req.query['logFile'];
  }

  if (req.query.hasOwnProperty('start')) {
    if (!isNaN(req.query['start'])) {
      dumpParam.start = req.query['start'];
    }
  }

  if (req.query.hasOwnProperty('end')) {
    if (!isNaN(req.query['end'])) {
      dumpParam.end = req.query['end'];
    }
  }

  const data = await job.dumpContainerLogByName(dumpParam);
  res.json(data);
});


const getResourceRequestsByAppId = asyncHandler(async (req, res) => {
  const data = await job.getResourceRequestsByAppId(req.params.appId);
  res.json(data);
});

const getAppsCount = asyncHandler(async (req, res) => {
  const data = await job.getAppsCount(req);
  res.json(data);
});

const executeJobByJobName = asyncHandler(async (req, res) => {
  const userName = req.user.username;
  const admin = req.user.admin;
  const data = await job.getGenericInfoByName(req.params.jobName);
  const allowedStop = await checkStopAllowed(data, admin, userName);

  if (allowedStop) {
    await job.executeJobByJobName(req.params.jobName, req.body.value, userName);
    res.status(status('Accepted')).json({
      status: status('Accepted'),
      message: `Execute job(${req.body.value}) ${req.params.jobName} accepted, will stop the job shortly.`,
    });
    logger.info(`[Execute Job By Type] ${userName} ${req.body.value} ${req.params.jobName} accepted.`);
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      `User ${userName} is not allowed to execute job ${req.params.frameworkName}.`
    );
  }
});

const executeAppByType = asyncHandler(async (req, res) => {
  const userName = req.user.username;
  const admin = req.user.admin;
  const data = await job.getGenericInfoByAppId(req.params.appId);
  const allowedStop = await checkStopAllowed(data, admin, userName);

  if (allowedStop) {
    await job.executeJobByAppId(req.params.appId, req.body.value, userName);
    res.status(status('Accepted')).json({
      status: status('Accepted'),
      message: `Execute application(${req.body.value}) ${req.params.appId} accepted, will stop the job shortly.`,
    });
    logger.info(`[Execute Job] ${userName} ${req.body.value} ${req.params.appId} accepted.`);
  } else {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      `User ${userName} is not allowed to execute application ${req.params.appId}.`
    );
  }
});

const checkStopAllowed = async (data, admin, userName) => {
  let queueAclInfoRes = await job.getQueueAcl(data.jobStatus.virtualCluster, userName, 'ADMINISTER_QUEUE');
  let allowedStop = true;
  logger.info(JSON.stringify(queueAclInfoRes));
  if ((data.jobStatus.username !== userName) && !admin) {
    allowedStop = false;
    if (queueAclInfoRes.allowed && queueAclInfoRes.allowed === 'true') {
      allowedStop = true;
    }
  }
  return allowedStop;
};

const heapDumpContainerByAppId = asyncHandler(async (req, res) => {
  let heapdumpParam = {
    appId: req.params.appId,
    executorId: 'driver',
    attemptId: undefined,
    userName: req.user.username,
    isLive: 'true',
  };

  if (req.query.hasOwnProperty('executorId')) {
    heapdumpParam.executorId = req.query['executorId'];
  }

  if (req.query.hasOwnProperty('isLive')) {
    heapdumpParam.isLive = req.query['isLive'];
  }

  if (req.query.hasOwnProperty('attemptId')) {
    heapdumpParam.attemptId = req.query['attemptId'];
  }

  const data = await job.heapDumpContainerByAppId(heapdumpParam);
  res.json(data);
});

const heapDumpContainerByJobName = asyncHandler(async (req, res) => {
  let heapdumpParam = {
    attemptId: undefined,
    jobType: 'Launcher',
    jobName: req.params.jobName,
    taskRoleName: undefined,
    taskIndex: 'driver',
    userName: req.user.username,
    isLive: 'true',
  };

  if (req.query.hasOwnProperty('attemptId')) {
    heapdumpParam.attemptId = req.query['attemptId'];
  }

  if (req.query.hasOwnProperty('jobType')) {
    heapdumpParam.jobType = req.query['jobType'];
  }

  if (req.query.hasOwnProperty('taskRoleName')) {
    heapdumpParam.taskRoleName = req.query['taskRoleName'];
  }

  if (req.query.hasOwnProperty('taskIndex')) {
    heapdumpParam.taskIndex = req.query['taskIndex'];
  }

  if (req.query.hasOwnProperty('isLive')) {
    heapdumpParam.isLive = req.query['isLive'];
  }

  const data = await job.heapDumpContainerByJobName(heapdumpParam);
  res.json(data);
});

const threadDumpContainerByAppId = asyncHandler(async (req, res) => {
  let threaddumpParam = {
    appId: req.params.appId,
    attemptId: undefined,
    executorId: 'driver',
    userName: req.user.username,
  };

  if (req.query.hasOwnProperty('executorId')) {
    threaddumpParam.executorId = req.query['executorId'];
  }

  if (req.query.hasOwnProperty('attemptId')) {
    threaddumpParam.attemptId = req.query['attemptId'];
  }

  const data = await job.threadDumpContainerByAppId(threaddumpParam);
  res.json(data);
});

const threadDumpContainerByJobName = asyncHandler(async (req, res) => {
  let threaddumpParam = {
    attemptId: undefined,
    jobType: 'Launcher',
    jobName: req.params.jobName,
    taskRoleName: undefined,
    taskIndex: 'driver',
    userName: req.user.username,
  };

  if (req.query.hasOwnProperty('attemptId')) {
    threaddumpParam.attemptId = req.query['attemptId'];
  }

  if (req.query.hasOwnProperty('jobType')) {
    threaddumpParam.jobType = req.query['jobType'];
  }

  if (req.query.hasOwnProperty('taskRoleName')) {
    threaddumpParam.taskRoleName = req.query['taskRoleName'];
  }

  if (req.query.hasOwnProperty('taskIndex')) {
    threaddumpParam.taskIndex = req.query['taskIndex'];
  }

  const data = await job.threadDumpContainerByJobName(threaddumpParam);
  res.json(data);
});

const processTreeDumpContainerByAppId = asyncHandler(async (req, res) => {
  let pTreeDumpParam = {
    appId: req.params.appId,
    attemptId: undefined,
    executorId: 'driver',
    userName: req.user.username,
    isAllContainers: 'false',
  };

  if (req.query.hasOwnProperty('executorId')) {
    pTreeDumpParam.executorId = req.query['executorId'];
  }

  if (req.query.hasOwnProperty('isAllContainers')) {
    pTreeDumpParam.isAllContainers = req.query['isAllContainers'];
  }

  if (req.query.hasOwnProperty('attemptId')) {
    pTreeDumpParam.attemptId = req.query['attemptId'];
  }

  const data = await job.processTreeDumpContainerByAppId(pTreeDumpParam);
  res.json(data);
});

const processTreeDumpContainerByJobName = asyncHandler(async (req, res) => {
  let pTreeDumpParam = {
    attemptId: undefined,
    jobType: 'Launcher',
    jobName: req.params.jobName,
    taskRoleName: undefined,
    taskIndex: 'driver',
    userName: req.user.username,
    isAllContainers: 'false',
  };

  if (req.query.hasOwnProperty('attemptId')) {
    pTreeDumpParam.attemptId = req.query['attemptId'];
  }

  if (req.query.hasOwnProperty('jobType')) {
    pTreeDumpParam.jobType = req.query['jobType'];
  }

  if (req.query.hasOwnProperty('taskRoleName')) {
    pTreeDumpParam.taskRoleName = req.query['taskRoleName'];
  }

  if (req.query.hasOwnProperty('taskIndex')) {
    pTreeDumpParam.taskIndex = req.query['taskIndex'];
  }

  if (req.query.hasOwnProperty('isAllContainers')) {
    pTreeDumpParam.isAllContainers = req.query['isAllContainers'];
  }
  const data = await job.processTreeDumpContainerByJobName(pTreeDumpParam);
  res.json(data);
});

const getContainerDumpFileUrlByJobName = asyncHandler(async (req, res) => {
  let dumpParam = {
    appId: undefined,
    executorId: 'driver',
    attemptId: undefined,
    jobStatus: undefined,
    jobType: 'Launcher',
    jobName: req.params.jobName,
    taskRoleName: undefined,
    taskIndex: 'driver',
    logFile: 'stdout',
    userName: req.user.username,
    containerLogUrl: undefined,
  };

  if (req.query.hasOwnProperty('executorId')) {
    dumpParam.executorId = req.query['executorId'];
  }

  if (req.query.hasOwnProperty('attemptId')) {
    dumpParam.attemptId = req.query['attemptId'];
  }

  if (req.query.hasOwnProperty('jobType')) {
    dumpParam.jobType = req.query['jobType'];
  }

  if (req.query.hasOwnProperty('jobStatus')) {
    dumpParam.jobType = req.query['jobStatus'];
  }

  if (req.query.hasOwnProperty('taskRoleName')) {
    dumpParam.taskRoleName = req.query['taskRoleName'];
  }

  if (req.query.hasOwnProperty('taskIndex')) {
    dumpParam.taskIndex = req.query['taskIndex'];
  }

  if (req.query.hasOwnProperty('logFile')) {
    dumpParam.logFile = req.query['logFile'];
  }

  if (req.query.hasOwnProperty('containerLogUrl')) {
    dumpParam.containerLogUrl = req.query['containerLogUrl'];
  }

  const data = await job.getContainerDumpFileUrlByJobName(dumpParam);
  res.json(data);
});

const getContainerDumpFileUrlByAppId = asyncHandler(async (req, res) => {
  let dumpParam = {
    appId: req.params.appId,
    executorId: 'driver',
    attemptId: undefined,
    logFile: 'stdout',
    jobStatus: undefined,
    userName: req.user.username,
    logType: 'spark',
  };

  if (req.query.hasOwnProperty('jobStatus')) {
    dumpParam.jobStatus = req.query['jobStatus'];
  }

  if (req.query.hasOwnProperty('executorId')) {
    dumpParam.executorId = req.query['executorId'];
  }

  if (req.query.hasOwnProperty('attemptId')) {
    dumpParam.attemptId = req.query['attemptId'];
  }

  if (req.query.hasOwnProperty('logFile')) {
    dumpParam.logFile = req.query['logFile'];
  }

  if (req.query.hasOwnProperty('logType')) {
    dumpParam.logType = req.query['logType'];
  }

  const data = await job.getContainerDumpFileUrlByAppId(dumpParam);
  res.json(data);
});

// module exports
module.exports = {
  list,
  get,
  update,
  execute,
  getConfig,
  getSshInfo,
  listMergedJobs,
  getGenericInfoByName,
  getGenericInfoByAppId,
  getResourceRequestsByAppId,
  getAppsCount,
  executeJobByJobName,
  executeAppByType,
  dumpContainerLogByAppId,
  dumpContainerLogByName,
  getAttempt,
  getAttempts,
  getVersions,
  heapDumpContainerByJobName,
  heapDumpContainerByAppId,
  threadDumpContainerByJobName,
  threadDumpContainerByAppId,
  processTreeDumpContainerByJobName,
  processTreeDumpContainerByAppId,
  getContainerDumpFileUrlByJobName,
  getContainerDumpFileUrlByAppId,

};
