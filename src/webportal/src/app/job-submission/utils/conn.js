// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { PAIV2 } from '@microsoft/openpai-js-sdk';
import { clearToken } from '../../user/user-logout/user-logout.component.js';
import config from '../../config/webportal.config';
import yaml from 'js-yaml';
import { get } from 'lodash';

const token = cookies.get('token');

const client = new PAIV2.OpenPAIClient({
  rest_server_uri: `${window.location.host}/${config.restServerUri}`,
  username: cookies.get('user'),
  token: token,
  https: window.location.protocol === 'https:',
});

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

export class NotFoundError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NotFoundError';
  }
}

export async function submitJob(jobProtocol) {
  const job = yaml.safeLoad(jobProtocol);
  return wrapper(() => client.job.createJob(job));
}

export async function fetchJobConfig(userName, jobName) {
  return wrapper(() => client.job.getJobConfig(userName, jobName));
}

export async function listUserVirtualClusters(user) {
  const userInfo = await wrapper(() => client.user.getUser(user));
  return get(userInfo, 'virtualCluster', []);
}

export async function fetchUserGroup(api, user, token) {
  const userInfo = await wrapper(() => client.user.getUser(user));
  return get(userInfo, 'grouplist', []);
}

export async function listUserStorageConfigs(user) {
  return wrapper(async () => {
    const userInfo = await client.user.getUser(user);
    return userInfo.storageConfig || [];
  });
}

export async function fetchStorageDetails(configNames) {
  return wrapper(async () => {
    const storageSummary = await client.storage.getStorages();
    const defaultStorages = await client.storage.getStorages(true);
    const defaultStorageNames = defaultStorages.storages.map(x => x.name);
    const details = [];
    for (const storage of storageSummary.storages) {
      if (configNames.includes(storage.name)) {
        const detail = await client.storage.getStorage(storage.name);
        if (defaultStorageNames.includes(detail.name)) {
          detail.default = true;
        }
        details.push(detail);
      }
    }
    return details;
  });
}
