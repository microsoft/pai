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
const job = require('./k8s');
const { encodeName } = require('@pai/models/v2/utils/name');

const LOG_MANAGER_PORT = process.env.LOG_MANAGER_PORT;

const constrcutLogManagerPrefix = (nodeIp) => {
  return `${nodeIp}:${LOG_MANAGER_PORT}/api/v1`;
};

const loginLogManager = async (nodeIp, username, password) => {
  const prefix = constrcutLogManagerPrefix(nodeIp);
  try {
    const data = await axios.post(`${prefix}/token`, {
      username: username,
      password: password,
    });
    return data;
  } catch (err) {
    logger.error(`Failed to get log manager token, error: ${err}`);
    throw err;
  }
};

const getLogListFromLogManager = async (frameworkName, podUid) => {
  const username = process.env.LOG_MANAGER_ADMIN_NAME;
  const password = process.env.LOG_MANAGER_ADMIN_NAME;

  const jobDetail = await job.get(frameworkName);
  for (const [key, taskRole] in Object.entries(jobDetail.taskRoles)) {
    taskRole.taskStatuses.find(
      (status) => status.containerId === podUid,
    );
  }

  // get job details here. The information such as nodeId, podUid...
  const res = await loginLogManager(nodeIp, username, password);
  const token = res.token;

  const prefix = constrcutLogManagerPrefix(nodeIp);
  try {
    const logList = await axios.get(`${prefix}/logs`, {
      params: {
        token: token,
        username: username,
        framework_name: encodeName(frameworkName),
        taskrole: taskrole,
        pod_uid: podUid,
      },
    });

    const ret = {};
    const urlPrefix = `log-manager/${nodeIp}/${LOG_MANAGER_PORT}`;
    for (const key in logList) {
      ret[key] = `${urlPrefix}/${logList[key]}`;
    }

    return ret;
  } catch (err) {
    logger.error(`Failed to get log list error : ${err}`);
  }
};

module.exports = {
  getLogListFromLogManager,
};
