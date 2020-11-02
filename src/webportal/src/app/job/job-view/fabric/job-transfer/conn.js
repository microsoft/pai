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

const boundedClusterWrapper = async (alias, func) => {
  try {
    return await func();
  } catch (err) {
      const errorMessage = _.pick(err, 'data.message', _.pick(err, 'message'))
      throw new Error(`There is an error during an api call of the bounded cluster ${alias}. Details: ${errorMessage}"`);
  }
}


// confirm the VC is available to the user
async function confirmVC(clusterConfig, jobConfig) {
  const vcName = _.pick(jobConfig, 'defaults.virtualCluster');
  // get all available VCs
  await boundedClusterWrapper(clusterConfig.alias, async () => {
    const url = new URL(`/api/v2/virtual-clusters`, clusterConfig.uri)

  });
}

// confirm the sku is available
async function confirmSKU(clusterConfig, jobConfig) {

}

// confirm the job name is not duplicate
async function confirmJobName(clusterConfig, jobConfig) {

}


async function addTagToJob(userName, jobName, tagName) {
  return wrapper(async () => {
    const restServerUri = new URL(config.restServerUri, window.location.href);
    const url = `${restServerUri}/api/v2/jobs/${userName}~${jobName}/tag`
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    return result;
  });
}

async function transfer(userName, jobName, clusterConfig, jobConfig) {


}
