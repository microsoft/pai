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

import {userLogout} from '../../user/user-logout/user-logout.component.js';

import config from '../../config/webportal.config';
import yaml from 'js-yaml';
import {get} from 'lodash';

const token = cookies.get('token');

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

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

export async function submitJob(jobProtocol) {
  return await fetchWrapper(`${config.restServerUri}/api/v2/jobs`, {
    body: jobProtocol,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'text/yaml',
    },
    method: 'POST',
  });
}

export async function fetchJobConfig(userName, jobName) {
  const url = `${
    config.restServerUri
  }/api/v2/jobs/${userName}~${jobName}/config`;
  const res = await fetch(url);
  const text = await res.text();
  let json = yaml.safeLoad(text);
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

export async function listUserVirtualClusters(user) {
  const userInfo = await fetchWrapper(`${config.restServerUri}/api/v1/user/${user}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    method: 'GET',
  });
  return get(userInfo, 'virtualCluster', []);
}

export async function fetchUserGroup(api, user, token) {
  const userInfoUrl = `${api}/api/v2/user/${user}`;

  return fetch(userInfoUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  }).then((response) => {
    if (response.ok) {
      return response.json().then((responseData) => {
        return responseData.grouplist;
      });
    } else {
      throw Error(`fetch ${userInfoUrl}: HTTP ${response.status}`);
    }
  });
}

export async function fetchStorageConfigData(api) {
  const storageConfigUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-config`;
  return fetch(storageConfigUrl).then((response) => {
    if (response.ok) {
      return response.json().then((responseData) => responseData.data);
    } else {
      throw Error(`fetch ${storageConfigUrl}: HTTP ${response.status}`);
    }
  });
}

export async function fetchStorageServer(api) {
  const storageServerUrl = `${api}/api/v1/kubernetes/api/v1/namespaces/pai-storage/secrets/storage-server`;
  return fetch(storageServerUrl).then((response) => {
    if (response.ok) {
      return response.json().then((responseData) => responseData.data);
    } else {
      throw Error(`fetch ${storageServerUrl}: HTTP ${response.status}`);
    }
  });
}
