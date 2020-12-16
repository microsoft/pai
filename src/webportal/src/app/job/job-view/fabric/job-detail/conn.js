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
"use strict";

import yaml from 'js-yaml';
import {get, isNil} from 'lodash';
import qs from 'querystring';

import {userLogout} from '../../../../user/user-logout/user-logout.component';
import {checkUser, checkAdmin} from '../../../../user/user-auth/user-auth.component';
import config from '../../../../config/webportal.config';
import {isJobV2} from './util';
import {restServerClient, getClientsForSubcluster} from '../../../../common/http-client';
import {getSubclusterConfigByName, getSubclusterNameByDataCenter} from '../../../../common/subcluster';

const absoluteUrlRegExp = /^[a-z][a-z\d+.-]*:/;
let vcName = null;
let jobUserName = null;

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

export async function fetchJobInfo() {
  const params = new URLSearchParams(window.location.search);
  const jobName = params.get('jobName');
  const appId = params.get('appId');
  const url = jobName ? `/api/v2/mp/jobs/jobName/${jobName}`:`/api/v2/mp/jobs/appId/${appId}`;

  const res = await restServerClient.get(url);
  // This code uses global var to store state... Magic
  vcName = res.data.jobStatus.virtualCluster;
  jobUserName = res.data.jobStatus.username;
  return res.data;
}

export async function fetchJobFullDetail(jobId) {
  const res = await restServerClient.get(`/api/v2/jobs/${jobId}`);
  return res.data;
}

export async function fetchRawJobConfig() {
  const params = new URLSearchParams(window.location.search);
  const jobName = params.get('jobName');
  const username = checkUser(false);
  const url = username
    ? `/api/v2/user/${username}/jobs/${jobName}/config`
    : `/api/v1/jobs/${jobName}/config`;

  try {
    const res = await restServerClient.get(url); // res.data is plain text. Could be yaml or json
    return yaml.safeLoad(res.data);
  } catch (err) {
    if (err.response) {
      let data = yaml.safeLoad(err.response.data);
      if (data.code === 'NoJobConfigError') {
        throw new NotFoundError(data.message);
      } else {
        throw new Error(data.message);
      }
    } else {
      throw err;
    }
  }
}

export async function fetchJobConfig() {
  const params = new URLSearchParams(window.location.search);
  const jobName = params.get('jobName');
  const username = checkUser(false);
  const url = username
    ? `/api/v2/jobs/${username}~${jobName}/config`
    : `/api/v2/jobs/${jobName}/config`;

  try {
    const res = await restServerClient.get(url); // res.data is plain text. Could be yaml or json
    return yaml.safeLoad(res.data);
  } catch (err) {
    if (err.response) {
      let data = yaml.safeLoad(err.response.data);
      if (data.code === 'NoJobConfigError') {
        throw new NotFoundError(data.message);
      } else {
        throw new Error(data.message);
      }
    } else {
      throw err;
    }
  }
}

export async function fetchSshInfo() {
  const params = new URLSearchParams(window.location.search);
  const jobName = params.get('jobName');
  const username = checkUser(false);
  const url = username
    ? `/api/v2/user/${username}/jobs/${jobName}/ssh`
    : `/api/v1/jobs/${jobName}/ssh`;

  try {
    const res = await restServerClient.get(url); // res.data is plain text. Could be yaml or json
    return res.data;
  } catch (err) {
    if (err.response) {
      const data = err.response.data;
      if (data.code === 'NoJobSshInfoError') {
        throw new NotFoundError(data.message);
      } else {
        throw new Error(data.message);
      }
    } else {
      throw err;
    }
  }
}

export async function fetchFrameworkVersions(jobname) {
  const url = `/api/v2/frameworks/${jobname}/versions`;
  try {
    const res = await restServerClient.get(url);
    return res.data.versions;
  } catch (err) {
    const data = err.response.data;
    if (err.response) {
      if (data.code === 'NoFrameworkVersionsError') {
        throw new NotFoundError(data.message);
      } else {
        throw new Error(data.message);
      }
    } else {
      throw err;
    }
  }
}

