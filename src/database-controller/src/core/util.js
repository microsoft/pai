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

const mockFrameworkStatus = () => {
  return {
    state: 'AttemptCreationPending',
    attemptStatus: {
      completionStatus: null,
      taskRoleStatuses: []
    },
    retryPolicyStatus: {
      retryDelaySec: null,
      totalRetriedCount: 0,
      accountableRetriedCount: 0
    }
  }
}

const convertState = (state, exitCode, retryDelaySec) => {
  switch (state) {
    case 'AttemptCreationPending':
    case 'AttemptCreationRequested':
    case 'AttemptPreparing':
      return 'WAITING'
    case 'AttemptRunning':
      return 'RUNNING'
    case 'AttemptDeletionPending':
    case 'AttemptDeletionRequested':
    case 'AttemptDeleting':
      if (exitCode === -210 || exitCode === -220) {
        return 'STOPPING'
      } else {
        return 'RUNNING'
      }
    case 'AttemptCompleted':
      if (retryDelaySec == null) {
        return 'RUNNING'
      } else {
        return 'WAITING'
      }
    case 'Completed':
      if (exitCode === 0) {
        return 'SUCCEEDED'
      } else if (exitCode === -210 || exitCode === -220) {
        return 'STOPPED'
      } else {
        return 'FAILED'
      }
    default:
      return 'UNKNOWN'
  }
}

class Snapshot {

  constructor(snapshot) {
    if (snapshot instanceof Object){
      this._snapshot = _.cloneDeep(snapshot)
    }
    else {
      this._snapshot = JSON.parse(snapshot)
    }
    if (!this._snapshot.status) {
      this._snapshot.status = mockFrameworkStatus()
    }
  }

  copy() {
    return new Snapshot(this._snapshot)
  }

  getRequest() {
    return _.pick(this._snapshot, [
      'apiVersion',
      'kind',
      'metadata',
      'spec',
    ])
  }

  isRequestEqual(otherFramework) {
    return _.isEqual(
      this.getRequest(),
      otherFramework.getRequest(),
    )
  }

  overrideRequest(otherFramework) {
    _.assign(this._snapshot, otherFramework.getRequest())
  }

  overrideExecution(executionType) {
    _.assign(this._snapshot, {spec: { executionType: executionType }})
  }

  getFRUpdate(withSnapshot=true) {
    const loadedConfig = yaml.safeLoad(this._snapshot.metadata.annotations.config)
    const jobPriority = _.get(loadedConfig, 'extras.hivedscheduler.jobPriorityClass', null)
    const update = {
      name: this._snapshot.metadata.name,
      namespace: this._snapshot.metadata.namespace,
      jobName: this._snapshot.metadata.annotations.jobName,
      userName: this._snapshot.metadata.labels.userName,
      jobConfig: this._snapshot.metadata.annotations.config,
      executionType: this._snapshot.spec.executionType,
      virtualCluster: this._snapshot.metadata.labels.virtualCluster,
      jobPriority: jobPriority,
      totalGpuNumber: this._snapshot.metadata.annotations.totalGpuNumber,
      totalTaskNumber: this._snapshot.spec.taskRoles.reduce((num, spec) => num + spec.taskNumber, 0),
      totalTaskRoleNumber: this._snapshot.spec.taskRoles.length,
      logPathInfix: this._snapshot.metadata.annotations.logPathInfix,
    }
    if (withSnapshot) {
      update.snapshot = JSON.stringify(this._snapshot)
    }
    return update
  }

  getFSUpdate(withSnapshot=true) {
    const completionStatus = this._snapshot.status.attemptStatus.completionStatus
    const update = {
      retries: this._snapshot.status.retryPolicyStatus.totalRetriedCount,
      retryDelayTime: this._snapshot.status.retryPolicyStatus.retryDelaySec,
      platformRetries: this._snapshot.status.retryPolicyStatus.totalRetriedCount - this._snapshot.status.retryPolicyStatus.accountableRetriedCount,
      resourceRetries: 0,
      userRetries: this._snapshot.status.retryPolicyStatus.accountableRetriedCount,
      creationTime: this._snapshot.metadata.creationTimestamp ? new Date(this._snapshot.metadata.creationTimestamp) : null,
      completionTime: this._snapshot.status.completionTime ? new Date(this._snapshot.status.completionTime) : null,
      appExitCode: completionStatus ? completionStatus.code : null,
      subState: this._snapshot.status.state,
      state: convertState(
        this._snapshot.status.state,
        completionStatus ? completionStatus.code : null,
        this._snapshot.status.retryPolicyStatus.retryDelaySec
      ),
    }
    if (withSnapshot) {
      update.snapshot = JSON.stringify(this._snapshot)
    }
    return update
  }

  getAllUpdate(withSnapshot=true) {
    const update = _.assign({}, this.getFRUpdate(), this.getFSUpdate())
  }

  getName() {
    return this._snapshot.metadata.name
  }

  getSnapshot() {
    return _.cloneDeep(this._snapshot)
  }
}

class AddOns {

  constructor (configSecretDef=null, priorityClassDef=null, dockerSecretDef=null) {
    if (configSecretDef !== null && !(configSecretDef instanceof Object)) {
      this._configSecretDef = JSON.parse(configSecretDef)
    } else {
      this._configSecretDef = configSecretDef
    }
    if (priorityClassDef !== null && !(priorityClassDef instanceof Object)) {
      this._priorityClassDef = JSON.parse(priorityClassDef)
    } else {
      this._priorityClassDef = priorityClassDef
    }
    if (dockerSecretDef !== null && !(dockerSecretDef instanceof Object)) {
      this._dockerSecretDef = JSON.parse(dockerSecretDef)
    } else {
      this._dockerSecretDef = dockerSecretDef
    }
  }

  async create() {

  }

  silentDelete() {

  }
}


async function synchronizeRequest(snapshot, configSecretDef, priorityClassDef, dockerSecretDef) {
  try {

    // There may be multiple calls of synchronizeRequest.
    // However, only one successful call could be made for `createFramework` in the end.
    // For add-ons: Tolerate 409 error to avoid blocking `createFramework`.
    // For `createFramework`: If 409 error, warn it and don't delete add-ons.
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

function ignoreError(err) {
  logger.info('This error will be ignored: ', err)
}

function reportError(err) {
  logger.error(err)
}

module.exports = {
  alwaysRetryDecorator: alwaysRetryDecorator,
  synchronizeCreateRequest: synchronizeCreateRequest,
  synchronizeExecuteRequest: synchronizeExecuteRequest,
  ignoreError: ignoreError,
  reportError: reportError,
}
