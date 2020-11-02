// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { clearToken } from '../../../../user/user-logout/user-logout.component';
import config from '../../../../config/webportal.config';
import _ from 'lodash';
import qs from 'querystring';
import urljoin from 'url-join';

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
    const url = urljoin(restServerUri.toString(), `/api/v2/users/${userName}`)
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
    const url = urljoin(restServerUri.toString(), `/api/v2/jobs/${userName}~${jobName}/config`);
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
      const errorMessage = _.get(err, 'data.message', _.get(err, 'message'))
      throw new Error(`There is an error during an api call of the bounded cluster ${alias}. Details: ${errorMessage}"`);
  }
}


// confirm the VC is available to the user
async function confirmVC(clusterConfig, jobConfig) {
  const vcName = _.get(jobConfig, 'defaults.virtualCluster');
  // get all available VCs
  const result = await boundedClusterWrapper(clusterConfig.alias, async () => {
    const url = urljoin(clusterConfig.uri, "/rest-server/api/v2/virtual-clusters");
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${clusterConfig.token}`,
      },
    });
    const result = await res.json();
    return result;
  });
  if (!_.has(result, vcName)) {
    throw new Error(`The bounded cluster ${clusterConfig.alias} doesn't have the virtual cluster ${vcName}. Please modify your job config.`)
  }
}

// confirm the sku is available
async function confirmSKU(clusterConfig, jobConfig) {
  const vcName = _.get(jobConfig, 'defaults.virtualCluster');
  const usedSKUs = [];
  const taskroleSettings = _.get(jobConfig, 'extras.hivedScheduler.taskRoles')
  if (taskroleSettings) {
    for (taskrole in taskroleSettings) {
      const sku = _.get(taskroleSettings[taskrole], 'skuType');
      if (sku) {
        usedSKUs.push(sku);
      }
    }
    if (usedSKUs.length > 0) {
      const result = await boundedClusterWrapper(clusterConfig.alias, async () => {
        const url = urljoin(clusterConfig.uri, `/rest-server/api/v2/cluster/sku-types?${qs.stringify({vc: vcName})}`);
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${clusterConfig.token}`,
          },
        });
        const result = await res.json();
        return result;
      });
      for (let usedSKU of usedSKUs) {
        if (!_.has(result, usedSKU)){
          throw new Error(`The virtual cluster ${vcName} in bounded cluster ${clusterConfig.alias} doesn't have the SKU ${usedSKU}.` +
            ". Please modify your job config.");
        }
      }
    }
  }
}

// confirm the job name is not duplicate
async function confirmJobName(clusterConfig, jobConfig) {
  const userName = clusterConfig.username;
  const jobName = _.get(jobConfig, 'name');
  try {
    const url = urljoin(clusterConfig.uri, `/rest-server/api/v2/jobs/${userName}~${jobName}/config`);
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${clusterConfig.token}`,
      },
    });
    // there is already a job with this name, exit with error
    throw new Error(`There is already a job with name ${jobName} in the bounded cluster. Please modify your job config.`);
  } catch (err) {
    if (_.get(err, 'data.code') !== 'NoJobError') {
      throw err;
    }
  }
}


async function addTagToJob(userName, jobName, tagName) {
  return wrapper(async () => {
    const restServerUri = new URL(config.restServerUri, window.location.href);
    const url = urljoin(clusterConfig.uri, `/rest-server/api/v2/jobs/${userName}~${jobName}/tag`);
    const res = await fetch(url, {
      method: 'PUT',
      body: JSON.stringify({value: tagName}),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await res.json();
    return result;
  });
}

// `userName` and `jobName` is the userName/jobName on this cluster
// `clusterConfig`` is the bounded cluster to be transferred to.
// After transfer, the username in the bounded cluster should be clusterConfig.username,
// and the job name should be _.get(jobConfig, 'name').
export async function transferJob(userName, jobName, clusterConfig, jobConfig, jobConfigYAML) {
  await Promise.all([
    confirmVC(clusterConfig, jobConfig),
    confirmSKU(clusterConfig, jobConfig),
    confirmJobName(clusterConfig, jobConfig),
  ]);
  // add tag
  await addTagToJob(userName, jobName, `pai-transfer-attempt-to-${clusterConfig.alias}`)
  // submit job to the bounded cluster
  await boundedClusterWrapper(clusterConfig.alias, async () => {
    const url = urljoin(clusterConfig.uri, `/api/v2/jobs`);
    const res = await fetch(url, {
      method: 'POST',
      body: jobConfigYAML,
      headers: {
        Authorization: `Bearer ${clusterConfig.token}`,
      },
    })
  })

  // add tag
  const transferredURL = new URL(`job-detail.html?${qs.stringify({
    username: clusterConfig.username,
    jobName: _.get(jobConfig, 'name'),
  })}`, clusterConfig.uri);
  await addTagToJob(userName, jobName, `pai-transferred-to-${transferredURL}`);
}
