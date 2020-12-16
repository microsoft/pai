'use strict';
const status = require('statuses');
const axios = require('@pai/utils/non-strict-axios');
const createError = require('@pai/utils/error');
const config = require('@pai/config/index');
const subClustersConfig = require('@pai/config/subclusters.config');
const logger = require('@pai/config/logger');

let allVirtualClusters = {
  'Clusters': {},
};

let allClusterSchedulerInfo = {
  'Clusters': {},
};

let allClusterAppsCountInfo = {
  'Clusters': {},
};

let initAppsCount = {
    'RUNNING': 0,
    'PREPARING': 0,
    'WAITTING': 0,
    'SUCCEEDED_24': 0,
    'SUCCEEDED': 0,
    'FAILED_24': 0,
    'FAILED': 0,
    'STOPPED_24': 0,
    'STOPPED': 0,
    'ARCHIVED': 0,
    'INCOMPLETED': 0,
};

const listVirtualClusters = async () => {
  try {
    let response = allVirtualClusters;
    return response;
  } catch (error) {
    throw createError('Internal Server Error', 'UnknownError', `get virtual cluster list of all clusters failure, error: ${error}`);
  }
};

const listAllClusterSchedulers = async () => {
  try {
    await addAppsCountInfoIntoClusterSchedulers();
    let response = allClusterSchedulerInfo;
    return response;
  } catch (error) {
    throw createError('Internal Server Error', 'UnknownError', `Get scheduler information of all clusters failure, error: ${error}`);
  }
};

const addAppsCountInfoIntoClusterSchedulers = async () => {
  const length = subClustersConfig.Clusters.length;
  for (let i = 0; i < length; i++) {
    let clusterName = subClustersConfig.Clusters[i].subCluster;
    if (allClusterSchedulerInfo.Clusters[clusterName].scheduler && allClusterAppsCountInfo.Clusters[clusterName].appsCount) {
      const queues = allClusterSchedulerInfo.Clusters[clusterName].scheduler.schedulerInfo.queues.queue;
      const appsCountInfoPerCluster = allClusterAppsCountInfo.Clusters[clusterName].appsCount;

      for (let j = 0; j < queues.length; j++) {
        let queue = allClusterSchedulerInfo.Clusters[clusterName].scheduler.schedulerInfo.queues.queue[j];
        queue.appsCount = JSON.parse(JSON.stringify(initAppsCount));
        if (appsCountInfoPerCluster.hasOwnProperty(queue.queueName)) {
          queue.appsCount = JSON.parse(JSON.stringify(appsCountInfoPerCluster[queue.queueName]));
        } else if (queue.hasOwnProperty('queues')) {
          for (let k = 0; k < queue.queues.queue.length; k++) {
            let subQueue = queue.queues.queue[k];
            subQueue.appsCount = JSON.parse(JSON.stringify(initAppsCount));
            if (appsCountInfoPerCluster.hasOwnProperty(subQueue.queueName)) {
              Object.keys(appsCountInfoPerCluster[subQueue.queueName]).forEach((key) => {
                queue.appsCount[key] += appsCountInfoPerCluster[subQueue.queueName][key];
                subQueue.appsCount[key] = appsCountInfoPerCluster[subQueue.queueName][key];
              });
            }
          }
        }
      }
    }
  }
};

const refreshStaleClusterInfo = async (path, staleClusterInfo) => {
  const length = subClustersConfig.Clusters.length;
  for (let i = 0; i < length; i++) {
    let response = {};
    let url = `${subClustersConfig.Clusters[i].RestServerUri}/${path}`;
    try {
      response = await axios({
        method: 'get',
        url: url,
        params: {
          subcluster: `${subClustersConfig.Clusters[i].subCluster}`,
        },
      });
    } catch (error) {
        logger.warn(`Failed to get information of ${subClustersConfig.Clusters[i].subCluster} from ${url}. error: ${error}`);
    }

    if (response && response.status === status('OK') && response.data) {
      let clusterName = subClustersConfig.Clusters[i].subCluster;
      staleClusterInfo[clusterName] = JSON.parse(JSON.stringify(response.data));
    } else {
      logger.warn(`Failed to refresh stale cluster information of ${subClustersConfig.Clusters[i].subCluster} from ${url}. error: ${response.status}`);
    }
  }
};

if (config.serviceName && config.serviceName.toLowerCase() === 'mt') {
  // Refresh the job list every 1 minute
  // If failed to refresh job list for 5 minutes will exit the service
  refreshStaleClusterInfo(`api/v1/virtual-clusters`, allVirtualClusters.Clusters);
  refreshStaleClusterInfo(`api/v1/virtual-clusters/scheduler`, allClusterSchedulerInfo.Clusters);
  refreshStaleClusterInfo(`api/v2/mp/jobs/appsCount`, allClusterAppsCountInfo.Clusters);

  setInterval(async function() {
    await refreshStaleClusterInfo(`api/v1/virtual-clusters`, allVirtualClusters.Clusters);
    await refreshStaleClusterInfo(`api/v1/virtual-clusters/scheduler`, allClusterSchedulerInfo.Clusters);
    await refreshStaleClusterInfo(`api/v2/mp/jobs/appsCount`, allClusterAppsCountInfo.Clusters);
    await addAppsCountInfoIntoClusterSchedulers();
  }, 480 * 1000);
}

const length = subClustersConfig.Clusters.length;
for (let i = 0; i < length; i++) {
  let clusterName = subClustersConfig.Clusters[i].subCluster;
  allVirtualClusters.Clusters[clusterName] = {};
  allClusterSchedulerInfo.Clusters[clusterName] = {};
  allClusterAppsCountInfo.Clusters[clusterName] = {};
}

// module exports
module.exports = {
  listVirtualClusters,
  listAllClusterSchedulers,
};
