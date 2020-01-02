import yaml from 'js-yaml';
import { isNil } from 'lodash';

const webportalConfig = require('../../../config/webportal.config');
const config = webportalConfig;
const absoluteUrlRegExp = /^[a-z][a-z\d+.-]*:/;

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

export async function createMarketItem(marketItem) {
  const url = `${config.restServerUri}/api/v2/marketplace/items`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: marketItem.name,
      author: marketItem.author,
      category: marketItem.category,
      introduction: marketItem.introduction,
      description: marketItem.description,
      jobConfig: marketItem.jobConfig,
      submits: marketItem.submits,
      starNumber: marketItem.stars,
      tags: marketItem.tags,
    }),
  });
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json);
  }
}

export async function fetchJobConfig(userName, jobName) {
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

export async function fetchJobInfo(userName, jobName) {
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

export async function fetchRawJobConfig(userName, jobName) {
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

export async function fetchSshInfo(userName, jobName) {
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

export async function checkAttemptAPI(userName, jobName) {
  const healthEndpoint = `${config.restServerUri}/api/v2/jobs/${userName}~${jobName}/job-attempts/healthz`;
  const healthRes = await fetch(healthEndpoint);
  if (healthRes.status !== 200) {
    return false;
  } else {
    return true;
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

export function getJobMetricsUrl(jobInfo, userName, jobName) {
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
