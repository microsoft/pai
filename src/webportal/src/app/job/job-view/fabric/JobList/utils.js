import { getHumanizedJobStateString } from '../../../../components/util/job';

/**
 * @returns {Date}
 */
export function getSubmissionTime(job) {
  if (!('_submissionTime' in job)) {
    job._submissionTime = new Date(job.submissionTime);
  }
  return job._submissionTime;
}

/**
 * @returns {number}
 */
export function getDuration(job) {
  if (!('_duration' in job)) {
    job._duration = (job.completedTime || Date.now()) - job.submissionTime;
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
