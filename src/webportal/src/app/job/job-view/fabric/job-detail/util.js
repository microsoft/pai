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

import { isNil } from 'lodash';
import { DateTime } from 'luxon';

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

export function parseGpuAttr(attr) {
  const res = [];
  for (let i = 0; attr !== 0; i++, attr >>= 1) {
    if ((attr & 1) === 1) {
      res.push(i);
    }
  }

  return res;
}

export function isJobV2(rawJobConfig) {
  return (
    !isNil(rawJobConfig.protocol_version) ||
    !isNil(rawJobConfig.protocolVersion)
  );
}

export function isClonable(rawJobConfig) {
  // disable clone for old yaml job
  if (isNil(rawJobConfig)) {
    return false;
  } else if (!isNil(rawJobConfig.protocol_version)) {
    return false;
  } else {
    return true;
  }
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

export const HISTORY_DISABLE_MESSAGE =
  'The job history was not enabled when deploying.';
export const HISTORY_API_ERROR_MESSAGE =
  'The job hisotry API is not healthy right now.';
