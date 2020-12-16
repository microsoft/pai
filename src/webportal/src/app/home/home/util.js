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

import randomColor from 'randomcolor';
import {statusColor} from '../../components/theme';

const webportalConfig = require('../../config/webportal.config.js');

export const DEFAULT_COLOR = statusColor.succeeded;

export function getVirtualClusterColor(name, info) {
  if (!info || !info.dedicated) {
    return DEFAULT_COLOR;
  } else {
    return randomColor({seed: name, luminosity: 'bright'});
  }
}

export function getSubClusters() {
  let configuredSubClusters = webportalConfig.subClusters;
  let subClusters = new Array();
  if (configuredSubClusters != undefined) {
    return configuredSubClusters.split(',');
  }
  return subClusters;
}

export function isValidClusterParameter(requiredSubClusterParameter) {
  const subClusters = getSubClusters();
  const params = new URLSearchParams(window.location.search);
  const subCluster = params.get('subCluster');
  if (subCluster != null && subClusters.length > 0) {
    return subClusters.includes(subCluster);
  } else if (requiredSubClusterParameter && subCluster == null) {
    return false;
  }
  return true;
}

export function parseVCNameHashParameters() {
  var currentHash = window.location.hash;
  let labels = {};
  var parts = currentHash.split('#');
  for (var i = 0; i < parts.length; i++) {
      if (parts[i].length > 1) {
          var keyValuePair = parts[i].split('=');
          labels[keyValuePair[0]] = keyValuePair[1];
      }
  }
  return labels['vcName'];
}

export function checkPermission({username: username, userGrouplist: userGrouplist, vc: vc, skipAllAllowed: skipAllAllowed=true}) {
  const queueACL = vc.submitApplicationAcls ? vc.submitApplicationAcls : vc.submitApplicationsAcl;
  var result = false;

  // If the queue's acl is '*', skip this queue to avoid confusing users.
  if (queueACL === '*') {
    return (skipAllAllowed ? true : false);
  }

  if ('true' === cookies.get('admin') && (queueACL !== '*')) {
    return true;
  }

  // If failed to retrieve user's group from RM, return true
  if (!(userGrouplist && userGrouplist.groups && userGrouplist.groups.length > 0)) {
    return true;
  }

  if (queueACL) {
    const userGroupStrings = queueACL.trim().split(' ');
    if (userGroupStrings[0] != null) {
      const users = userGroupStrings[0].split(',');
      if (users.includes(username)) {
        result = true;
        return true;
      }
    }

    if (!result && userGroupStrings[1] != null) {
      const groups = userGroupStrings[1].split(',');
      userGrouplist.groups.some((function(group) {
          if (groups.includes(group.groupname)) {
            result = true;
            return true;
          }
      }));
    }
  } else {
    result = true;
  }

  if (vc.hasOwnProperty('queues')) {
    var queues = vc.queues.queue
    for (let i = 0; i < queues.length; i++) {
      var hasPermission = checkPermission({username: username, userGrouplist: userGrouplist, vc: queues[i], skipAllAllowed: false});
      if (hasPermission) {
        result = true;
        break;
      }
    }
  }
  
  return result;
}

export function checkUserPermission(username, userGrouplist, subClusterOrVirtualCuster, aggregatedVirtualClusters) {
  var result = false;
  const vcOrScList = (aggregatedVirtualClusters && aggregatedVirtualClusters[subClusterOrVirtualCuster])? aggregatedVirtualClusters[subClusterOrVirtualCuster] : "";
  
  // if the vcOrScList is not retrieved yet
  if (Object.keys(vcOrScList).length <= 0 ) {
    return true;
  }

  if (!vcOrScList.hasOwnProperty('scheduler')) {
    Object.keys(vcOrScList).some((function(item) {
      var hasPermission = checkPermission({username: username, userGrouplist: userGrouplist, vc: vcOrScList[item], skipAllAllowed:false});
      if (hasPermission) {
        result = true;
        return true;
      }
    }));
  } else {
    var queues = vcOrScList.scheduler.schedulerInfo.queues.queue;
    for (let count = 0; count < queues.length; count++) {
      var hasPermission = checkPermission({username: username, userGrouplist: userGrouplist, vc:queues[count], skipAllAllowed:false});
      if (hasPermission) {
        result = true;
        break;
      }
    }
  }
  return result;
}

export function getVirtualCluster2Subclusters(aggregatedVirtualClusters, subClustersList) {
  if (!aggregatedVirtualClusters) {
    return null;
  }

  let virtualCluster2Subclusters = {};
  Object.keys(aggregatedVirtualClusters.Clusters).map((subCluster, index) => {
  const virtualClusters  = aggregatedVirtualClusters.Clusters[subCluster];
    Object.keys(virtualClusters).map( (vc, index) => {
      if (!virtualCluster2Subclusters.hasOwnProperty(vc) && subClustersList.includes(subCluster)) {
        virtualCluster2Subclusters[vc] = {};
      } 
      if (virtualCluster2Subclusters[vc] && subClustersList.includes(subCluster)) {
        virtualCluster2Subclusters[vc][subCluster] = {};
        virtualCluster2Subclusters[vc][subCluster].submitApplicationAcls = virtualClusters[vc].submitApplicationAcls;
      }
    });
  });

  const orderedVirtualCluster2Subclusters = {};
  Object.keys(virtualCluster2Subclusters).sort(function(a,b){
      return a.toLowerCase().localeCompare(b.toLowerCase());
    }).forEach(function(key) {
    orderedVirtualCluster2Subclusters[key] = virtualCluster2Subclusters[key];
  });
  return orderedVirtualCluster2Subclusters;
}

export function getVirtualClusterScheduler2Subclusters(allClusterSchedulerInfo, subClustersList) {
  if (!allClusterSchedulerInfo) {
    return null;
  }

  let virtualCluster2Subclusters = {
    'virtualClusters': {},
  };

  Object.keys(allClusterSchedulerInfo.Clusters).map((subCluster, index) => {
    let virtualClusters = [];
    if (allClusterSchedulerInfo.Clusters[subCluster].scheduler && allClusterSchedulerInfo.Clusters[subCluster].scheduler.schedulerInfo.queues) {
      virtualClusters = allClusterSchedulerInfo.Clusters[subCluster].scheduler.schedulerInfo.queues.queue;
    }

    for (let i = 0; i < virtualClusters.length; i++) {
      let vcName = virtualClusters[i].queueName;
      if (!virtualCluster2Subclusters.virtualClusters.hasOwnProperty(vcName) && subClustersList.includes(subCluster)) {
        virtualCluster2Subclusters.virtualClusters[vcName] = {};
      }
      if (virtualCluster2Subclusters.virtualClusters.hasOwnProperty(vcName) && subClustersList.includes(subCluster)) {
        virtualCluster2Subclusters.virtualClusters[vcName][subCluster] = {};
        virtualCluster2Subclusters.virtualClusters[vcName][subCluster] = JSON.parse(JSON.stringify(virtualClusters[i]));
      }
    }
  });

  const orderedVirtualCluster2Subclusters = {
    'virtualClusters': {},
  };
  Object.keys(virtualCluster2Subclusters.virtualClusters).sort(function(a, b) {
      return a.toLowerCase().localeCompare(b.toLowerCase());
    }).forEach(function(key) {
    orderedVirtualCluster2Subclusters.virtualClusters[key] = virtualCluster2Subclusters.virtualClusters[key];
  });
  return orderedVirtualCluster2Subclusters;
}
