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
const logger = require('@pai/config/logger');
const task = require('@pai/models/v2/task');
const createError = require('@pai/utils/error');
const { encodeName } = require('@pai/models/v2/utils/name');

const LOG_MANAGER_PORT = process.env.LOG_MANAGER_PORT;
const WEBPORTAL_URL = process.env.WEBPORTAL_URL;

const constrcutLogManagerPrefix = (nodeIp) => {
  return `http://${nodeIp}:${LOG_MANAGER_PORT}/api/v1`;
};

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
  const adminName = process.env.LOG_MANAGER_ADMIN_NAME;
  const adminPassword = process.env.LOG_MANAGER_ADMIN_PASSWORD;

  const taskDetail = await task.get(
    frameworkName,
    Number(jobAttemptId),
    taskRoleName,
    Number(taskIndex),
  );
  const NoTaskLogErr = createError(
    'Not Found',
    'NoTaskLogError',
    `Log of task is not found.`,
  );
  const taskStatus = taskDetail.data.attempts[Number(taskAttemptId)];
  if (!taskStatus) {
    logger.error(`Failed to find task to retrive log`);
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
  const urlPrefix = `${WEBPORTAL_URL}/log-manager/${nodeIp}:${LOG_MANAGER_PORT}`;
  const urlSuffix = tailMode === 'true' ? '&tail-mode=true' : '';
  for (const key in logList) {
    ret.locations.push({
      name: key,
      uri: `${urlPrefix}${logList[key]}${urlSuffix}`,
    });
  }

  return ret;
};

module.exports = {
  getLogListFromLogManager,
};
