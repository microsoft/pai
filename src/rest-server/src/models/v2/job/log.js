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

const axios = require('axios');
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  ContainerSASPermissions,
  generateBlobSASQueryParameters,
  SASProtocol,
} = require('@azure/storage-blob');
const launcherConfig = require('@pai/config/launcher');
const logger = require('@pai/config/logger');
const task = require('@pai/models/v2/task');
const createError = require('@pai/utils/error');
const { encodeName } = require('@pai/models/v2/utils/name');

const logServer = launcherConfig.logServer;

const constrcutLogManagerPrefix = (nodeIp) => {
  return `http://${nodeIp}:${launcherConfig.logManagerPort}/api/v1`;
};

const NoTaskLogErr = createError(
  'Not Found',
  'NoTaskLogError',
  `Log of task is not found.`,
);

const loginLogManager = async (nodeIp, username, password) => {
  const prefix = constrcutLogManagerPrefix(nodeIp);
  return axios.post(`${prefix}/tokens`, {
    username: username,
    password: password,
  });
};

const getLogListFromLogManager = async (
  frameworkName,
  jobAttemptId,
  taskRoleName,
  taskIndex,
  taskAttemptId,
  tailMode,
) => {
  const adminName = launcherConfig.logManagerAdminName;
  const adminPassword = launcherConfig.logManagerAdminPassword;;

  const taskDetail = await task.get(
    frameworkName,
    Number(jobAttemptId),
    taskRoleName,
    Number(taskIndex),
  );
  const taskStatus = taskDetail.data.attempts.find(
    (attempt) => attempt.attemptId === Number(taskAttemptId),
  );
  if (!taskStatus || !taskStatus.containerIp) {
    logger.error(`Failed to find task to retrive log or task not started`);
    throw NoTaskLogErr;
  }

  const nodeIp = taskStatus.containerIp;
  const podUid = taskStatus.containerId;

  let res = await loginLogManager(nodeIp, adminName, adminPassword);
  const token = res.data.token;

  const prefix = constrcutLogManagerPrefix(nodeIp);
  try {
    const params = {
      token: token,
      username: taskDetail.data.username,
      taskrole: taskRoleName,
    };
    params['framework-name'] = encodeName(frameworkName);
    params['pod-uid'] = podUid;
    res = await axios.get(`${prefix}/logs`, {
      params: params,
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      throw NoTaskLogErr;
    }
    throw err;
  }
  const logList = res.data;

  const ret = { locations: [] };
  const urlPrefix = `/log-manager/${nodeIp}:${launcherConfig.logManagerPort}`;
  const urlSuffix = tailMode === 'true' ? '&tail-mode=true' : '';
  for (const key in logList) {
    ret.locations.push({
      name: key,
      uri: `${urlPrefix}${logList[key]}${urlSuffix}`,
    });
  }

  return ret;
};

const getLogListFromAzureStorage = async (
  frameworkName,
  jobAttemptId,
  taskRoleName,
  taskIndex,
  taskAttemptId,
  tailMode,
) => {
  const taskDetail = await task.get(
    frameworkName,
    Number(jobAttemptId),
    taskRoleName,
    Number(taskIndex),
  );
  const taskStatus = taskDetail.data.attempts.find(
    (attempt) => attempt.attemptId === Number(taskAttemptId),
  );
  if (!taskStatus || !taskStatus.containerIp) {
    logger.error(`Failed to find task to retrive log or task not started`);
    throw NoTaskLogErr;
  }

  const podUid = taskStatus.containerId;

  const account = launcherConfig.logAzureStorageAccount;
  const accountKey = launcherConfig.logAzureStorageAccountKey;
  const logContainerName = launcherConfig.logAzureStorageContainerName;
  const sharedKeyCredential = new StorageSharedKeyCredential(
    account,
    accountKey,
  );
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential,
  );
  const containerClient = blobServiceClient.getContainerClient(
    logContainerName,
  );
  const ret = { locations: [] };

  const sasQueryString = generateBlobSASQueryParameters(
    {
      containerName: logContainerName,
      permissions: ContainerSASPermissions.parse('r'),
      startsOn: new Date(new Date().valueOf() - 1000 * 60 * 10),
      expiresOn: new Date(new Date().valueOf() + 1000 * 60 * 10), // 10min
      protocol: SASProtocol.Https,
    },
    sharedKeyCredential,
  );

  ret.locations = ret.locations.concat(
    await getJobLogEntriesFromAzure(
      containerClient,
      podUid,
      sasQueryString,
      tailMode,
    ),
  );

  const runtimeLogList = [];
  for await (const blob of containerClient.listBlobsFlat({
    prefix: `runtime-app-${podUid}`,
  })) {
    runtimeLogList.push(blob.name);
  }

  ret.locations = ret.locations.concat(
    parseAzureLogEntries(
      runtimeLogList,
      `runtime`,
      containerClient.url,
      sasQueryString,
      tailMode,
    ),
  );
  return ret;
};

