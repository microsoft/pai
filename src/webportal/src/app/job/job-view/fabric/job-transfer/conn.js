// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import config from '../../../../config/webportal.config';
import _ from 'lodash';
import qs from 'querystring';
import urljoin from 'url-join';

const token = cookies.get('token');

// A simple wrapper for rest-server api calls.
// It will throw error if there is any: e.g. Network Error, Failed Response Code
const requestApi = async (url, params) => {
  const response = await fetch(url, params);
  const result = await response.json();
  // node-fetch will throw error like network error.
  // node-fetch won't throw error if the response is not successful (e.g. 404, 500)
  // In such case, we throw the error manually
  if (!response.ok) {
    if (_.has(result, 'message')) {
      throw new Error(result.message);
    } else {
      throw new Error(
        `Unknown response error happens when request url ${url}.`,
      );
    }
  }
  return result;
};

// Use a different function to provide more friendly error message
const requestBoundedClusterApi = async (alias, url, params) => {
  const response = await fetch(url, params);
  const result = await response.json();
  // node-fetch will throw error like network error
  // node-fetch won't throw error if the response is not 20X (e.g. 404, 500)
  // In such case, we throw the error manually
  if (!response.ok) {
    if (_.has(result, 'message')) {
      throw new Error(
        `There is an error during api call to bounded cluster ${alias}. Detail message: ${result.message}`,
      );
    } else {
      throw new Error(
        `There is a unknown error during api call to bounded cluster ${alias}. URL: ${url}.`,
      );
    }
  }
  return result;
};

