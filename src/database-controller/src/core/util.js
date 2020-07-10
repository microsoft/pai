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

const logger = require('@dbc/core/logger')
const k8s = require('@dbc/core/k8s')

async function timePeriod (ms) {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms)
  })
}

function alwaysRetryDecorator (promiseFn, loggingMessage, initialRetryDelayMs = 500, backoffRatio = 2, maxRetryDelayMs = 120000) {
  /*
  promiseFn is a function which has signature: async function() {}
  This decorator returns a newPromiseFn, which can be run as newPromiseFn().
  The new promise will be always retried.
  */
  async function _wrapper () {
    let nextDelayMs = initialRetryDelayMs
    let retryCount = 0
    while (true) {
      try {
        if (retryCount > 0) {
          logger.warn(`${loggingMessage} retries=${retryCount}.`)
        }
        const res = await promiseFn()
        logger.info(`${loggingMessage} succeeded.`)
        return res
      } catch (err) {
        if (retryCount === 0) {
          logger.warn(`${loggingMessage} failed. It will be retried after ${nextDelayMs} ms. Error: ${err.message}`)
        } else {
          logger.warn(`${loggingMessage} failed. Retries=${retryCount}. It will be retried after ${nextDelayMs} ms. Error: ${err.message}`)
        }
        await timePeriod(nextDelayMs)
        if (nextDelayMs * backoffRatio < maxRetryDelayMs) {
          nextDelayMs = nextDelayMs * backoffRatio
        } else {
          nextDelayMs = maxRetryDelayMs
        }
        retryCount += 1
      }
    }
  }
  return _wrapper
}

function ignoreError(err) {
  logger.info('This error will be ignored: ', err)
}

function reportError(err) {
  logger.error(err)
}

async function synchronizeCreateRequest(frameworkDescription, configSecretDef, priorityClassDef, dockerSecretDef) {
  try {
    if (frameworkDescription !== null && !(frameworkDescription instanceof Object)) {
      frameworkDescription = JSON.parse(frameworkDescription)
    }
    if (configSecretDef !== null && !(configSecretDef instanceof Object)) {
      configSecretDef = JSON.parse(configSecretDef)
    }
    if (priorityClassDef !== null && !(priorityClassDef instanceof Object)) {
      priorityClassDef = JSON.parse(priorityClassDef)
    }
    if (dockerSecretDef !== null && !(dockerSecretDef instanceof Object)) {
      dockerSecretDef = JSON.parse(dockerSecretDef)
    }
    // There may be multiple calls of synchronizeCreateRequest.
    // However, only one successful call could be made for `createFramework` in the end.
    // For add-ons: Tolerate 409 error to avoid blocking `createFramework`.
    // For `createFramework`: If 409 error, throw it and don't delete add-ons.
    //                        If non-409 error, try to delete existing job add ons.
    if (configSecretDef) {
      try {
        await k8s.createSecret(configSecretDef)
      } catch (err) {
        if (err.response && err.response.statusCode === 409) {
          logger.warn(`Secret ${configSecretDef.metadata.name} already exists.`)
        } else {
          throw err
        }
      }
    }
    if (priorityClassDef) {
      try {
        await k8s.createPriorityClass(priorityClassDef)
      } catch (err) {
        if (err.response && err.response.statusCode === 409) {
          logger.warn(`PriorityClass ${priorityClassDef.metadata.name} already exists.`)
        } else {
          throw err
        }
      }
    }
    if (dockerSecretDef) {
      try {
        await k8s.createSecret(dockerSecretDef)
      } catch (err) {
        if (err.response && err.response.statusCode === 409) {
          logger.warn(`Secret ${dockerSecretDef.metadata.name} already exists.`)
        } else {
          throw err
        }
      }
    }
    try{
      const response = await k8s.createFramework(frameworkDescription)
      // framework is created successfully.
      const framework = response.body
      // do not await for patch
      configSecretDef && k8s.patchSecretOwnerToFramework(configSecretDef, framework).catch(ignoreError)
      dockerSecretDef && k8s.patchSecretOwnerToFramework(dockerSecretDef, framework).catch(ignoreError)
    } catch (err) {
      if (err.response && err.response.statusCode === 409) {
        logger.warn(`Framework ${frameworkDescription.metadata.name} already exists.`)
      } else {
        throw err
      }
    }
  } catch (err) {
    // do not await for delete
    configSecretDef && k8s.deleteSecret(configSecretDef.metadata.name).catch(ignoreError)
    priorityClassDef && k8s.deletePriorityClass(priorityClassDef.metadata.name).catch(ignoreError)
    dockerSecretDef && k8s.deleteSecret(dockerSecretDef.metadata.name).catch(ignoreError)
    throw err
  }
}

async function synchronizeExecuteRequest(frameworkName, executionType) {
  await k8s.executeFramework(frameworkName, executionType)
}

module.exports = {
  alwaysRetryDecorator: alwaysRetryDecorator,
  synchronizeCreateRequest: synchronizeCreateRequest,
  synchronizeExecuteRequest: synchronizeExecuteRequest,
  ignoreError: ignoreError,
  reportError: reportError,
}
