// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const logger = require('@dbc/common/logger');

async function timePeriod(ms) {
  await new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
}

function alwaysRetryDecorator(
  promiseFn,
  loggingMessage,
  initialRetryDelayMs = 500,
  backoffRatio = 2,
  maxRetryDelayMs = 120000,
  randomizeDelay = true,
) {
  /*
  promiseFn is an async function
  This decorator returns a newPromiseFn, which can be run as newPromiseFn(...).
  The new promise will be always retried.
  */
  async function _wrapper() {
    let nextDelayMs = initialRetryDelayMs;
    let retryCount = 0;
    while (true) {
      try {
        if (retryCount > 0) {
          logger.warn(`${loggingMessage} retries=${retryCount}.`);
        }
        const res = await promiseFn.apply(this, arguments);
        logger.info(`${loggingMessage} succeeded.`);
        return res;
      } catch (err) {
        if (retryCount === 0) {
          logger.warn(
            `${loggingMessage} failed. It will be retried after ${nextDelayMs} ms. Error: ${err.message}`,
          );
        } else {
          logger.warn(
            `${loggingMessage} failed. Retries=${retryCount}. It will be retried after ${nextDelayMs} ms. Error: ${err.message}`,
          );
        }
        await timePeriod(nextDelayMs);
        if (nextDelayMs * backoffRatio < maxRetryDelayMs) {
          nextDelayMs = nextDelayMs * backoffRatio;
        } else {
          nextDelayMs = maxRetryDelayMs;
        }
        if (randomizeDelay) {
          // randomize between nextDelayMs * (0.8 ~ 1.2)
          nextDelayMs = nextDelayMs * (Math.random() * 0.4 + 0.8);
        }
        retryCount += 1;
      }
    }
  }
  return _wrapper;
}

function timeoutDecorator(promiseFn, loggingMessage, timeoutMs) {
  /*
  promiseFn is an async function
  This decorator returns a newPromiseFn, which can be run as newPromiseFn(...).
  The new promise will has a timeout
  */
  async function _wrapper() {
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(
        () =>
          reject(
            new Error(`${loggingMessage} reached timeout ${timeoutMs} ms.`),
          ),
        timeoutMs,
      );
    });
    const resPromise = promiseFn.apply(this, arguments);
    const res = await Promise.race([timeoutPromise, resPromise]);
    return res;
  }
  return _wrapper;
}

module.exports = {
  alwaysRetryDecorator: alwaysRetryDecorator,
  timeoutDecorator: timeoutDecorator,
};
