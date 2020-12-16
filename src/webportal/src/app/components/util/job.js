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
"use strict";

import {get, isNil} from 'lodash';
import {Interval, DateTime} from 'luxon';

export function getHumanizedJobStateString(job) {
  return getStateString(job.state, job.executionType);
}

export function getHumanizedJobAttemptStateString(job) {
  return getStateString(job.attemptState, job.executionType);
}

function getStateString(state, executionType) {
  let hjss = '';
  if (state === 'JOB_NOT_FOUND') {
    hjss = 'N/A';
  } else if (state === 'WAITING') {
    if (executionType === 'STOP') {
      hjss = 'Stopping';
    } else {
      hjss = 'Waiting';
    }
  } else if (state === 'RUNNING') {
    if (executionType === 'STOP') {
      hjss = 'Stopping';
    } else {
      hjss = 'Running';
    }
  } else if (state === 'SUCCEEDED') {
    hjss = 'Succeeded';
  } else if (state === 'FAILED') {
    hjss = 'Failed';
  } else if (state === 'STOPPED' || state === 'INCOMPLETED') {
    hjss = 'Stopped';
  } else if (state === 'ARCHIVED') {
    hjss = 'Archived';
  } else if (state === 'PREPARING') {
    hjss = 'Preparing';
  } else if (state === 'FINISHING') {
    hjss = 'Finishing';
  } else {
    hjss = 'Unknown';
  }
  return hjss;
}

export function getJobDurationString(jobInfo) {
  return getTimeDurationString(get(jobInfo, 'createdTime'), get(jobInfo, 'completedTime'));
}


export function getAttemptDurationString(jobInfo) {
  return getTimeDurationString(get(jobInfo, 'appLaunchedTime'), get(jobInfo, 'appCompletedTime'));
}

export function getJobModifiedTime(job) {
  const modified = job.completedTime || job.createdTime;
  if (!isNil(modified)) {
    return DateTime.fromMillis(modified);
  } else {
    return null;
  }
}

export function getJobModifiedTimeString(job) {
  const time = getJobModifiedTime(job);
  if (!isNil(time)) {
    return time.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS);
  } else {
    return 'N/A';
  }
}

function getTimeDuration(startTime, endTime) {
  const start = startTime && DateTime.fromMillis(startTime);
  const end = endTime && DateTime.fromMillis(endTime);
  if (start) {
    return Interval.fromDateTimes(start, end || DateTime.utc()).toDuration(['days', 'hours', 'minutes', 'seconds']);
  } else {
    return null;
  }
}

function getTimeDurationString(startTime, endTime) {
  const dur = getTimeDuration(startTime, endTime);
  if (!isNil(dur)) {
    if (dur.days > 0) {
      return dur.toFormat(`d'd' h'h' m'm' s's'`);
    } else if (dur.hours > 0) {
      return dur.toFormat(`h'h' m'm' s's'`);
    } else if (dur.minutes > 0) {
      return dur.toFormat(`m'm' s's'`);
    } else {
      return dur.toFormat(`s's'`);
    }
  } else {
    return 'N/A';
  }
}
