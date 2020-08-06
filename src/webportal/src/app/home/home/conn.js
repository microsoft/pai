// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PAIV2 } from '@microsoft/openpai-js-sdk';

import config from '../../config/webportal.config';

const username = cookies.get('user');
const token = cookies.get('token');

const client = new PAIV2.OpenPAIClient({
  rest_server_uri: new URL(config.restServerUri, window.location.href),
  username: username,
  token: token,
  https: window.location.protocol === 'https:',
});

export class UnauthorizedError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'UnauthorizedError';
  }
}

const wrapper = async func => {
  try {
    return await func();
  } catch (err) {
    if (err.data.code === 'UnauthorizedUserError') {
      throw new UnauthorizedError(err.data.message);
    } else {
      throw new Error(err.data.message || err.message);
    }
  }
};

export async function listJobs() {
  return wrapper(() => client.job.listJobs(username));
}

export async function listAllJobs() {
  return wrapper(() => client.job.listJobs());
}

export async function getUserInfo() {
  return wrapper(() => client.user.getUser(username));
}

export async function listVirtualClusters() {
  return wrapper(() => client.virtualCluster.listVirtualClusters());
}

export async function getAvailableGpuPerNode() {
  const res = await fetch(
    `${config.restServerUri}/api/v2/virtual-clusters?nodes`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (res.ok) {
    const json = await res.json();
    try {
      const result = {};
      for (const ip of Object.keys(json)) {
        result[ip] = json[ip].gpuAvailable;
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
  return wrapper(() =>
    client.job.updateJobExecutionType(username, name, 'STOP'),
  );
}
