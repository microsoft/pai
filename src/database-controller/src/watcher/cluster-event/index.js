// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

require('module-alias/register');
require('dotenv').config();
const AsyncLock = require('async-lock');
const _ = require('lodash');
const DatabaseModel = require('openpaidbsdk');
const { default: PQueue } = require('p-queue');
const interval = require('interval-promise');
require('@dbc/common/init');
const logger = require('@dbc/common/logger');
const { getEventInformer } = require('@dbc/common/k8s');
const { alwaysRetryDecorator } = require('@dbc/common/util');
const disk = require('diskusage');
const config = require('@dbc/watcher/cluster-event/config');

// Here, we use AsyncLock to control the concurrency of events with the same uid;
// e.g. If one event has ADDED, MODIFED, and MODIFED incidents, we use AsyncLock
// to ensure they will be delivered to write-merger in order.
// In the same time, we use PQueue to control the concurrency of events with different uid;
// e.g. If there are event 1 ~ event 30000, only some of them can be processed concurrently.
const lock = new AsyncLock({ maxPending: Number.MAX_SAFE_INTEGER });
const queue = new PQueue({ concurrency: config.maxRpcConcurrency });
const databaseModel = new DatabaseModel(
  config.dbConnectionStr,
  config.maxDatabaseConnection,
);

async function synchronizeEvent(eventType, apiObject) {
  // query db instead
  const uid = apiObject.metadata.uid;
  const names = apiObject.involvedObject.name.split('-');

  const obj = {
    uid: uid,
    frameworkName: names[0],
    podUid: apiObject.involvedObject.uid,
    taskroleName: names[1],
    taskName: apiObject.involvedObject.name,
    taskIndex: parseInt(names[2]),
    type: apiObject.type,
    reason: apiObject.reason,
    message: apiObject.message,
    firstTimestamp: apiObject.firstTimestamp,
    lastTimestamp: apiObject.lastTimestamp,
    count: apiObject.count,
    sourceComponent: _.get(apiObject, 'source.component', null),
    sourceHost: _.get(apiObject, 'source.host', null),
    event: JSON.stringify(apiObject),
  };

  databaseModel.FrameworkEvent.upsert(obj, { where: { uid: uid } });
}

const eventHandler = (eventType, apiObject) => {
  /*
    event uid-based lock + always retry
  */
  const receivedTs = new Date().getTime();
  const involvedObjKind = apiObject.involvedObject.kind;
  const involvedObjName = apiObject.involvedObject.name;
  const uid = apiObject.metadata.uid;
  if (
    involvedObjKind === 'Pod' &&
    /^[a-z0-9]{32}-[A-Za-z0-9._~]+-[0-9]+$/.test(involvedObjName)
  ) {
    logger.info(
      `Cluster event type=${eventType} receivedTs=${receivedTs} uid=${uid} involvedObjKind=${involvedObjKind} involvedObjName=${involvedObjName} received.`,
    );
    lock.acquire(uid, () => {
      return queue.add(
        alwaysRetryDecorator(
          () => synchronizeEvent(eventType, apiObject),
          `Sync to database type=${eventType} receivedTs=${receivedTs} uid=${uid} involvedObjKind=${involvedObjKind} involvedObjName=${involvedObjName}`,
        ),
      );
    });
  } else {
    logger.info(
      `Cluster Event type=${eventType} receivedTs=${receivedTs} uid=${uid} involvedObjKind=${involvedObjKind} involvedObjName=${involvedObjName} received but ignored.`,
    );
  }
};

async function assertDiskUsageHealthy() {
  try {
    const { available, total } = await disk.check(config.diskPath);
    const currentUsage = ((total - available) / total) * 100;
    logger.info(`Current internal storage usage is ${currentUsage}% .`);
    if (currentUsage > config.maxDiskUsagePercent) {
      logger.error(
        `Internal storage usage exceeds ${config.maxDiskUsagePercent}%, exit.`,
        function() {
          process.exit(1);
        },
      );
    }
  } catch (err) {
    logger.error(`Check disk usage fails, details: ${err}`, function() {
      process.exit(1);
    });
  }
}

function startInformer() {
  const informer = getEventInformer();

  informer.on('add', apiObject => {
    eventHandler('ADDED', apiObject);
  });
  informer.on('update', apiObject => {
    eventHandler('MODIFED', apiObject);
  });
  informer.on('delete', apiObject => {
    eventHandler('DELETED', apiObject);
  });
  informer.on('error', err => {
    // If any error happens, the process should exit, and let Kubernetes restart it.
    logger.error(err, function() {
      process.exit(1);
    });
  });
  informer.start();
}

function startDiskCheck() {
  interval(assertDiskUsageHealthy, config.diskCheckIntervalSecond * 1000, {
    stopOnError: false,
  });
}

async function main() {
  await assertDiskUsageHealthy();
  startInformer();
  startDiskCheck();
}

main();