export async function fetchFrameworkAttempts(jobname, version) {
  const url = `/api/v2/frameworks/${jobname}/attempts?version=${version}`;
  try {
    const res = await restServerClient.get(url);
    return res.data.attempts;
  } catch (err) {
    const data = err.response.data;
    if (err.response) {
      if (data.code === 'NoFrameworkAttemptsError') {
        throw new NotFoundError(data.message);
      } else {
        throw new Error(data.message);
      }
    } else {
      throw err;
    }
  }
}

export async function fetchFrameworkAttempt(jobname, version, attemptId) {
  const url = `/api/v2/frameworks/${jobname}/attempts/${attemptId}?version=${version}`;
  try {
    const res = await restServerClient.get(url);
    return res.data;
  } catch (err) {
    const data = err.response.data;
    if (err.response) {
      if (data.code === 'NoFrameworkAttemptError') {
        throw new NotFoundError(data.message);
      } else {
        throw new Error(data.message);
      }
    } else {
      throw err;
    }
  }
}

export async function getApplicationAddressOnSHS(jobInfo) {
  const dataCenter = jobInfo.jobStatus.runningDataCenter;
  let subclusterName = getSubclusterNameByDataCenter(dataCenter);
  const {sparkJobHistoryClient} = getClientsForSubcluster(subclusterName);
  try {
    const res = await sparkJobHistoryClient.get(`/api/v1/applications/${jobInfo.jobStatus.appId}`, {
      timtout: 3000,
    });
    const data = res.data;
    const sparkHisotyServerAddress = getSubclusterConfigByName(subclusterName).sparkHistoryServerUri;
    if (data.attempts.length === 1 && data.attempts[0].attemptId === null) {
      return `${sparkHisotyServerAddress}/history/${jobInfo.jobStatus.appId}/jobs`;
    }
    return `${sparkHisotyServerAddress}/history/${jobInfo.jobStatus.appId}/${jobInfo.jobStatus.latestAttemptId}/jobs`;
  } catch (err) {
    if (jobInfo.jobStatus.state === 'ARCHIVED' || jobInfo.jobStatus.state === 'INCOMPLETED') {
      return null;
    }
    return jobInfo.jobStatus.appTrackingUrl;
  }
}

export async function fetchVCInfo(jobInfo) {
  const url = `/api/v1/virtual-clusters/${jobInfo.jobStatus.virtualCluster}`;
  const res = await restServerClient.get(url, {
    timeout: 3000,
  });
  return res.data;
}

export async function getJobGroupApplication(groupId) {
  const url = `/api/v2/mp/groups/${groupId}/apps`;
  const res = await restServerClient.get(url, {
    timeout: 3000,
  });
  return res.data;
}

export function getJobMetricsUrl(jobInfo) {
  const params = new URLSearchParams(window.location.search);
  const jobName = params.get('jobName');
  const username = checkUser(false);
  const from = jobInfo.jobStatus.createdTime;
  let to;
  const {state} = jobInfo.jobStatus;
  if (state === 'RUNNING') {
    to = Date.now();
  } else {
    to = jobInfo.jobStatus.completedTime;
  }
  return `${config.grafanaUri}/dashboard/db/joblevelmetrics?var-job=${username ? `${username}~${jobName}`: jobName}&from=${from}&to=${to}`;
}

