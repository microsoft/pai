import { isEmpty, flattenDeep } from "lodash";

export function mergeAppsInfo(appsFromResourceManager, appsFromRestServer) {
  var mergedAppsInfo = [];

  if (!(appsFromResourceManager && appsFromResourceManager.apps.app) 
      || !(appsFromRestServer && appsFromRestServer.mergedJobs)) {
    return mergedAppsInfo;
  }

  const appsCountFromRM = appsFromResourceManager.apps.app.length;
  for( var i = 0; i < appsCountFromRM; i++) {
    const rmApp = appsFromResourceManager.apps.app[i];
    var mergedAppInfo = rmApp;
    const appsCountFromRS = appsFromRestServer.mergedJobs.length;
    for (var j = 0; j < appsCountFromRS; j++) {
      const rsApp =  appsFromRestServer.mergedJobs[j];
      if (rsApp.appId === rmApp.id) {
        mergedAppInfo = Object.assign(rmApp, rsApp);
        break;
      }
    }
    mergedAppInfo.schedulingOrder = i;
    mergedAppsInfo.push(mergedAppInfo);
  } 
  return mergedAppsInfo; 
}

export function getSubQueue(obj, subCluster, vcName) {
  let queues = Object.values(obj);
  const subClusters = []
  queues.filter((queue)=> queue[subCluster]).forEach(queue=> {
    for(const queuename in queue){
      if (queuename === subCluster) {
        subClusters.push(queue[subCluster]);
        break; 
      }
    }
  })
  return subClusters;
}

export function getQueue(obj) {
  if (!obj) {
    return null;
  }
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const item = obj[key];
      if (key === "queues") {
        return item;
      }
      if (typeof item === "object") {
        return getQueue(item);
      }
    }
  }
}

export function setQueueNames(queues) {
  const queueNames = [];
  const queuesList = queues["queue"];
  if (!queuesList || !Array.isArray(queuesList)) {
    return queueNames;
  }

  queuesList.map((queue) => {
    if (queue["queues"] != undefined && isEmpty(queue["queues"])) {
      queueNames.push(setQueueNames(queue["queues"]));
    } else {
      queueNames.push(queue.queueName);
    }
  });
  return queueNames;
}

export function convertToToken(resource, max) {
  const token = max
    ? Math.max(resource.memory / 1024 / 6, resource.vCores / 2)
    : Math.min(resource.memory / 1024 / 6, resource.vCores / 2);
  return Number(Math.round(token));
}

export function handleResourceInfo(info) {
  if (info === undefined) {
    return `memory: 0Gi,vCores: 0`;
  } else {
    return `memory:${(info.memory / 1024).toFixed(0)}Gi,vCores: ${info.vCores}`;
  }
}

function _computer(infos) {
  if (!Array.isArray(infos)) return infos;
  if (!infos || infos === undefined) return;
  const resourcesAllocated = infos.reduce((userMemory = 0, info) => {
    if (!info || info === undefined) return;
    return userMemory + info.resourcesAllocated;
  }, 0);
  const resourcesConfigured = infos.reduce((configMemory = 0, info) => {
    if (!info || info === undefined) return;
    return configMemory + info.resourcesConfigured;
  }, 0);

  return {
    resourcesAllocated,
    resourcesConfigured,
  };
}

function _setComputedNumber(infos) {
  if (Array.isArray(infos[0])) return;
  return infos.map(({ resourcesAllocated = 0, resourcesConfigured = 0 }) => {
    const resUser = Number(
      Math.max(
        resourcesAllocated.memory / 6 / 1024,
        resourcesAllocated.vCores / 2
      ).toFixed(0)
    );
    const resConfigUred = Number(
      Math.min(
        resourcesConfigured.memory / 6 / 1024,
        resourcesConfigured.vCores / 2
      ).toFixed(0)
    );
    return {
      resourcesAllocated: resUser,
      resourcesConfigured: resConfigUred,
    };
  });
}

export function computeTotalNumber(infos) {
  if (!Array.isArray(infos)) {
    return infos;
  } else {
    if (infos.length > 1) {
      const resourcesAllocated = infos.reduce((userMemory = 0, info) => {
        return userMemory + info.resourcesAllocated;
      }, 0);
      const resourcesConfigured = infos.reduce((uservCores = 0, info) => {
        return uservCores + info.resourcesConfigured;
      }, 0);

      return {
        resourcesAllocated,
        resourcesConfigured,
      };
    } else {
      return infos[0];
    }
  }
}

export function filterEmptyLabel(infos) {
  if (Array.isArray(infos)) {
    return infos
      .filter((info) => info.effectiveMaxResource)
      .filter(
        (info) =>
          info.effectiveMaxResource["memory"] > 0 ||
          info.effectiveMaxResource["vCores"] > 0
      );
  }
}

export function filterUserResource(
  capacityAndResourceInfo,
  PartitionRecoureds,
) {
  return PartitionRecoureds.filter(
    (r) => r.partitionName.charAt(0) !== "*" && r.partitionName !== ""
  ).filter(
    (r) =>
      capacityAndResourceInfo.filter((cr) => cr.label === r.partitionName)[0]
  );
}

