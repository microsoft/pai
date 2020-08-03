// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

require('module-alias/register')
require('dotenv').config()
const fetch = require('node-fetch')
const AsyncLock = require('async-lock')
const logger = require('@dbc/core/logger')
const { getFrameworkInformer } = require('@dbc/core/k8s')
const { alwaysRetryDecorator } = require('@dbc/core/util')
const config = require('@dbc/watcher/framework/config')

const lock = new AsyncLock({ maxPending: Number.MAX_SAFE_INTEGER })

async function synchronizeFramework (eventType, apiObject) {
  const res = await fetch(
    `${config.writeMergerUrl}/api/v1/watchEvents/${eventType}`,
    {
      method: 'POST',
      body: JSON.stringify(apiObject),
      headers: { 'Content-Type': 'application/json' },
      timeout: config.writeMergerConnectionTimeoutSecond * 1000
    }
  )
  if (!res.ok) {
    throw new Error(`Request returns a ${res.status} error.`)
  }
}

const eventHandler = (eventType, apiObject) => {
  /*
    framework name-based lock + always retry
  */
  const receivedTs = (new Date()).getTime()
  const state = (apiObject.status && apiObject.status.state) ? apiObject.status.state : 'Unknown'
  logger.info(`Event type=${eventType} receivedTs=${receivedTs} framework=${apiObject.metadata.name} state=${state} received.`)
  lock.acquire(
    apiObject.metadata.name,
    alwaysRetryDecorator(
      () => synchronizeFramework(eventType, apiObject),
      `Sync to write merger type=${eventType} receivedTs=${receivedTs} framework=${apiObject.metadata.name} state=${state}`
    )
  )
}

const informer = getFrameworkInformer()

informer.on('add', (apiObject) => { eventHandler('ADDED', apiObject) })
informer.on('update', (apiObject) => { eventHandler('MODIFED', apiObject) })
informer.on('delete', (apiObject) => { eventHandler('DELETED', apiObject) })
informer.on('error', (err) => {
  // If any error happens, the process should exit, and let Kubernetes restart it.
  logger.error(err)
  process.exit(1)
})
informer.start()
