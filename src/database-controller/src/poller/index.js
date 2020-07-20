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
const { Snapshot, AddOns, synchronizeRequest } = require('@dbc/core/framework')
const interval = require('interval-promise')
const k8s = require('@dbc/core/k8s')
const config = require('@dbc/poller/config')
const fetch = require('node-fetch')
const {deleteFramework} = require('@dbc/core/k8s')
const lock = new AsyncLock({ maxPending: 1 })
const databaseModel = new DatabaseModel(
  config.dbConnectionStr,
  config.maxDatabaseConnection,
)


async function mockDeleteEvent(snapshot) {
  await fetch(
    `${config.writeMergerUrl}/api/v1/watchEvents/DELETED`,
    {
      method: 'POST',
      body: snapshot.getString(),
      headers: { 'Content-Type': 'application/json' },
      timeout: config.writeMergerConnectionTimeoutSecond * 1000
    }
  )
}


function deleteHandler(snapshot, pollingTs) {
  const frameworkName = snapshot.getName()
  logger.info(`Will delete framework ${frameworkName}. PollingTs=${pollingTs}.`)
  lock.acquire(frameworkName,
    async () => {
      try{
        await deleteFramework(snapshot.getName())
        logger.info(`Framework ${frameworkName} is successfully deleted. PollingTs=${pollingTs}.`)
      } catch (err) {
        if (err.response && err.response.statusCode === 404) {
          // for 404 error, mock a delete to write merger
          logger.warn(`Cannot find framework ${frameworkName} in API Server. Will mock a deletion to write merger.`)
          await mockDeleteEvent(snapshot)
        }
        else {
          // for non-404 error
          throw err
        }
      }
    }
  ).catch((err) => {
      logger.error(
        `An error happened when delete framework ${frameworkName} and pollingTs=${pollingTs}:`,
        err
      )
  })
}


function synchronizeHandler(snapshot, addOns, pollingTs) {
  const frameworkName = snapshot.getName()
  logger.info(`Start synchronizing request of framework ${frameworkName}. PollingTs=${pollingTs}`)
  lock.acquire(
    frameworkName,
    async () => {
      await synchronizeRequest(
        snapshot,
        addOns,
      )
      logger.info(`Request of framework ${frameworkName} is successfully synchronized. PollingTs=${pollingTs}.`)
    }
  ).catch((err) => {
      logger.error(
        `An error happened when synchronize request for framework ${frameworkName} and pollingTs=${pollingTs}:`
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
          'subState', 'requestSynced', 'apiServerDeleted'],
        where: {
          apiServerDeleted: false,
          [Op.or]: {
            subState: 'Completed',
            requestSynced: false,
          }
        }
      })
      for (let framework of frameworks) {
        const snapshot = new Snapshot(framework.snapshot)
        const addOns = new AddOns(framework.configSecretDef, framework.priorityClassDef, framework.dockerSecretDef)
        if (framework.subState === 'Completed') {
          deleteHandler(snapshot, pollingTs)
        } else {
          synchronizeHandler(snapshot, addOns, pollingTs)
        }
      }
  } catch (err) {
    logger.error(`An error happened for pollingTs=${pollingTs}:`, err)
    throw err
  }
}

interval(
  poll,
  config.intervalSecond * 1000,
  {stopOnError: false},
)
