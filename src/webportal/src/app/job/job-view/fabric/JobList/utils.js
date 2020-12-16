import {DateTime} from "luxon";

const webportalConfig = require('../../../../config/webportal.config.js');

/**
 * @returns {Date}
 */
export function getModified(job) {
  if (!('_modified' in job)) {
    job._modified = new Date(job.completedTime || job.createdTime);
  }
  return job._modified;
}

/**
 * @returns {Date}
 */
export function getStarted(job) {
  if (!('_started' in job)) {
    job._started = new Date(job.createdTime);
  }
  return job._started;
}

/**
 * @returns {string}
 */
export function getFinished(job) {
  if (!('_finished' in job)) {
    job._finished = new Date(job.completedTime || job.createdTime);
  }
 return (job.completedTime ? appendTimeZoneToDateTime(DateTime.fromJSDate(job._finished), DateTime.DATETIME_MED_WITH_SECONDS) : 'N/A');
}

/**
 * @returns {number}
 */
export function getDuration(job) {
  if (!('_duration' in job)) {
    job._duration = (job.completedTime || Date.now()) - job.createdTime;
  }
  return job._duration;
}

function generateStatus(job) {
  if (job.state === 'WAITING') {
    if (job.executionType === 'START') {
      job._statusText = 'Waiting';
      job._statusIndex = 0;
    } else {
      job._statusText = 'Stopping';
      job._statusIndex = 2;
    }
  } else if (job.state === 'RUNNING') {
    if (job.executionType === 'START') {
      job._statusText = 'Running';
      job._statusIndex = 1;
    } else {
      job._statusText = 'Stopping';
      job._statusIndex = 2;
    }
  } else if (job.state === 'SUCCEEDED') {
    job._statusText = 'Succeeded';
    job._statusIndex = 3;
  } else if (job.state === 'FAILED') {
    job._statusText = 'Failed';
    job._statusIndex = 4;
  } else if (job.state === 'STOPPED' || job.state === 'INCOMPLETED') {
    job._statusText = 'Stopped';
    job._statusIndex = 5;
  } else if (job.state === 'ARCHIVED') {
    job._statusText = 'Archived';
    job._statusIndex = 6;
  } else if (job.state === 'PREPARING') {
    job._statusText = 'Preparing';
    job._statusIndex = 7;
  } else if (job.state === 'FINISHING') {
    job._statusText = 'Finishing';
    job._statusIndex = 8;
  } else {
    job._statusText = 'Unknown';
    job._statusIndex = -1;
  }
}

/**
 * @returns {string}
 */
export function getStatusText(job) {
  if (!('_statusText' in job)) {
    generateStatus(job);
  }
  return job._statusText;
}

/**
 * @returns {number}
 */
export function getStatusIndex(job) {
  if (!('_statusIndex' in job)) {
    generateStatus(job);
  }
  return job._statusIndex;
}

export function getSubClustersList() {
  let dataCenter = webportalConfig.dataCenter;
  let subClustersNum = webportalConfig.subClustersNum;
  // eslint-disable-next-line no-array-constructor
  let subClusters = new Array();
  for (let i= 0; i < subClustersNum; i++) {
    subClusters[i] = dataCenter + '-'+ i;
  }
  return subClusters;
}

export function appendTimeZoneToDateTime(dateTime, dateTimeformatOptions) {
  return dateTime.toLocaleString(dateTimeformatOptions) + ' ' + dateTime.toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS).split(' ').pop();
}
