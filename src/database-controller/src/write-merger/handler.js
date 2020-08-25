// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const createError = require('http-errors');
const logger = require('@dbc/common/logger');
const AsyncLock = require('async-lock');
const DatabaseModel = require('openpaidbsdk');
const config = require('@dbc/write-merger/config');
const {
  Snapshot,
  AddOns,
  silentSynchronizeRequest,
  silentDeleteFramework,
} = require('@dbc/common/framework');
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

async function postWatchEvents(req, res, next) {
  try {
    let snapshot = new Snapshot(req.body);
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
        if (config.retainModeEnabled) {
          // If database doesn't have the corresponding framework,
          // and retain mode is enabled,
          // retain the framework, i.e. do not delete it.
          logger.warn(
            `Framework ${frameworkName} appears in API server, and it is not in database. Tolerate it since retain mode is on.`,
          );
        } else {
          // If database doesn't have the corresponding framework,
          // and retain mode is disabled,
          // delete the framework silently
          logger.warn(
            `Framework ${frameworkName} appears in API server, and it is not in database. Delete it since retain mode is off.`,
          );
          silentDeleteFramework(frameworkName);
        }
      } else {
        // Database has the corresponding framework.
        const oldSnapshot = new Snapshot(oldFramework.snapshot);
        const internalUpdate = {};
        if (
          oldSnapshot.getRequestGeneration() === snapshot.getRequestGeneration()
        ) {
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
          if (snapshot.getState() === 'Completed') {
            // if event is DELETED and the state is Completed, mark apiServerDeleted = true
            internalUpdate.apiServerDeleted = true;
          } else {
            // Event is DELETED and the state is not Completed.
            // This case could occur when someone deletes the framework in API server directly.
            // In such case, we mark requestSynced=false, and reset the snapshot using the framework request.
            snapshot = new Snapshot(snapshot.getRequest(false));
            internalUpdate.requestSynced = false;
            internalUpdate.apiServerDeleted = false;
          }
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

async function onCreateFrameworkRequest(snapshot, submissionTime, addOns) {
  // create new record in db
  // including all add-ons and submissionTime
  // set requestGeneration = 1
  snapshot.setRequestGeneration(1);
  const record = _.assign(
    { requestSynced: false, apiServerDeleted: false },
    snapshot.getAllUpdate(),
    addOns.getUpdate(),
  );
  record.submissionTime = new Date(submissionTime);
  await databaseModel.Framework.create(record);
  // Poller has an interval to synchronize the framework request to API server.
  // The interval will cause a delay on every job.
  // So we introduce a short-cut here to synchronize the framework request.
  // It is an async function call and doesn't affect the return of this function.
  // Any error of it will be logged and ignored.
  silentSynchronizeRequest(snapshot, addOns);
}

async function onModifyFrameworkRequest(oldSnapshot, snapshot, addOns) {
  // compare framework request (omit requestGeneration)
  if (_.isEqual(snapshot.getRequest(true), oldSnapshot.getRequest(true))) {
    // request is equal, no-op
  } else {
    // request is different
    // update request in db, mark requestSynced=false
    snapshot.setRequestGeneration(oldSnapshot.getRequestGeneration() + 1);
    await databaseModel.Framework.update(
      _.assign({}, snapshot.getRequestUpdate(), {
        requestSynced: false,
      }),
      { where: { name: snapshot.getName() } },
    );
    // Poller has an interval to synchronize the framework request to API server.
    // The interval will cause a delay on every job.
    // So we introduce a short-cut here to synchronize the framework request.
    // It is an async function call and doesn't affect the return of this function.
    // Any error of it will be logged and ignored.
    silentSynchronizeRequest(snapshot, addOns);
  }
}

async function patchFrameworkRequest(req, res, next) {
  // The handler to handle PATCH /frameworkRequest.
  // PATCH means provide a part of data, and the current framework request should be updated according to the patch.
  // We use the rules of "JSON merge patch" for request modifying.
  // If the framework request JSON is changed, we will mark it as requestSynced=false.
  // A requestSynced=false request will be synchronized to API server (no matter whether it is completed).
  try {
    const patchData = req.body;
    const frameworkName = req.params.frameworkName;
    if (!frameworkName) {
      return next(createError(400, 'Cannot find framework name.'));
    }
    if (
      _.has(patchData, 'metadata.name') &&
      patchData.metadata.name !== frameworkName
    ) {
      return next(
        createError(
          400,
          "The framework names in query string doesn't match the name in body.",
        ),
      );
    }
    await lock.acquire(frameworkName, async () => {
      const oldFramework = await databaseModel.Framework.findOne({
        attributes: [
          'snapshot',
          'submissionTime',
          'configSecretDef',
          'priorityClassDef',
          'dockerSecretDef',
        ],
        where: { name: frameworkName },
      });
      if (!oldFramework) {
        // if the old framework doesn't exist, throw a 404 error.
        throw createError(404, `Cannot find framework ${frameworkName}.`);
      } else {
        // if the old framework exists
        const oldSnapshot = new Snapshot(oldFramework.snapshot);
        const snapshot = oldSnapshot.copy();
        snapshot.applyRequestPatch(patchData);
        const addOns = new AddOns(
          oldFramework.configSecretDef,
          oldFramework.priorityClassDef,
          oldFramework.dockerSecretDef,
        );
        return onModifyFrameworkRequest(oldSnapshot, snapshot, addOns);
      }
    });
    res.status(200).json({ message: 'ok' });
  } catch (err) {
    return next(err);
  }
}

async function putFrameworkRequest(req, res, next) {
  // The handler to handle PUT /frameworkRequest.
  // PUT means provide a full spec of framework request, and the corresponding request will be created or updated.
  // Along with the framework request, user must provide other job add-ons, e.g. configSecretDef, priorityClassDef, dockerSecretDef.
  // If the framework doesn't exist in database, the record will be created.
  // If the framework already exists, the record will be updated, and all job add-ons will be ignored. (Job add-ons can't be changed).
  // If the framework request JSON is changed(or created), we will mark it as requestSynced=false.
  // A requestSynced=false request will be synchronized to API server (no matter whether it is completed).
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
    if (req.params.frameworkName !== frameworkName) {
      return next(
        createError(
          400,
          "The framework names in query string doesn't match the name in body.",
        ),
      );
    }
    await lock.acquire(frameworkName, async () => {
      const oldFramework = await databaseModel.Framework.findOne({
        attributes: [
          'snapshot',
          'submissionTime',
          'configSecretDef',
          'priorityClassDef',
          'dockerSecretDef',
        ],
        where: { name: frameworkName },
      });
      const snapshot = new Snapshot(frameworkRequest);
      if (!oldFramework) {
        // if the old framework doesn't exist, create add-ons.
        const addOns = new AddOns(
          configSecretDef,
          priorityClassDef,
          dockerSecretDef,
        );
        return onCreateFrameworkRequest(snapshot, submissionTime, addOns);
      } else {
        // If the old framework exists, we doesn't use the provided add-on def in body.
        // Instead, we use the old record in database.
        const oldSnapshot = new Snapshot(oldFramework.snapshot);
        const addOns = new AddOns(
          oldFramework.configSecretDef,
          oldFramework.priorityClassDef,
          oldFramework.dockerSecretDef,
        );
        return onModifyFrameworkRequest(oldSnapshot, snapshot, addOns);
      }
    });
    res.status(200).json({ message: 'ok' });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  ping: ping,
  putFrameworkRequest: putFrameworkRequest,
  patchFrameworkRequest: patchFrameworkRequest,
  postWatchEvents: postWatchEvents,
};
