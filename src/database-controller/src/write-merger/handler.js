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

const createError = require('http-errors')
const logger = require('@dbc/core/logger')
const AsyncLock = require('async-lock')
const lock = new AsyncLock({ maxPending: Number.MAX_SAFE_INTEGER })
const DatabaseModel = require('openpaidbsdk')
const databaseModel = new DatabaseModel(
  process.env.DB_CONNECTION_STR,
  parseInt(process.env.MAX_DB_CONNECTION)
)
const { Snapshot, AddOns, silentSynchronizeRequest } = require('@dbc/core/framework')
const _ = require('lodash')

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

async function ping (req, res, next) {
  try {
    res.status(200).json({ message: 'ok' })
  } catch (err) {
    return next(err)
  }
}

async function receiveWatchEvents (req, res, next) {
  try {
    const frameworkName = req.params.name
    const snapshot = new Snapshot(req.body)
    if (!frameworkName) {
      return next(createError(400, 'Cannot find framework name.'))
    }
    await lock.acquire(frameworkName, async () => {
      const oldFramework = await databaseModel.Framework.findOne({
          attributes: ['snapshot'],
          where: { name: frameworkName } }
      )
      // database doesn't have the corresponding framework.
      if (!oldFramework) {
        if (process.env.RECOVERY_MODE_ENABLED === 'true') {
          // If database doesn't have the corresponding framework,
          // and recovery mode is enabled
          // tolerate the error and create framework in database.
          const record = _.assign({}, snapshot.getAllUpdate(), addOns.getUpdate())
          // correct submissionTime is lost, use snapshot.metadata.creationTimestamp instead
          if (snapshot.getCreationTime()) {
            framework.submissionTime = snapshot.getCreationTime()
          } else {
            framework.submissionTime = new Date()
          }
          // mark requestSynced = true, since we use framework request from api server directly
          framework.requestSynced = true
          await databaseModel.Framework.create(framework)
          return
        } else {
          throw createError(404, `Cannot find framework ${req.params.name}.`)
        }
      } else {
        // Database has the corresponding framework.
        const oldSnapshot = new Snapshot(oldFramework.snapshot)
        const internalUpdate = {}
        if (snapshot.isRequestEqual(oldSnapshot)) {
          // if framework request is equal, mark requestSynced = true
          internalUpdate.requestSynced = true
        } else {
          // if framework request is not equal,
          // should use framework request in db as ground truth
          snapshot.overrideRequest(oldSnapshot)
        }
        if (req.params.eventType === 'DELETED') {
          // if event is DELETED, mark apiServerDeleted = true
          internalUpdate.apiServerDeleted = true
        }
        await databaseModel.Framework.update(
          _.assign(snapshot.getStatusUpdate(), internalUpdate),
          { where: { name: req.params.name } }
        )
      }
    })
    res.status(200).json({ message: 'ok' })
  } catch (err) {
    return next(err)
  }
}

async function receiveFrameworkRequest (req, res, next) {
  try {
    const { frameworkRequest, submissionTime, configSecretDef, priorityClassDef, dockerSecretDef} = req.body
    const frameworkName = _.get(frameworkRequest, 'metadata.name')
    if (!frameworkName) {
      return next(createError(400, 'Cannot find framework name.'))
    }
    const {needSynchronize, snapshot, addOns} = await lock.acquire(
      frameworkName, async () => {
        const oldFramework = await databaseModel.Framework.findOne({
          attributes: ['snapshot'],
          where: { name: frameworkName } }
        )
        const snapshot = new Snapshot(frameworkRequest)
        const addOns = new AddOns(configSecretDef, priorityClassDef, dockerSecretDef)
        if (!oldFramework) {
          // create new record in db
          // including all add-ons and submissionTime
          const record = _.assign({}, snapshot.getAllUpdate(), addOns.getUpdate())
          record.submissionTime = new Date(submissionTime)
          await databaseModel.Framework.create(record)
          return true, snapshot, addOns
        } else {
          // update record in db
          const oldSnapshot = new Snapshot(oldFramework.snapshot)
          if (snapshot.isRequestEqual(oldSnapshot)) {
            // request is different
            // update request in db, mark requestSynced=false
            await databaseModel.Framework.update(
              _.assign({}, snapshot.getRequestUpdate(), {requestSynced: false}),
              { where: { name: req.params.name } }
            )
            return true, snapshot, addOns
          } else {
            // request is equal, no-op
            return false, snapshot, addOns
          }
        }
    })
    res.status(200).json({ message: 'ok' })
    // skip db poller, any response or error will be ignored
    if (needSynchronize){
      silentSynchronizeRequest(snapshot, addOns)
    }
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  ping: ping,
  receiveFrameworkRequest: receiveFrameworkRequest,
  receiveWatchEvents: receiveWatchEvents,
}
