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
const job = require('./k8s');
const logger = require('@pai/config/logger');
const createError = require('@pai/utils/error');
const { encodeName } = require('@pai/models/v2/utils/name');

const LOG_MANAGER_PORT = process.env.LOG_MANAGER_PORT;

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

const getLogListFromLogManager = async (frameworkName, podUid) => {
  const adminName = process.env.LOG_MANAGER_ADMIN_NAME;
  const adminPassword = process.env.LOG_MANAGER_ADMIN_PASSWORD;

  const jobDetail = await job.get(frameworkName);
  let nodeIp;
  let taskRoleName;
  for (const [key, taskRole] of Object.entries(jobDetail.taskRoles)) {
    const status = taskRole.taskStatuses.find(
      (status) => status.containerId === podUid,
    );
    if (!status) {
      logger.error(`Failed to find pod which has pod uid ${podUid}`);
      throw createError(
        'Not Found',
        'UnknownError',
        `Log for pod ${podUid} is not found.`,
      );
    }
    nodeIp = status.containerIp;
    taskRoleName = key;
  }

  let res = await loginLogManager(nodeIp, adminName, adminPassword);
  const token = res.data.token;

  const prefix = constrcutLogManagerPrefix(nodeIp);
  try {
    res = await axios.get(`${prefix}/logs`, {
      params: {
        token: token,
        username: jobDetail.jobStatus.username,
        framework_name: encodeName(frameworkName),
        taskrole: taskRoleName,
        pod_uid: podUid,
      },
    });
  } catch (err) {
    if (err.response && err.response.status === 404) {
      throw createError('Not Found', 'UnknownError', `Log fodler not exisits.`);
    }
    throw err;
  }
  const logList = res.data;

  const ret = {};
  const urlPrefix = `/log-manager/${nodeIp}:${LOG_MANAGER_PORT}`;
  for (const key in logList) {
    ret[key] = `${urlPrefix}${logList[key]}`;
  }

  return ret;
};

module.exports = {
  getLogListFromLogManager,
};
