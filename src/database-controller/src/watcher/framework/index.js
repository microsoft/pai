// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

require('module-alias/register');
require('dotenv').config();
const fetch = require('node-fetch');
const AsyncLock = require('async-lock');
const { default: PQueue } = require('p-queue');
require('@dbc/common/init');
const logger = require('@dbc/common/logger');
const { getFrameworkInformer } = require('@dbc/common/k8s');
const { alwaysRetryDecorator } = require('@dbc/common/util');
const config = require('@dbc/watcher/framework/config');

// Here, we use AsyncLock to control the concurrency of frameworks with the same name;
// e.g. If framework A has event1, event2, and event3, we use AsyncLock
// to ensure they will be delivered to write-merger in order.
// In the same time, we use PQueue to control the concurrency of frameworks with different names;
// e.g. If there are framework 1 ~ framework 30000, only some of them can be processed concurrently.
const lock = new AsyncLock({ maxPending: Number.MAX_SAFE_INTEGER });
const queue = new PQueue({ concurrency: config.maxRpcConcurrency });

async function synchronizeFramework(eventType, apiObject) {
  const res = await fetch(
    `${config.writeMergerUrl}/api/v1/watchEvents/${eventType}`,
    {
      method: 'POST',
      body: JSON.stringify(apiObject),
      headers: { 'Content-Type': 'application/json' },
      timeout: config.writeMergerConnectionTimeoutSecond * 1000,
    },
  );
  if (!res.ok) {
    throw new Error(`Request returns a ${res.status} error.`);
  }
}

const eventHandler = (eventType, apiObject) => {
  /*
    framework name-based lock + always retry
  */
  const receivedTs = new Date().getTime();
  const state =
    apiObject.status && apiObject.status.state
      ? apiObject.status.state
      : 'Unknown';
  logger.info(
    `Event type=${eventType} receivedTs=${receivedTs} framework=${apiObject.metadata.name} state=${state} received.`,
  );
  lock.acquire(apiObject.metadata.name, () => {
    return queue.add(
      alwaysRetryDecorator(
        () => synchronizeFramework(eventType, apiObject),
        `Sync to write merger type=${eventType} receivedTs=${receivedTs} framework=${apiObject.metadata.name} state=${state}`,
      ),
    );
  });
};

const informer = getFrameworkInformer();

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