const getJobLogEntriesFromAzure = async (
  containerClient,
  podUid,
  sasQueryString,
  tailMode,
) => {
  const jobLogList = [];
  let logEntries = [];
  for await (const blob of containerClient.listBlobsFlat({
    prefix: `job-${podUid}`,
  })) {
    jobLogList.push(blob.name);
  }

  logEntries = logEntries.concat(
    parseAzureLogEntries(
      jobLogList.filter((log) => log.startsWith(`job-${podUid}.stdout`)),
      'stdout',
      containerClient.url,
      sasQueryString,
      tailMode,
    ),
  );

  logEntries = logEntries.concat(
    parseAzureLogEntries(
      jobLogList.filter((log) => log.startsWith(`job-${podUid}.stderr`)),
      'stderr',
      containerClient.url,
      sasQueryString,
      tailMode,
    ),
  );

  logEntries = logEntries.concat(
    parseAzureLogEntries(
      jobLogList.filter((log) => log.startsWith(`job-${podUid}.all`)),
      'all',
      containerClient.url,
      sasQueryString,
      tailMode,
    ),
  );

  return logEntries;
};

// The job log name format is job-{PodUid}.stdout/stderr/all.{index}.log
// For runtime log, the log name format is runtime-app-{PodUid}.log
const parseAzureLogEntries = (
  logList,
  logType,
  azureStorageUrl,
  sasQueryString,
  tailMode,
) => {
  const locations = [];
  const pattern =
    logType === 'runtime'
      ? `\\.(?<index>\\d)\\.log`
      : `(${logType})\\.(?<index>\\d)\\.log`;
  const re = new RegExp(pattern);
  for (const logName of logList) {
    const matches = logName.match(re);
    if (matches && matches.groups.index) {
      const logIndex = logList.length - Number(matches.groups.index) - 1;
      locations.push({
        name: logIndex === 0 ? logType : `${logType}.${logIndex}`,
        uri:
          tailMode === 'true'
            ? `/rest-server/api/internal/tail-logs/${logName}?${sasQueryString}`
            : `${azureStorageUrl}/${logName}?${sasQueryString}`,
      });
    }
  }
  return locations;
};

const getLogListFromLogServer = async (
  frameworkName,
  jobAttemptId,
  taskRoleName,
  taskIndex,
  taskAttemptId,
  tailMode,
) => {
  if (logServer.toLowerCase() === 'log_manager') {
    return await getLogListFromLogManager(
      frameworkName,
      jobAttemptId,
      taskRoleName,
      taskIndex,
      taskAttemptId,
      tailMode,
    );
  }
  if (logServer.toLocaleLowerCase() === 'azure_storage') {
    return await getLogListFromAzureStorage(
      frameworkName,
      jobAttemptId,
      taskRoleName,
      taskIndex,
      taskAttemptId,
      tailMode,
    );
  }

  logger.error(`Log server ${logServer} is not supported.`);
  throw createError(
    'Internal Server Error',
    'NoSupportedLogServer',
    `Log server ${logServer} is not supported.`,
  );
};

module.exports = {
  getLogListFromLogServer,
};