export async function cloneJob(rawJobConfig) {
  const params = new URLSearchParams(window.location.search);
  const jobName = params.get('jobName');
  const username = checkUser(false);
  const query = {
    op: 'resubmit',
    type: 'job',
    user: username,
    jobname: jobName,
  };

  // plugin
  const pluginId = get(rawJobConfig, 'extras.submitFrom');
  if (isNil(pluginId)) {
    if (isJobV2(rawJobConfig)) {
      window.location.href = `/submit.html?${qs.stringify(query)}`;
    } else {
      window.location.href = `/submit_v1.html?${qs.stringify(query)}`;
    }
    return;
  }
  const plugins = window.PAI_PLUGINS;
  const pluginIndex = plugins.findIndex((x) => x.id === pluginId);
  if (pluginIndex === -1) {
    // redirect v2 job to default submission page
    if (isJobV2(rawJobConfig)) {
      alert(`The job was submitted by ${pluginId}, but it is not installed. Will use default submission page instead`);
      window.location.href = `/submit.html?${qs.stringify(query)}`;
      return;
    }
    alert(`Clone job failed. The job was submitted by ${pluginId}, but it is not installed.`);
    return;
  }
  window.location.href = `/plugin.html?${qs.stringify({...query, index: pluginIndex})}`;
}

export async function stopJob() {
  const params = new URLSearchParams(window.location.search);
  const jobName = params.get('jobName');
  const appId = params.get('appId');
  const displayName = jobName ? jobName : appId;
  const username = checkUser(false);

  const queueAclUrl = `/api/v1/virtual-clusters/${vcName}/access?queueAclType=ADMINISTER_QUEUE&user=${username}`;
  const queueAclInfoRes = await restServerClient.get(queueAclUrl);
  const queueAclInfoJson = queueAclInfoRes.data;
  
  let allowStop = true;
  if (jobUserName !== username && !checkAdmin()) {
    if ((queueAclInfoRes.status === 200) && queueAclInfoJson.rmQueueAclInfo.allowed && queueAclInfoJson.rmQueueAclInfo.allowed === 'false') {
      allowStop = false;
    }
  }
  
  if (!allowStop) {
    alert(`User ${username} is not allowed to stop application ${displayName}.`);
    return;
  }

  const flag = confirm(`Are you sure to stop ${displayName}?`);
  if (flag) {
    const url = jobName ? `/api/v2/mp/jobs/jobName/${jobName}/executionType` : `/api/v2/mp/jobs/appId/${appId}/executionType`;
    try {
      const res = await restServerClient.put(url, {
        value: 'STOP',
      });
      return res.data;
    } catch (err) {
      if (err.response) {
        const data = err.response.data;
        if (data.code === 'UnauthorizedUserError') {
          alert(data.message);
          userLogout();
        } else {
          alert(data.message);
          throw new Error(data.message);
        }
      } else {
        throw err;
      }
    }
  }
}

export async function stopAllJobs(groupId) {
  const flag = confirm(`Are you sure to stop group ${groupId}?`);
  if (flag) {
    const url = `/api/v2/mp/groups/${groupId}/executionType`;
    try {
      const res = await restServerClient.put(url, {
        value: 'STOP',
      });
      alert(res.data.message);
      return res.data;
    } catch (err) {
      if (err.response) {
        const data = err.response.data;
        if (data.code === 'UnauthorizedUserError') {
          alert(data.message);
          userLogout();
        } else {
          alert(data.message);
          throw new Error(data.message);
        }
      } else {
        throw err;
      }
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
}

export function openJobAttemptsPage(retryCount) { // This func is not used
  const params = new URLSearchParams(window.location.search);
  const jobName = params.get('jobName');
  const username = checkUser(false);
  const search = username ? username + '~' + jobName : jobName;
  const jobSessionTemplate = JSON.stringify({'iCreate': 1, 'iStart': 0, 'iEnd': retryCount + 1, 'iLength': 20,
    'aaSorting': [[0, 'desc', 1]], 'oSearch': {'bCaseInsensitive': true, 'sSearch': search, 'bRegex': false, 'bSmart': true},
    'abVisCols': []});
  sessionStorage.setItem('apps', jobSessionTemplate);
  window.open(config.yarnWebPortalUri);
}

export async function getResourceRequests(applicationId) {
  let resp = await restServerClient.get(`/api/v2/mp/jobs/appId/${applicationId}/resourceRequests`);
  return resp.data;
}
