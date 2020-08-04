// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const createError = require('http-errors');
const logger = require('@dbc/core/logger');
const AsyncLock = require('async-lock');
const DatabaseModel = require('openpaidbsdk');
const config = require('@dbc/write-merger/config');
const {
  Snapshot,
  AddOns,
  silentSynchronizeRequest,
} = require('@dbc/core/framework');
const _ = require('lodash');
const lock = new AsyncLock({ maxPending: Number.MAX_SAFE_INTEGER });
const databaseModel = new DatabaseModel(
  config.dbConnectionStr,
  config.maxDatabaseConnection,
);

/* For error handling, all handlers follow the same structure:

  try{
    ....
  } catch (err) {
    return next(err)
  }

  If a normal HTTP error is wanted, use `createError`.
  e.g. return next(createError(401, 'Please login to view this page.'))

  If a 500 error is wanted, throw it in-place: throw new Error('fatal error')

*/

async function ping(req, res, next) {
  try {
    res.status(200).json({ message: 'ok' });
  } catch (err) {
    return next(err);
  }
}

async function receiveWatchEvents(req, res, next) {
  try {
    const snapshot = new Snapshot(req.body);
    const frameworkName = snapshot.getName();
    if (!frameworkName) {
      return next(createError(400, 'Cannot find framework name.'));
    }
    await lock.acquire(frameworkName, async () => {
      const oldFramework = await databaseModel.Framework.findOne({
        attributes: ['snapshot'],
        where: { name: frameworkName },
      });
      // database doesn't have the corresponding framework.
      if (!oldFramework) {
        if (config.recoveryModeEnabled) {
          // If database doesn't have the corresponding framework,
          // and recovery mode is enabled
          // tolerate the error and create framework in database.
          const record = snapshot.getRecordForLegacyTransfer();
          record.requestSynced = true;
          await databaseModel.Framework.create(record);
        } else {
          throw createError(404, `Cannot find framework ${frameworkName}.`);
        }
      } else {
        // Database has the corresponding framework.
        const oldSnapshot = new Snapshot(oldFramework.snapshot);
        const internalUpdate = {};
        if (oldSnapshot.getGeneration() === snapshot.getGeneration()) {
          // if framework request is equal, mark requestSynced = true
          logger.info(`The request of framework ${frameworkName} is synced.`);
          internalUpdate.requestSynced = true;
        } else {
          // if framework request is not equal,
          // should use framework request in db as ground truth
          internalUpdate.requestSynced = false;
        }
        // use request in database
        snapshot.overrideRequest(oldSnapshot);
        if (req.params.eventType === 'DELETED') {
          // if event is DELETED, mark apiServerDeleted = true
          internalUpdate.apiServerDeleted = true;
        }
        await databaseModel.Framework.update(
          _.assign(snapshot.getStatusUpdate(), internalUpdate),
          { where: { name: frameworkName } },
        );
      }
    });
    res.status(200).json({ message: 'ok' });
  } catch (err) {
    return next(err);
  }
}

async function receiveFrameworkRequest(req, res, next) {
  try {
    const {
      frameworkRequest,
      submissionTime,
      configSecretDef,
      priorityClassDef,
      dockerSecretDef,
    } = req.body;
    const frameworkName = _.get(frameworkRequest, 'metadata.name');
    if (!frameworkName) {
      return next(createError(400, 'Cannot find framework name.'));
    }
    const [needSynchronize, snapshot, addOns] = await lock.acquire(
      frameworkName,
      async () => {
        const oldFramework = await databaseModel.Framework.findOne({
          attributes: ['snapshot'],
          where: { name: frameworkName },
        });
        const snapshot = new Snapshot(frameworkRequest);
        const addOns = new AddOns(
          configSecretDef,
          priorityClassDef,
          dockerSecretDef,
        );
        if (!oldFramework) {
          // create new record in db
          // including all add-ons and submissionTime
          // set requestGeneration = 1
          snapshot.setGeneration(1);
          const record = _.assign(
            {},
            snapshot.getAllUpdate(),
            addOns.getUpdate(),
          );
          record.submissionTime = new Date(submissionTime);
          await databaseModel.Framework.create(record);
          return [true, snapshot, addOns];
        } else {
          // update record in db
          const oldSnapshot = new Snapshot(oldFramework.snapshot);
          // compare framework request (omit requestGeneration)
          if (
            _.isEqual(snapshot.getRequest(true), oldSnapshot.getRequest(true))
          ) {
            // request is equal, no-op
            return [false, snapshot, addOns];
          } else {
            // request is different
            // update request in db, mark requestSynced=false
            snapshot.setGeneration(oldSnapshot.getGeneration() + 1);
            await databaseModel.Framework.update(
              _.assign({}, snapshot.getRequestUpdate(), {
                requestSynced: false,
              }),
              { where: { name: frameworkName } },
            );
            return [true, snapshot, addOns];
          }
        }
      },
    );
    res.status(200).json({ message: 'ok' });
    // skip db poller, any response or error will be ignored
    if (needSynchronize) {
      silentSynchronizeRequest(snapshot, addOns);
    }
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  ping: ping,
  receiveFrameworkRequest: receiveFrameworkRequest,
  receiveWatchEvents: receiveWatchEvents,
};
