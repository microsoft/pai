// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PAIV2 } from '@microsoft/openpai-js-sdk';
import { isNil, get } from 'lodash';
import urljoin from 'url-join';

import { clearToken } from '../../../../user/user-logout/user-logout.component';
import { checkToken } from '../../../../user/user-auth/user-auth.component';
import config from '../../../../config/webportal.config';

const params = new URLSearchParams(window.location.search);
const userName = params.get('username');
const jobName = params.get('jobName');
const absoluteUrlRegExp = /^[a-z][a-z\d+.-]*:/;
const token = cookies.get('token');

const client = new PAIV2.OpenPAIClient({
  rest_server_uri: new URL(config.restServerUri, window.location.href),
  username: cookies.get('user'),
  token: token,
  https: window.location.protocol === 'https:',
});

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

const wrapper = async func => {
  try {
    return await func();
  } catch (err) {
    if (err.data.code === 'UnauthorizedUserError') {
      alert(err.data.message);
      clearToken();
    } else if (err.data.code === 'NoJobConfigError') {
      throw new NotFoundError(err.data.message);
    } else {
      throw new Error(err.data.message);
    }
  }
};

export async function fetchJobInfo(attemptIndex) {
  return wrapper(async () => {
    const restServerUri = new URL(config.restServerUri, window.location.href);
    const url = isNil(attemptIndex)
      ? urljoin(restServerUri.toString(), `/api/v2/jobs/${userName}~${jobName}`)
      : urljoin(
          restServerUri.toString(),
          `/api/v2/jobs/${userName}~${jobName}/attempts/${attemptIndex}`,
        );

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    return result;
  });
}

export async function fetchTaskStatus(attemptIndex, taskRoleName, taskIndex) {
  return wrapper(async () => {
    const restServerUri = new URL(config.restServerUri, window.location.href);
    const url = urljoin(
      restServerUri.toString(),
      `api/v2/jobs/${userName}~${jobName}/attempts/${attemptIndex}/taskRoles/${taskRoleName}/taskIndex/${taskIndex}/attempts`,
    );
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    return result;
  });
}

export async function fetchRawJobConfig() {
  return wrapper(() => client.job.getJobConfig(userName, jobName));
}

export async function fetchJobConfig() {
  return wrapper(() => client.job.getJobConfig(userName, jobName));
}

export async function fetchSshInfo() {
  const url = userName
    ? `${config.restServerUri}/api/v2/jobs/${userName}~${jobName}/ssh`
    : `${config.restServerUri}/api/v2/jobs/${jobName}/ssh`;
  const token = checkToken();
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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
  const tensorBoardPlugin = get(
    rawJobConfig,
    ['extras', 'com.microsoft.pai.runtimeplugin'],
    [],
  ).find(plugin => plugin.plugin === 'tensorboard');
  if (isNil(tensorBoardPlugin)) {
    return null;
  }

  const taskRoles = jobInfo.taskRoles;
  const firstTaskRoleName = Object.keys(taskRoles)[0];
  const taskStatuses = taskRoles[firstTaskRoleName].taskStatuses[0];
  if (taskStatuses.taskState === 'RUNNING') {
    port = get(tensorBoardPlugin, 'parameters.port');
    ip = taskStatuses.containerIp;
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
  return wrapper(() =>
    client.job.updateJobExecutionType(userName, jobName, 'STOP'),
  );
}

export async function getContainerLog(logUrl) {
  const ret = {
    fullLogLink: logUrl,
    text: null,
  };
  const res = await fetch(logUrl);
  var text = await res.text();
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
    // Try to get roated log if currently log content is less than 15KB
    if (text.length <= 15 * 1024) {
      const fullLogUrl = logUrl.replace('/tail/', '/full/');
      const rotatedLogUrl = logUrl + '.1';
      const rotatedLogRes = await fetch(rotatedLogUrl);
      const fullLogRes = await fetch(fullLogUrl);
      const rotatedText = await rotatedLogRes.text();
      const fullLog = await fullLogRes.text();
      if (rotatedLogRes.ok && rotatedText.trim() !== 'No such file!') {
        text = rotatedText
          .concat('\n--------log is rotated, may be lost during this--------\n')
          .concat(fullLog);
      }
      // get last 16KB
      text = text.slice(-16 * 1024);
    }
    ret.text = text;
    ret.fullLogLink = logUrl.replace('/tail/', '/full/');
    return ret;
  } else {
    throw new Error(`Log not available`);
  }
}
