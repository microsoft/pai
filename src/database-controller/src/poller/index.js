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

require('module-alias/register')
require('dotenv').config()
const AsyncLock = require('async-lock')
const {Op} = require('Sequelize')
const DatabaseModel = require('openpaidbsdk')
const logger = require('@dbc/core/logger')
const {synchronizeCreateRequest, synchronizeExecuteRequest} = require('@dbc/core/util')
const interval = require('interval-promise')
const k8s = require('@dbc/core/k8s')
const writeMergerUrl = process.env.WRITE_MERGER_URL
const fetch = require('node-fetch')
const {deleteFramework} = require('@dbc/core/k8s')
const lock = new AsyncLock({ maxPending: 1 })
const databaseModel = new DatabaseModel(
  process.env.DB_CONNECTION_STR,
  parseInt(process.env.MAX_DB_CONNECTION)
)


async function mockDeleteEvent(framework) {
  const mockedFramework = JSON.parse(framework.snapshot)
  // framework.executionType is ground-truth.
  mockedFramework.spec.executionType = framework.executionType

  await fetch(
    `${writeMergerUrl}/api/v1/frameworks/${framework.name}/watchEvents/DELETED`,
    {
      method: 'POST',
      body: JSON.stringify(mockedFramework),
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    }
  )
}


function handleCompleted(framework, pollingTs) {
  logger.info(`Will delete framework ${framework.name}. PollingTs=${pollingTs}.`)
  lock.acquire(framework.name,
    async () => {
      try{
        await deleteFramework(framework.name)
      } catch (err) {
        if (err.response && err.response.statusCode === 404) {
          // for 404 error, mock a delete to write merger
          logger.warn(`Cannot find framework ${framework.name} in API Server. Will mock a deletion to write merger.`)
          await mockDeleteEvent(framework)
        }
        else {
          // for non-404 error
          throw err
        }
      }
    }
  ).catch((err) => {
      logger.error(
        `An error happened when delete framework ${framework.name} and pollingTs=${pollingTs}:`,
        err
      )
  })
}


function handleCreate(framework, pollingTs) {
  logger.info(`Start synchronizing CreateRequest for framework ${framework.name}. PollingTs=${pollingTs}`)
  lock.acquire(
    framework.name,
    async () => {
      await synchronizeCreateRequest(
        framework.snapshot,
        framework.configSecretDef,
        framework.priorityClassDef,
        framework.dockerSecretDef
      )
    }
  ).catch((err) => {
      logger.error(
        `An error happened when synchronize CreateRequest for framework ${framework.name} and pollingTs=${pollingTs}:`
        , err
      )
  })
}

function handleExecute(framework, pollingTs) {
  // forward execution promise
  logger.info(`Start synchronizing ExecutionRequest ${framework.executionType} for framework ${framework.name}. PollingTs=${pollingTs}`)
  lock.acquire(
    framework.name,
    async () => {
      try {
        await synchronizeExecuteRequest(
          framework.name,
          framework.executionType
        )
      } catch (err) {
        if (err.response && err.response.statusCode === 404) {
          // for 404 error, mock a delete to write merger
          logger.warn(`Cannot find framework ${framework.name} in API Server. Will mock a deletion to write merger.`)
          await mockDeleteEvent(framework)
        }
        else {
          // for non-404 error
          throw err
        }
      }
    }
  ).catch((err) => {
    logger.error(
      `An error happened when synchronize ExecutionRequest ${framework.executionType} for framework ${framework.name} and pollingTs=${pollingTs}:`
      , err
    )
  })
}


async function poll() {
  const pollingTs = new Date().getTime()
  try{
    logger.info(`Start polling. PollingTs=${pollingTs}`)
    const frameworks = await databaseModel.Framework.findAll({
        attributes: ['name', 'configSecretDef', 'priorityClassDef', 'dockerSecretDef', 'snapshot',
          'executionType', 'subState', 'requestSynced', 'apiServerDeleted'],
        where: {
          apiServerDeleted: false,
          [Op.or]: {
            subState: 'Completed',
            requestSynced: false,
          }
        }
      })
      for (let framework of frameworks) {
        if (framework.subState === 'Completed') {
          handleCompleted(framework, pollingTs)
        } else if (framework.executionType === 'Start') {
          handleCreate(framework, pollingTs)
        } else {
          handleExecute(framework, pollingTs)
        }
      }
  } catch (err) {
    logger.error(`An error happened for pollingTs=${pollingTs}:`, err)
    throw err
  }
}

interval(
  poll,
  parseInt(process.env.DB_POLLER_INTERVAL_SECOND) * 1000,
  {stopOnError: false},
)
