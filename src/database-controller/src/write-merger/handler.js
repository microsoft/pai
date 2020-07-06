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
  parseInt(process.env.MAX_DB_CONNECTION),
)
const { createFramework, executeFramework } = require('@dbc/core/k8s')
const {convertFrameworkRequest, convertFrameworkStatus} = require('@dbc/write-merger/util')


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
    res.status(200).json({'message': 'ok'})
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
      const oldFramework = await databaseModel.Framework.findOne({where: {name: req.params.name}})
      const watchedFramework = req.body
      if (!oldFramework) {
        // TO DO: If recover mode/upgrade, tolerate 404 error and create framework in database
        throw createError(404, `Cannot find framework ${req.params.name}.`)
      }
      // update framework according to watched events
      let toUpdate
      if (watchedFramework === '') {
        // TO DO: if watchedFramework === '', it will be considered as a fake deletion request from db poller
        // should mark synced=true and fake a completion status
      } else {
        toUpdate = convertFrameworkStatus(watchedFramework)
        if (watchedFramework.spec.executionType !== oldFramework.executionType) {
          // oldFramework.executionType is ground truth.
          // In this case, we can confirm watchedFramework.spec.executionType is outdated.
          // So we can safely ignore it to keep consistence (different executionType in snapshot and exectionType field)
          // Information will be synced in future with correct executionType.
          return
        } else {
          toUpdate.requestSynced = true
        }
      }
      await databaseModel.Framework.update(toUpdate, {where: {name: req.params.name}})
    })
    res.status(200).json({'message': 'ok'})
  } catch (err) {
    return next(err)
  }
}

async function requestCreateFramework (req, res, next) {
  try {
    const frameworkDescription = req.body
    if (!(frameworkDescription.metadata && frameworkDescription.metadata.name)) {
      return next(createError(400, 'Cannot find framework name.'))
    }
    await lock.acquire(frameworkDescription.metadata.name, async () => {
      const oldFramework = await databaseModel.Framework.findOne({where: {name: frameworkDescription.metadata.name}})
      if (oldFramework) {
        throw createError(409, `Framework ${oldFramework.name} already exists.`)
      }
      logger.info(convertFrameworkRequest(frameworkDescription))
      await databaseModel.Framework.create(convertFrameworkRequest(frameworkDescription))
    })
    res.status(201).json({'message': 'ok'})
    // skip db poller, any error will be ignored
    createFramework(req.body).catch((err) => {})
  } catch (err) {
    return next(err)
  }
}

async function requestExecuteFramework (req, res, next) {
  try {
    if (!req.params.name) {
      return next(createError(400, 'Cannot find framework name.'))
    }
    await lock.acquire(req.params.name, async () => {
      const oldFramework = await databaseModel.Framework.findOne({where: {name: req.params.name}})
      if (!oldFramework) {
        throw createError(404, `Cannot find framework ${req.params.name}.`)
      }
      if (oldFramework.executionType != req.params.executionType) {
        await databaseModel.Framework.update({
          executionType: req.params.executionType, requestSynced: false
        }, {where: {name: req.params.name}})
      }
    })
    res.status(200).json({'message': 'ok'})
    // skip db poller, any response or error will be ignored
    executeFramework(req.params.name, req.params.executionType).catch((err) => {})
  } catch (err) {
    return next(err)
  }
}


module.exports = {
  ping: ping,
  frameworkWatchEvents: frameworkWatchEvents,
  requestCreateFramework: requestCreateFramework,
  requestExecuteFramework: requestExecuteFramework,
}
