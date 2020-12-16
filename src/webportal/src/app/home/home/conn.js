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

import querystring from 'querystring';

import config from '../../config/webportal.config';
import {restServerClient, defaultRestServerClient} from '../../common/http-client';
import {checkUser} from '../../user/user-auth/user-auth.component';

export class UnauthorizedError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'UnauthorizedError';
  }
}

export async function listJobs() {
  let username = checkUser(true);
  let jobListUri = (config.serviceName && config.serviceName.toLowerCase() === 'mt') ?
  `/api/v2/mp/jobs?${querystring.stringify({ username })}` :
  `/api/v1/jobs?${querystring.stringify({ username })}`;
  let resp = await restServerClient.get(jobListUri);
  return resp.data;
}

export async function getUserInfo() {
  let username = checkUser(true);
  let resp = await defaultRestServerClient.get(`/api/v2/user/${username}`);
  return resp.data;
}

export async function listVirtualClusters() {
  let resp = await restServerClient.get('/api/v1/virtual-clusters');
  return resp.data;
}

export async function listAggregatedVirtualClusters() {
  const res = await defaultRestServerClient.get('/api/v1/subClusters/virtual-clusters', {
    timtout: 3000,
  });
  return res.data;
}

export async function getUserGrouplist() {
  let username = cookies.get('user');
  const res = await defaultRestServerClient.get(`/api/v2/user/${username}/grouplist`, {
    timtout: 3000,
  });
  return res.data;
}

export async function listSchedulerVirtualClusters() {
  const res = await defaultRestServerClient.get('/api/v1/subClusters/virtual-clusters/scheduler', {
    timtout: 3000,
  });
  return res.data;
}

export async function getAvailableGpuPerNode() {
  const res = await fetch(`${config.prometheusUri}/api/v1/query?query=yarn_node_gpu_available`);

  if (res.ok) {
    const json = await res.json();
    try {
      const result = {};
      for (const x of json.data.result) {
        const ip = x.metric.node_ip;
        const count = parseInt(x.value[1], 10);
        result[ip] = count;
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
