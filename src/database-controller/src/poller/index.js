// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

require('module-alias/register');
require('dotenv').config();
const AsyncLock = require('async-lock');
const { default: PQueue } = require('p-queue');
const { Sequelize } = require('sequelize');
const Op = Sequelize.Op;
const DatabaseModel = require('openpaidbsdk');
const logger = require('@dbc/common/logger');
const {
  Snapshot,
  AddOns,
  synchronizeRequest,
} = require('@dbc/common/framework');
const interval = require('interval-promise');
const config = require('@dbc/poller/config');
const fetch = require('node-fetch');
const { deleteFramework } = require('@dbc/common/k8s');
// Here, we use AsyncLock to control the concurrency of frameworks with the same name;
// e.g. If framework A has request1, request2, and request3, we use AsyncLock
// to ensure they will be processed in order.
// We also set maxPending to 1 to avoid the queue to be too long.
// If any framework is not synced/deleted, it will be synced/deleted in the next polling round.
// We don't need to explicitly retry on error.
const lock = new AsyncLock({ maxPending: 1 });
// In the same time, we use PQueue to control the concurrency of frameworks with different names;
// e.g. If there are framework 1 ~ framework 30000, only some of them can be processed concurrently.
const queue = new PQueue({ concurrency: config.maxRpcConcurrency });
const databaseModel = new DatabaseModel(
  config.dbConnectionStr,
  config.maxDatabaseConnection,
);

async function postMockedDeleteEvent(snapshot) {
  await fetch(`${config.writeMergerUrl}/api/v1/watchEvents/DELETED`, {
    method: 'POST',
    body: snapshot.getString(),
    headers: { 'Content-Type': 'application/json' },
    timeout: config.writeMergerConnectionTimeoutSecond * 1000,
  });
}

function deleteHandler(snapshot, pollingTs) {
  const frameworkName = snapshot.getName();
  logger.info(
    `Will delete framework ${frameworkName}. PollingTs=${pollingTs}.`,
  );
  lock
    .acquire(frameworkName, () =>
      queue.add(async () => {
        try {
          // We only delete framework here, ignoring the job add-ons.
          // Because most job add-ons are patched in the creation time, so they will by deleted automatically.
          // If some add-ons are not successfully patched, they will be deleted by the watch dog service.
          await deleteFramework(snapshot.getName());
          logger.info(
            `Framework ${frameworkName} is successfully deleted. PollingTs=${pollingTs}.`,
          );
        } catch (err) {
          if (err.response && err.response.statusCode === 404) {
            // for 404 error, mock a delete to write merger
            logger.warn(
              `Cannot find framework ${frameworkName} in API Server. Will mock a deletion to write merger. Error:`,
              err,
            );
            await postMockedDeleteEvent(snapshot);
          } else {
            // for non-404 error
            throw err;
          }
        }
      }),
    )
    .catch(err => {
      logger.error(
        `An error happened when delete framework ${frameworkName} and pollingTs=${pollingTs}:`,
        err,
      );
    });
}

function synchronizeHandler(snapshot, addOns, pollingTs) {
  const frameworkName = snapshot.getName();
  logger.info(
    `Start synchronizing request of framework ${frameworkName}. PollingTs=${pollingTs}`,
  );
  lock
    .acquire(frameworkName, () =>
      queue.add(async () => {
        await synchronizeRequest(snapshot, addOns);
        logger.info(
          `Request of framework ${frameworkName} is successfully synchronized. PollingTs=${pollingTs}.`,
        );
      }),
    )
    .catch(err => {
      logger.error(
        `An error happened when synchronize request for framework ${frameworkName} and pollingTs=${pollingTs}:`,
        err,
      );
    });
}

async function poll() {
  const pollingTs = new Date().getTime();
  try {
    logger.info(`Start polling. PollingTs=${pollingTs}`);
    const frameworks = await databaseModel.Framework.findAll({
      attributes: [
        'name',
        'configSecretDef',
        'priorityClassDef',
        'dockerSecretDef',
        'snapshot',
        'subState',
        'requestSynced',
        'apiServerDeleted',
      ],
      where: {
        apiServerDeleted: false,
        [Op.or]: {
          subState: 'Completed',
          requestSynced: false,
        },
      },
    });
    for (const framework of frameworks) {
      const snapshot = new Snapshot(framework.snapshot);
      const addOns = new AddOns(
        framework.configSecretDef,
        framework.priorityClassDef,
        framework.dockerSecretDef,
      );
      if (framework.subState === 'Completed') {
        deleteHandler(snapshot, pollingTs);
      } else {
        synchronizeHandler(snapshot, addOns, pollingTs);
      }
    }
  } catch (err) {
    logger.error(`An error happened for pollingTs=${pollingTs}:`, err);
    throw err;
  }
}

interval(poll, config.intervalSecond * 1000, { stopOnError: false });
