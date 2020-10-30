// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { clearToken } from '../../../../user/user-logout/user-logout.component';
import config from '../../../../config/webportal.config';
import _ from 'lodash';

const token = cookies.get('token');

const wrapper = async func => {
  try {
    return await func();
  } catch (err) {
    if (err.data.code === 'UnauthorizedUserError') {
      alert(err.data.message);
      clearToken();
    } else {
      throw new Error(err.data.message);
    }
  }
}

export async function fetchBoundedClusters(userName) {
  return wrapper(async () => {
    const restServerUri = new URL(config.restServerUri, window.location.href);
    const url = `${restServerUri}/api/v2/users/${userName}`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    return _.get(result, 'extension.boundedClusters', {});
  });
}

export async function fetchJobConfig(userName, jobName) {
  return wrapper(async () => {
    const restServerUri = new URL(config.restServerUri, window.location.href);
    const url = `${restServerUri}/api/v2/jobs/${userName}~${jobName}/config`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    return result;
  });
}
