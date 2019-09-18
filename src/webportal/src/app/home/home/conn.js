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

import querystring from 'querystring';

import config from '../../config/webportal.config';

const username = cookies.get('user');
const token = cookies.get('token');

export class UnauthorizedError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'UnauthorizedError';
  }
}

async function fetchWrapper(...args) {
  const res = await fetch(...args);
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    if (json.code === 'UnauthorizedUserError') {
      throw new UnauthorizedError(json.message);
    } else {
      throw new Error(json.message);
    }
  }
}

export async function listJobs() {
  return fetchWrapper(
    `${config.restServerUri}/api/v1/jobs?${querystring.stringify({
      username,
    })}`,
  );
}

export async function listAllJobs() {
  return fetchWrapper(`${config.restServerUri}/api/v1/jobs`);
}

export async function getUserInfo() {
  return fetchWrapper(`${config.restServerUri}/api/v2/user/${username}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function listVirtualClusters() {
  return fetchWrapper(`${config.restServerUri}/api/v2/virtual-clusters`);
}

export async function getAvailableGpuPerNode() {
  const res = await fetch(
    `${config.restServerUri}/api/v2/virtual-clusters?nodes`,
  );

  if (res.ok) {
    const json = await res.json();
    try {
      const result = {};
      for (const ip of Object.keys(json)) {
        result[ip] = json[ip].gpuAvaiable;
      }
      return result;
    } catch {
      throw new Error('Invalid available gpu per node response');
    }
  } else {
    const json = await res.json();
    throw new Error(json.error);
  }
}

export async function getLowGpuJobInfos() {
  const prometheusQuery = `avg(avg_over_time(task_gpu_percent[10m]) < 10) by (job_name)`;
  const res = await fetch(
    `${config.prometheusUri}/api/v1/query?query=${encodeURIComponent(
      prometheusQuery,
    )}`,
  );
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message);
  }

  const lowGpuJobInfos = json.data.result.map(keyValuePair => {
    const frameworkName = keyValuePair.metric.job_name;
    const jobNameBeginIndex = frameworkName.indexOf('~');
    return {
      jobName: frameworkName.slice(jobNameBeginIndex + 1),
      gpuUsage: keyValuePair.value[1],
    };
  });
  return lowGpuJobInfos;
}

export async function stopJob(job) {
  const { name, username } = job;
  const res = await fetch(
    `${config.restServerUri}/api/v1/jobs/${username}~${name}/executionType`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: 'STOP' }),
    },
  );
  const json = await res.json();
  if (!res.ok) {
    if (json.code === 'UnauthorizedUserError') {
      throw new UnauthorizedError(json.message);
    } else {
      throw new Error(json.message);
    }
  }
}
