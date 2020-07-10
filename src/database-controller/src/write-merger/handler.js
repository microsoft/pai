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
const { synchronizeCreateRequest, synchronizeExecuteRequest } = require('@dbc/core/util')
const { convertFrameworkRequest, convertFrameworkStatus } = require('@dbc/write-merger/util')

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

async function frameworkWatchEvents (req, res, next) {
  try {
    if (!req.params.name) {
      return next(createError(400, 'Cannot find framework name.'))
    }
    await lock.acquire(req.params.name, async () => {
      const oldFramework = await databaseModel.Framework.findOne({ where: { name: req.params.name } })
      const watchedFramework = req.body
      // database doesn't have the corresponding framework.
      if (!oldFramework) {
        if (watchedFramework !== '') {
          // If database doesn't have the corresponding framework,
          // tolerate the error and create framework in database.
          // This happens during upgrade/recovery.
          const frameworkRequest = convertFrameworkRequest(watchedFramework)
          const frameworkStatus = convertFrameworkStatus(watchedFramework)
          // merge framework request and framework status
          const framework = Object.assign({}, frameworkRequest, frameworkStatus)
          framework.requestSynced = true
          await databaseModel.Framework.create(framework)
          return
        } else {
          throw createError(404, `Cannot find framework ${req.params.name}.`)
        }
      }
      // Database has the corresponding framework.
      // Update framework according to watched events, and mark requestSynced = true.
      const toUpdate = convertFrameworkStatus(watchedFramework)
      if (watchedFramework.spec.executionType !== oldFramework.executionType) {
        // Because oldFramework.executionType is ground truth,
        // in this case, we can confirm watchedFramework.spec.executionType is outdated.
        // So we can safely ignore it to keep consistence.
        // Information will be synced in future with correct executionType.
        logger.warn(`Ignore watched event because executionType in database is ${oldFramework.executionType}, ` +
          `but ${watchedFramework.spec.executionType} is received.`
        )
        return
      } else {
        toUpdate.requestSynced = true
      }
      if (req.params.eventType === 'DELETED') {
        toUpdate.apiServerDeleted = true
        logger.info(JSON.stringify(watchedFramework))
      }
      await databaseModel.Framework.update(toUpdate, { where: { name: req.params.name } })
    })
    res.status(200).json({ message: 'ok' })
  } catch (err) {
    return next(err)
  }
}

async function requestCreateFramework (req, res, next) {
  try {
    const { frameworkDescription, configSecretDef, priorityClassDef, dockerSecretDef} = req.body
    if (!(frameworkDescription.metadata && frameworkDescription.metadata.name)) {
      return next(createError(400, 'Cannot find framework name.'))
    }
    await lock.acquire(frameworkDescription.metadata.name, async () => {
      const oldFramework = await databaseModel.Framework.findOne({ where: { name: frameworkDescription.metadata.name } })
      if (oldFramework) {
        throw createError(409, `Framework ${oldFramework.name} already exists.`)
      }
      const frameworkRequest = convertFrameworkRequest(frameworkDescription)
      if (configSecretDef) {
        frameworkRequest.configSecretDef = JSON.stringify(configSecretDef)
      }
      if (priorityClassDef) {
        frameworkRequest.priorityClassDef = JSON.stringify(priorityClassDef)
      }
      if (dockerSecretDef) {
        frameworkRequest.dockerSecretDef = JSON.stringify(dockerSecretDef)
      }
      await databaseModel.Framework.create(frameworkRequest)
    })
    res.status(201).json({ message: 'ok' })
    // skip db poller, any response or error will be ignored
    // synchronizeCreateRequest(frameworkDescription, configSecretDef, priorityClassDef, dockerSecretDef)
  } catch (err) {
    return next(err)
  }
}

async function requestExecuteFramework (req, res, next) {
  try {
    if (!req.params.name) {
      return next(createError(400, 'Cannot find framework name.'))
    }
    // same format as in framework controller
    const executionType = `${req.params.executionType.charAt(0)}${req.params.executionType.slice(1).toLowerCase()}`
    await lock.acquire(req.params.name, async () => {
      const oldFramework = await databaseModel.Framework.findOne({ where: { name: req.params.name } })
      if (!oldFramework) {
        throw createError(404, `Cannot find framework ${req.params.name}.`)
      }
      if (oldFramework.executionType !== executionType) {
        // update executionType and mark requestSynced = false when executionType is different
        await databaseModel.Framework.update({
          executionType: executionType, requestSynced: false
        }, { where: { name: req.params.name } })
      }
    })
    res.status(200).json({ message: 'ok' })
    // skip db poller, any response or error will be ignored
    // synchronizeExecuteRequest(req.params.name, executionType)
  } catch (err) {
    return next(err)
  }
}

module.exports = {
  ping: ping,
  frameworkWatchEvents: frameworkWatchEvents,
  requestCreateFramework: requestCreateFramework,
  requestExecuteFramework: requestExecuteFramework
}
