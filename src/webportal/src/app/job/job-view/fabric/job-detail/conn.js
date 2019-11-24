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

import yaml from 'js-yaml';
import { isNil } from 'lodash';

import { clearToken } from '../../../../user/user-logout/user-logout.component';
import { checkToken } from '../../../../user/user-auth/user-auth.component';
import config from '../../../../config/webportal.config';

const params = new URLSearchParams(window.location.search);
const userName = params.get('username');
const jobName = params.get('jobName');
const absoluteUrlRegExp = /^[a-z][a-z\d+.-]*:/;

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

export async function checkAttemptAPI() {
  const healthEndpoint = `${config.restServerUri}/api/v2/jobs/${userName}~${jobName}/job-attempts/healthz`;
  const healthRes = await fetch(healthEndpoint);
  if (healthRes.status !== 200) {
    return false;
  } else {
    return true;
  }
}

export async function fetchJobRetries() {
  if (!(await checkAttemptAPI())) {
    return {
      isSucceeded: false,
      errorMessage: 'Attempts API is not working!',
      jobRetries: null,
    };
  }

  const listAttemptsUrl = `${config.restServerUri}/api/v1/jobs/${userName}~${jobName}/job-attempts`;
  const listRes = await fetch(listAttemptsUrl);
  if (listRes.status === 404) {
    return {
      isSucceeded: false,
      errorMessage: 'Could not find any attempts of this job!',
      jobRetries: null,
    };
  } else if (listRes.status === 200) {
    const jobAttempts = await listRes.json();
    return {
      isSucceeded: true,
      errorMessage: null,
      jobRetries: jobAttempts.filter(attempt => !attempt.isLatest),
    };
  } else {
    return {
      isSucceeded: false,
      errorMessage: 'Some errors occured!',
      jobRetries: null,
    };
  }
}

export async function fetchJobInfo() {
  const url = userName
    ? `${config.restServerUri}/api/v1/jobs/${userName}~${jobName}`
    : `${config.restServerUri}/api/v1/jobs/${jobName}`;
  const res = await fetch(url);
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function fetchRawJobConfig() {
  const url = userName
    ? `${config.restServerUri}/api/v1/jobs/${userName}~${jobName}/config`
    : `${config.restServerUri}/api/v1/jobs/${jobName}/config`;
  const res = await fetch(url);
  const text = await res.text();
  const json = yaml.safeLoad(text);
  if (res.ok) {
    return json;
  } else {
    if (json.code === 'NoJobConfigError') {
      throw new NotFoundError(json.message);
    } else {
      throw new Error(json.message);
    }
  }
}

export async function fetchJobConfig() {
  const url = userName
    ? `${config.restServerUri}/api/v2/jobs/${userName}~${jobName}/config`
    : `${config.restServerUri}/api/v1/jobs/${jobName}/config`;
  const res = await fetch(url);
  const text = await res.text();
  const json = yaml.safeLoad(text);
  if (res.ok) {
    return json;
  } else {
    if (json.code === 'NoJobConfigError') {
      throw new NotFoundError(json.message);
    } else {
      throw new Error(json.message);
    }
  }
}

export async function fetchSshInfo() {
  const url = userName
    ? `${config.restServerUri}/api/v1/jobs/${userName}~${jobName}/ssh`
    : `${config.restServerUri}/api/v1/jobs/${jobName}/ssh`;
  const res = await fetch(url);
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    if (json.code === 'NoJobSshInfoError') {
      throw new NotFoundError(json.message);
    } else {
      throw new Error(json.message);
    }
  }
}

export function getTensorBoardUrl(jobInfo, rawJobConfig) {
  let port = null;
  let ip = null;
  if (rawJobConfig.extras && rawJobConfig.extras.tensorBoard) {
    const randomStr = rawJobConfig.extras.tensorBoard.randomStr;
    const tensorBoardPortStr = `tensorBoardPort_${randomStr}`;
    const taskRoles = jobInfo.taskRoles;
    Object.keys(taskRoles).forEach(taskRoleKey => {
      const taskStatuses = taskRoles[taskRoleKey].taskStatuses[0];
      if (
        taskStatuses.taskState === 'RUNNING' &&
        taskStatuses.containerPorts &&
        !isNil(taskStatuses.containerPorts[tensorBoardPortStr])
      ) {
        port = taskStatuses.containerPorts[tensorBoardPortStr];
        ip = taskStatuses.containerIp;
      }
    });
  }
  if (isNil(port) || isNil(ip)) {
    return null;
  }
  return `http://${ip}:${port}`;
}

export function getJobMetricsUrl(jobInfo) {
  const from = jobInfo.jobStatus.createdTime;
  let to = '';
  const { state } = jobInfo.jobStatus;
  if (state === 'RUNNING') {
    to = Date.now();
  } else {
    to = jobInfo.jobStatus.completedTime;
  }
  return `${config.grafanaUri}/dashboard/db/joblevelmetrics?var-job=${
    userName ? `${userName}~${jobName}` : jobName
  }&from=${from}&to=${to}`;
}

export async function stopJob() {
  const url = userName
    ? `${config.restServerUri}/api/v1/jobs/${userName}~${jobName}/executionType`
    : `${config.restServerUri}/api/v1/jobs/${jobName}/executionType`;
  const token = checkToken();
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: 'STOP',
    }),
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else if (res.code === 'UnauthorizedUserError') {
    alert(res.message);
    clearToken();
  } else {
    throw new Error(json.message);
  }
}

export async function getContainerLog(logUrl) {
  const ret = {
    fullLogLink: logUrl,
    text: null,
  };
  const res = await fetch(logUrl);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(res.statusText);
  }

  const contentType = res.headers.get('content-type');
  if (!contentType) {
    throw new Error(`Log not available`);
  }

  // Check log type. The log type is in LOG_TYPE and should be yarn|log-manager.
  if (config.logType === 'yarn') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      const content = doc.getElementsByClassName('content')[0];
      const pre = content.getElementsByTagName('pre')[0];
      ret.text = pre.innerText;
      // fetch full log link
      if (pre.previousElementSibling) {
        const link = pre.previousElementSibling.getElementsByTagName('a');
        if (link.length === 1) {
          ret.fullLogLink = link[0].getAttribute('href');
          // relative link
          if (ret.fullLogLink && !absoluteUrlRegExp.test(ret.fullLogLink)) {
            let baseUrl = res.url;
            // check base tag
            const baseTags = doc.getElementsByTagName('base');
            // There can be only one <base> element in a document.
            if (baseTags.length > 0 && baseTags[0].hasAttribute('href')) {
              baseUrl = baseTags[0].getAttribute('href');
              // relative base tag url
              if (!absoluteUrlRegExp.test(baseUrl)) {
                baseUrl = new URL(baseUrl, res.url);
              }
            }
            const url = new URL(ret.fullLogLink, baseUrl);
            ret.fullLogLink = url.href;
          }
        }
      }
      return ret;
    } catch (e) {
      throw new Error(`Log not available`);
    }
  } else if (config.logType === 'log-manager') {
    ret.text = text;
    ret.fullLogLink = logUrl.replace('/tail/', '/full/');
    return ret;
  } else {
    throw new Error(`Log not available`);
  }
}
