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
'use strict';

let moduleServiceJobPrefix = ['JD_', 'MPJD_'];
let groupIdPrefix = 'GID-';

// we define group id marked as GID-xxx_ at the beginning of general job name
function getGroupId(jobName) {
  if (jobName.startsWith(groupIdPrefix)) {
    let groupId = jobName.split('_')[0].slice(groupIdPrefix.length);
    return groupId;
  }
  return null;
}

function getGroupIdByAppTagsStr(appTagsStr) {
  let tags = appTagsStr.split(',');
  return getGroupIdByAppTagsArray(tags);
}

function getGroupIdByAppTagsArray(appTagsArray) {
  for (let tag of appTagsArray) {
    if (tag.toUpperCase().startsWith(groupIdPrefix)) {
      let groupId = tag.split('_')[0].slice(groupIdPrefix.length);
      return groupId;
    }
  }
  return null;
}

function removeGrouIdPrefix(jobName) {
  if (jobName.startsWith(groupIdPrefix)) {
    let name = jobName.slice(jobName.indexOf('_') + 1);
    return name;
  }
  return jobName;
}

function isJobWrapper(jobName) {
  for (let i = 0; i < moduleServiceJobPrefix.length; i++) {
    if (jobName.startsWith(moduleServiceJobPrefix[i])) {
      return true;
    }
  }
  return false;
}

// module exports
module.exports = {
  getGroupId,
  getGroupIdByAppTagsStr,
  getGroupIdByAppTagsArray,
  isJobWrapper,
  removeGrouIdPrefix,
  groupIdPrefix,
};
