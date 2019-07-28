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

import {get, isNil} from 'lodash';
import querystring from 'querystring';
import {userLogout} from '../../user/user-logout/user-logout.component.js';

import config from '../../config/webportal.config';

const username = cookies.get('user');
const token = cookies.get('token');

async function fetchWrapper(...args) {
  const res = await fetch(...args);
  const json = await res.json();
  if (res.ok) {
    return json;
  } else {
    if (json.code === 'UnauthorizedUserError') {
      alert(json.message);
      userLogout();
    } else {
      throw new Error(json.message);
    }
  }
}

export async function listJobs() {
  return fetchWrapper(`${config.restServerUri}/api/v2/jobs?${querystring.stringify({username})}`);
}

export async function getUserInfo() {
  return fetchWrapper(`${config.restServerUri}/api/v1/user/${username}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function listVirtualClusters() {
  return fetchWrapper(`${config.restServerUri}/api/v2/virtual-clusters`);
}

export async function getTotalGpu() {
  const res = await fetch(`${config.prometheusUri}/api/v1/query?query=sum(yarn_node_gpu_total)`);

  if (res.ok) {
    const json = await res.json();
    const data = get(json, 'data.result[0].value[1]');
    if (!isNil(data)) {
      return parseInt(data, 10);
    } else {
      throw new Error('Invalid total gpu response');
    }
  } else {
    const json = await res.json();
    throw new Error(json.error);
  }
}

export async function getAvailableGpuPerNode() {
  const res = await fetch(`${config.restServerUri}/api/v2/virtual-clusters/nodeResource`);

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