export async function fetchBoundedClusters(userName) {
  const restServerUri = new URL(config.restServerUri, window.location.href);
  const url = urljoin(restServerUri.toString(), `/api/v2/users/${userName}`);
  const result = await requestApi(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return _.get(result, 'extension.boundedClusters', {});
}

export async function fetchJobConfig(userName, jobName) {
  const restServerUri = new URL(config.restServerUri, window.location.href);
  const url = urljoin(
    restServerUri.toString(),
    `/api/v2/jobs/${userName}~${jobName}/config`,
  );
  const result = await requestApi(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return result;
}

export async function fetchJobState(userName, jobName) {
  const restServerUri = new URL(config.restServerUri, window.location.href);
  const url = urljoin(
    restServerUri.toString(),
    `/api/v2/jobs/${userName}~${jobName}`,
  );
  const result = await requestApi(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return _.get(result, 'jobStatus.state', 'UNKNOWN');
}

export async function stopJob(userName, jobName) {
  const restServerUri = new URL(config.restServerUri, window.location.href);
  const url = urljoin(
    restServerUri.toString(),
    `/api/v2/jobs/${userName}~${jobName}/executionType`,
  );
  await requestApi(url, {
    method: 'PUT',
    body: JSON.stringify({ value: 'STOP' }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// confirm the VC is available to the user
async function confirmVC(clusterConfig, jobConfig) {
  const vcName = _.get(jobConfig, 'defaults.virtualCluster');
  // get all available VCs
  const url = urljoin(
    clusterConfig.uri,
    '/rest-server/api/v2/virtual-clusters',
  );
  const result = await requestBoundedClusterApi(clusterConfig.alias, url, {
    headers: {
      Authorization: `Bearer ${clusterConfig.token}`,
    },
  });
  if (!_.has(result, vcName)) {
    throw new Error(
      `The bounded cluster ${clusterConfig.alias} doesn't have the virtual cluster ${vcName}, ` +
        "or you don't have permission to it. Please modify your job config. " +
        `Available virtual clusters include: ${_.keys(result).join(', ')}`,
    );
  }
}

// confirm the sku is available
async function confirmSKU(clusterConfig, jobConfig) {
  const vcName = _.get(jobConfig, 'defaults.virtualCluster');
  const usedSKUs = [];
  const taskroleSettings = _.get(jobConfig, 'extras.hivedScheduler.taskRoles');
  if (taskroleSettings) {
    for (const taskrole in taskroleSettings) {
      const sku = _.get(taskroleSettings[taskrole], 'skuType');
      if (sku) {
        usedSKUs.push(sku);
      }
    }
    if (usedSKUs.length > 0) {
      const url = urljoin(
        clusterConfig.uri,
        `/rest-server/api/v2/cluster/sku-types?${qs.stringify({ vc: vcName })}`,
      );
      const result = await requestBoundedClusterApi(clusterConfig.alias, url, {
        headers: {
          Authorization: `Bearer ${clusterConfig.token}`,
        },
      });
      for (const usedSKU of usedSKUs) {
        if (!_.has(result, usedSKU)) {
          throw new Error(
            `The virtual cluster ${vcName} in bounded cluster ${clusterConfig.alias} doesn't have the SKU ${usedSKU}. ` +
              'Please modify your job config. ' +
              `Available SKUs include: ${_.keys(result).join(', ')}`,
          );
        }
      }
    }
  }
}

// confirm the storage settings
async function confirmStorage(clusterConfig, jobConfig) {
  const pluginSettings = _.get(jobConfig, 'extras', {})[
    'com.microsoft.pai.runtimeplugin'
  ];
  const usedStorages = [];
  if (pluginSettings) {
    for (const pluginSetting of pluginSettings) {
      if (pluginSetting.plugin === 'teamwise_storage') {
        for (const storage of _.get(
          pluginSetting,
          'parameters.storageConfigNames',
          [],
        )) {
          usedStorages.push(storage);
        }
      }
    }
    if (usedStorages.length > 0) {
      const url = urljoin(clusterConfig.uri, `/rest-server/api/v2/storages`);
      const result = await requestBoundedClusterApi(clusterConfig.alias, url, {
        headers: {
          Authorization: `Bearer ${clusterConfig.token}`,
        },
      });
      const availableStorages = new Set(result.storages.map(item => item.name));
      for (const usedStorage of usedStorages) {
        if (!availableStorages.has(usedStorage)) {
          const availableStorageHint =
            result.storages.length === 0
              ? ''
              : `Available storages include ${result.storages
                  .map(item => item.name)
                  .join(', ')}`;
          throw new Error(
            `We cannot find storage ${usedStorage} in bounded cluster ${clusterConfig.alias}. ` +
              "Maybe the storage doesn't exist, or you don't have permission to it. " +
              'Please modify your job config. ' +
              availableStorageHint,
          );
        }
      }
    }
  }
}

// confirm the job name is not duplicate
async function confirmJobName(clusterConfig, jobConfig) {
  const userName = clusterConfig.username;
  const jobName = _.get(jobConfig, 'name');
  const url = urljoin(
    clusterConfig.uri,
    `/rest-server/api/v2/jobs/${userName}~${jobName}/config`,
  );
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${clusterConfig.token}`,
    },
  });
  const result = await response.json();
  if (!response.ok) {
    if (_.get(result, 'code') === 'NoJobError') {
      // OK, the job name doesn't exist
      return;
    }
    throw new Error(
      `There is an error during api call to bounded cluster ${clusterConfig.alias}. Detail message: ${result.message}.`,
    );
  } else {
    throw new Error(
      `There is already a job with the name ${jobName} in the bounded cluster. Please modify your job config.`,
    );
  }
}

async function addTagToJob(userName, jobName, tagName) {
  const restServerUri = new URL(config.restServerUri, window.location.href);
  const url = urljoin(
    restServerUri.toString(),
    `/api/v2/jobs/${userName}~${jobName}/tag`,
  );
  const result = await requestApi(url, {
    method: 'PUT',
    body: JSON.stringify({ value: tagName }),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return result;
}

// `userName` and `jobName` is the userName/jobName on this cluster
// `clusterConfig`` is the bounded cluster to be transferred to.
// After transfer, the username in the bounded cluster should be clusterConfig.username,
// and the job name should be _.get(jobConfig, 'name').
export async function transferJob(
  userName,
  jobName,
  clusterConfig,
  jobConfig,
  jobConfigYAML,
) {
  await Promise.all([
    confirmVC(clusterConfig, jobConfig),
    confirmSKU(clusterConfig, jobConfig),
    confirmJobName(clusterConfig, jobConfig),
    confirmStorage(clusterConfig, jobConfig),
  ]);
  // add tag
  await addTagToJob(
    userName,
    jobName,
    `pai-transfer-attempt-to-${clusterConfig.alias}-url-${clusterConfig.uri}`,
  );
  // submit job to the bounded cluster
  const url = urljoin(clusterConfig.uri, `/rest-server/api/v2/jobs`);
  await requestBoundedClusterApi(clusterConfig.alias, url, {
    method: 'POST',
    body: jobConfigYAML,
    headers: {
      Authorization: `Bearer ${clusterConfig.token}`,
    },
  });

  // add tag
  const transferredURL = new URL(
    `job-detail.html?${qs.stringify({
      username: clusterConfig.username,
      jobName: _.get(jobConfig, 'name'),
    })}`,
    clusterConfig.uri,
  );
  await addTagToJob(
    userName,
    jobName,
    `pai-transferred-to-${clusterConfig.alias}-url-${transferredURL}`,
  );
}