export function filterResource(
  capacityAndResourceInfo,
  PartitionRecoureds,
  ){
  let recoureds = capacityAndResourceInfo.filter(
    (r) => r.label.charAt(0) !== "*"
  );
  return recoureds.filter(
    (r) =>
    PartitionRecoureds.filter((cr) => r.effectiveMaxResource.memory > 0 && r.effectiveMaxResource.vCores > 0 && cr.partitionName === r.label)[0]
  );
}

function _getcomputeres(queues) {
  if (Array.isArray(queues)) {
    return flattenDeep(
      queues.map((queue) =>
        _setComputedNumber(filterEmptyLabel(queue.capacityAndResourceInfo))
      )
    );
  } else if (queues.queueName === "harvestAZAP") {
    return [
      {
        resourcesAllocated: 0,
        resourcesConfigured: 0,
      },
    ];
  }
}

export function volumeStatistic(vcs, flag, virtualCluster) {
  let singleArr = [];
  let totalArr = [];
  let curQueues = [];
  if (!flag) {
    const schedulerInfo = getQueue(vcs);
    vcs = schedulerInfo["queue"]
  }
  for (const k in vcs) {
    const vc = vcs[k];
    const queue = getQueue(vc);
    curQueues.push(queue != undefined ? [...queue["queue"]] : [vc]);
  }
  const arr = curQueues.map((queue, i) => {
    return _getcomputeres(queue);
  });
  singleArr = arr.map((a) => _computer(a));
  totalArr.push(computeTotalNumber(singleArr));
  return [singleArr, totalArr, virtualCluster];
}

export function setTotalVolumeStatistics(subCluster) {
  let arrs = [];
  arrs.push(_computer(_getcomputeres(subCluster)));
  return arrs;
}

export function findQueueAndSubQueue(queues, curName) {
  if (!queues) return;
  let queue = null;
  let subQueue = null;
  let curQueues = queues["queue"] || queues;
  let index = (queues["queue"] && queues["queue"].length) || queues.length || 1;
  while (!queue && index >= 0) {
    if (!Array.isArray(curQueues) && curQueues.queueName === curName) {
      return [curQueues, curQueues];
    }
    let queueList = [];
    if (Array.isArray(curQueues)) {
      queueList = curQueues;
    } else if (curQueues["queues"]) {
      queueList = curQueues["queues"]["queue"];
      subQueue = curQueues;
    }
    const [findQueue] = queueList.filter(queue => queue.queueName === curName);
    if (findQueue) {
      queue = findQueue;
      return [queue, subQueue || queue];
    } else {
      curQueues = Array.isArray(queues) ? queues[index - 1] : queues["queue"][index - 1];
      subQueue = curQueues;
      index -= 1;
    }
  }
  if (index < 0 && !queue) {
    return [];
  }
}

export function isHas(dataList, selected) {
  return dataList.hasOwnProperty(selected);
}

let prevNode = null;
let prevParentNode = null;
export function handleDom(node, isSearch) {
  let curNode = node;
  let parentNode = null;
  if (isSearch) parentNode = node;
  while (curNode && !parentNode) {
    if (curNode.className.search("nav-li") !== -1) parentNode = curNode;
    curNode = curNode.parentNode;
  }
  if (prevNode && prevParentNode) {
    prevNode.style.color = "#0071bc";
    prevNode.style.fontWeight = 400;
    prevParentNode.style.backgroundColor = "";
    prevNode = null;
    prevParentNode = null;
  }

  if (!isSearch) {
    node.style.color = "#003F6A";
    node.style.fontWeight = 600;
  }

  parentNode.style.backgroundColor = "#DADADA";
  prevParentNode = parentNode;
  prevNode = node;
}

function _setNodeBg(node, clear) {
  const bgC = $(node).css("backgroundColor");
  if (bgC === "rgb(218, 218, 218)") {
    $(node).css("backgroundColor", "#DADADA");
  } else {
    clear
      ? $(node).css("backgroundColor", "")
      : $(node).css("backgroundColor", "#F4F4F4");
  }
}

export function hoverEvent(params) {
  $("ul").on("mouseenter", "li", function () {
    _setNodeBg(this);
  });
  $("ul").on("mousemove", "li", function () {
    _setNodeBg(this);
  });
  $("ul").on("mouseout", "li", function () {
    _setNodeBg(this, "clear");
  });
}

export function setTruncatedString(str, number) {
  if (typeof str !== "string") return;
  if (str.length > number) {
    return str.slice(0, number) + "...";
  } else {
    return str;
  }
}

export function group(array, subGroupLength) {
  let index = 0;
  let newArray = [];
  while (index < array.length) {
    newArray.push(array.slice(index, (index += subGroupLength)));
  }
  return newArray;
}

function action(chart, type, name) {
  if (type) {
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: 0,
      name: name,
    });
    chart.dispatchAction({ type: "hideTip" });
  }else {
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      name: name
    })
    chart.dispatchAction({
      type: "showTip",
      seriesIndex: 0,
      name: name
    })
  }
}

export const dispatch = (chart, type) => (name) => action(chart, type, name);
