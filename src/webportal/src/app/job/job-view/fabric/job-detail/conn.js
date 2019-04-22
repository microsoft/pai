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
import {get, isNil} from 'lodash';
import qs from 'querystring';

import {checkToken} from '../../../../user/user-auth/user-auth.component';
import config from '../../../../config/webportal.config';

const params = new URLSearchParams(window.location.search);
const namespace = params.get('username');
const jobName = params.get('jobName');

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

export async function fetchJobInfo() {
  const url = namespace
    ? `${config.restServerUri}/api/v1/user/${namespace}/jobs/${jobName}`
    : `${config.restServerUri}/api/v1/jobs/${jobName}`;
  const res = await fetch(url);
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    throw new Error(json.message);
  }
}

export async function fetchJobConfig() {
  const url = namespace
    ? `${config.restServerUri}/api/v1/user/${namespace}/jobs/${jobName}/config`
    : `${config.restServerUri}/api/v1/jobs/${jobName}/config`;
  const res = await fetch(url);
  const text = await res.text();
  let json = yaml.safeLoad(text);
  if (typeof(json) == 'string') {
    // pai rest api sometimes returns a escaped string.
    // So we need parse it twice. (safeLoad will unescape the string if it is escaped)
    json = yaml.safeLoad(json);
  }
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
  const url = namespace
    ? `${config.restServerUri}/api/v1/user/${namespace}/jobs/${jobName}/ssh`
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

export function getJobMetricsUrl() {
  return `${config.grafanaUri}/dashboard/db/joblevelmetrics?var-job=${namespace ? `${namespace}~${jobName}`: jobName}`;
}

export function cloneJob(jobConfig) {
  const query = {
    op: 'resubmit',
    type: 'job',
    user: namespace,
    jobname: jobName,
  };

  // plugin
  const pluginId = get(jobConfig, 'extras.submitFrom');
  if (!isNil(pluginId)) {
    const plugins = window.PAI_PLUGINS;
    const pluginIndex = plugins.findIndex((x) => x.id === pluginId);
    if (pluginIndex === -1) {
      alert(`Clone job failed. The job was submitted by ${pluginId}, but it is not installed.`);
    }
    window.location.href = `/plugin.html?${qs.stringify({...query, index: pluginIndex})}`;
    return;
  }

  window.location.href = `/submit.html?${qs.stringify(query)}`;
}

export async function stopJob() {
  const flag = confirm(`Are you sure to stop ${jobName}?`);
  if (flag) {
    const url = namespace
      ? `${config.restServerUri}/api/v1/user/${namespace}/jobs/${jobName}/executionType`
      : `${config.restServerUri}/api/v1/jobs/${jobName}/executionType`;
    const token = checkToken();
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: 'STOP',
      }),
    });
    const json = await res.json();
    if (res.ok) {
      return json;
    } else {
      throw new Error(json.message);
    }
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
        ret.fullLogLink = link[0].href;
      }
    }
    return ret;
  } catch (e) {
    throw new Error(`Log not available`);
  }
}

export function openJobAttemptsPage(retryCount) {
  const search = namespace ? namespace + '~' + jobName : jobName;
  const jobSessionTemplate = JSON.stringify({'iCreate': 1, 'iStart': 0, 'iEnd': retryCount + 1, 'iLength': 20,
    'aaSorting': [[0, 'desc', 1]], 'oSearch': {'bCaseInsensitive': true, 'sSearch': search, 'bRegex': false, 'bSmart': true},
    'abVisCols': []});
  sessionStorage.setItem('apps', jobSessionTemplate);
  window.open(config.yarnWebPortalUri);
}
