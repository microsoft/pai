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
const _ = require('lodash')
const yaml = require('js-yaml');


async function timePeriod (ms) {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms)
  })
}



function alwaysRetryDecorator (promiseFn, loggingMessage, initialRetryDelayMs = 500, backoffRatio = 2, maxRetryDelayMs = 120000) {
  /*
  promiseFn is an async function
  This decorator returns a newPromiseFn, which can be run as newPromiseFn(...).
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
        const res = await promiseFn.apply(this, arguments)
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

function timeoutDecorator (promiseFn, loggingMessage, timeoutMs){
  /*
  promiseFn is an async function
  This decorator returns a newPromiseFn, which can be run as newPromiseFn(...).
  The new promise will has a timeout
  */
  async function _wrapper () {
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => reject(`${loggingMessage} reached timeout ${timeoutMs} ms.`), timeoutMs)
    })
    const resPromise = promiseFn.apply(this, arguments)
    const res = await Promise.race([timeoutPromise, resPromise])
    return res
  }
  return _wrapper
}


module.exports = {
  alwaysRetryDecorator: alwaysRetryDecorator,
  timeoutDecorator: timeoutDecorator,
}
