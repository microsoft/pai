import {isEmpty} from 'lodash';
import {checkUserPermission, checkPermission} from './util';

const username = cookies.get('user');

export function getCurrentDate(newDate, text) {
  let date = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  let hours = newDate.getHours();
  let seconds = newDate.getMinutes();
  return `${month}/${date}/${year} ${hours}:${seconds < 10 ? '0' + seconds : seconds} (${text})`;
}

function setFailed(failedVc, queueName, virtualCluster, count) {
  if (failedVc[queueName] != undefined) {
    if (failedVc[queueName][virtualCluster] != undefined) {
      failedVc[queueName][virtualCluster]['count'] += count;
    } else {
      failedVc[queueName][virtualCluster] = {count: count};
    }
  } else {
    failedVc[queueName] = {
      [virtualCluster]: {
      'count': count
      }
    };
  }
  return failedVc;
}

function calculateJobTypeCount(jobStatusCount, appsCount, queueName, virtualCluster) {
  Object.keys(appsCount).forEach((status) => {
    switch (status) {
      case 'RUNNING':
        jobStatusCount.running += appsCount[status];
        break;
      case 'WAITTING':
        jobStatusCount.waiting += appsCount[status];
        break;
      case 'SUCCEEDED':
        jobStatusCount.succeeded += appsCount[status];
        break;
      case 'SUCCEEDED_24':
        jobStatusCount.succeededToday += appsCount[status];
        break;
      case 'FAILED':
        jobStatusCount.failed += appsCount[status];
        if (appsCount[status] > 0) {
          jobStatusCount.failedVc = setFailed(jobStatusCount.failedVc, queueName, virtualCluster, appsCount[status]);
        }
        break;
      case 'FAILED_24':
        jobStatusCount.failedToday += appsCount[status];
        if (appsCount[status] > 0) {
          jobStatusCount.failedVcToday = setFailed(jobStatusCount.failedVcToday, queueName, virtualCluster, appsCount[status]);
        }
        break;
      case 'STOPPED':
        jobStatusCount.stopped += appsCount[status];
        break;
      case 'STOPPED_24':
        jobStatusCount.stoppedToday += appsCount[status];
        break;
      default:
        break;
    }
  });
  return jobStatusCount;
}

export function getJobStatus(statusScheduler, userGroupList) {
    let jobStatusCount = {
      waiting: 0,
      running: 0,
      stopped: 0,
      stoppedToday: 0,
      failed: 0,
      failedToday: 0,
      succeeded: 0,
      succeededToday: 0,
      failedVc: {},
      failedVcToday: {},
    };

    if (!isEmpty(statusScheduler)) {
      Object.keys(statusScheduler).forEach((group) => {
        Object.keys(statusScheduler[group]).forEach((virtualCluster) => {
          const vc = statusScheduler[group][virtualCluster];
          if (checkUserPermission(username, userGroupList, virtualCluster, statusScheduler) && checkPermission({username: username, userGrouplist: userGroupList, vc: vc, skipAllAllowed: false}) ) {
            if (statusScheduler[group][virtualCluster]['queues']) {
              const queue = statusScheduler[group][virtualCluster]['queues']['queue'];
              queue.forEach((item, index) => {
                if (item.queues) {
                  const subQueue = item['queues']['queue'];
                  subQueue.forEach((subQueItem, idx) => {
                    if (subQueItem['appsCount']) {
                      jobStatusCount = calculateJobTypeCount(jobStatusCount, subQueItem['appsCount'], subQueItem['queueName'], virtualCluster);
                    }
                  });
                } else if (item['appsCount']) {
                  jobStatusCount = calculateJobTypeCount(jobStatusCount, item['appsCount'], item['queueName'], virtualCluster);
                }
              });
            } else if (statusScheduler[group][virtualCluster]['appsCount']) {
              const subDetail = statusScheduler[group][virtualCluster];
              if (subDetail['appsCount']) {
                jobStatusCount = calculateJobTypeCount(jobStatusCount, subDetail['appsCount'], subDetail['queueName'], virtualCluster);
              }
          }
        }
      });
    });
  }
  return jobStatusCount;
}

export function applyDrawingData(finishData) {
  let applyDrawingData = {};
  Object.keys(finishData).map((virtualcluster, index) => {
    const findQueue = Object.keys(finishData[virtualcluster]).find((subcluster) => {
      return finishData[virtualcluster][subcluster]['queues'];
    });
    if (findQueue) {
      Object.keys(finishData[virtualcluster]).map((subcluster, index) => {
        if (finishData[virtualcluster][subcluster]['queues']) {
          let vcMoreDetail = finishData[virtualcluster][subcluster]['queues']['queue'];
          vcMoreDetail.map((item, index) => {
              if (applyDrawingData[item.queueName] !== undefined) {
                applyDrawingData[item.queueName][subcluster] = item;
              } else {
                applyDrawingData[item.queueName] = {[subcluster]: item};
              }
          });
        } else {
          if (applyDrawingData[virtualcluster] !== undefined) {
            applyDrawingData[virtualcluster][subcluster] = finishData[virtualcluster][subcluster];
          } else {
            applyDrawingData[virtualcluster] = {[subcluster]: finishData[virtualcluster][subcluster]};
          }
        }
      });
    } else {
      applyDrawingData[virtualcluster] = finishData[virtualcluster];
    }
  });
  return applyDrawingData;
}
