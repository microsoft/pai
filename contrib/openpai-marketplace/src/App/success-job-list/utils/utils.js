import { isNil } from 'lodash';
import { DateTime } from 'luxon';

import { getHumanizedJobStateString } from './job';

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
 * @returns {number}
 */
export function getDuration(job) {
  if (!('_duration' in job)) {
    job._duration = (job.completedTime || Date.now()) - job.createdTime;
  }
  return job._duration;
}

function generateStatus(job) {
  job._statusText = getHumanizedJobStateString(job);
  if (job._statusText === 'Waiting') {
    job._statusIndex = 0;
  } else if (job._statusText === 'Running') {
    job._statusIndex = 1;
  } else if (job._statusText === 'Stopping') {
    job._statusIndex = 2;
  } else if (job._statusText === 'Succeeded') {
    job._statusIndex = 3;
  } else if (job._statusText === 'Failed') {
    job._statusIndex = 4;
  } else if (job._statusText === 'Stopped') {
    job._statusIndex = 5;
  } else {
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

export function printDateTime(dt) {
  if (
    dt > DateTime.utc().minus({ week: 1 }) &&
    dt < DateTime.utc().minus({ minute: 1 })
  ) {
    return `${dt.toRelative()}, ${dt.toLocaleString(DateTime.TIME_24_SIMPLE)}`;
  } else {
    return dt.toLocaleString(DateTime.DATETIME_MED);
  }
}

export function isJobV2(rawJobConfig) {
  return (
    !isNil(rawJobConfig.protocol_version) ||
    !isNil(rawJobConfig.protocolVersion)
  );
}

export function getTaskConfig(rawJobConfig, name) {
  if (rawJobConfig && rawJobConfig.taskRoles) {
    if (isJobV2(rawJobConfig)) {
      // v2
      return rawJobConfig.taskRoles[name];
    } else {
      // v1
      return rawJobConfig.taskRoles.find(x => x.name === name);
    }
  }
  return null;
}

export function parseGpuAttr(attr) {
  const res = [];
  for (let i = 0; attr !== 0; i++, attr >>= 1) {
    if ((attr & 1) === 1) {
      res.push(i);
    }
  }

  return res;
}

export const HISTORY_DISABLE_MESSAGE =
  'The job history was not enabled when deploying.';
export const HISTORY_API_ERROR_MESSAGE =
  'The job hisotry API is not healthy right now.';
