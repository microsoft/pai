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

const { Sequelize, Model } = require('sequelize')
const { sequelize } = require('./core/db')
const { ListSynchronizer, WatchSynchronizer } = require('./core/sync')
const assert = require('assert')

class JobModel extends Model {}

JobModel.init({
  uuid: { type: Sequelize.STRING, primaryKey: true },
  name: Sequelize.STRING,
  startTime: Sequelize.DATE,
  transitionTime: Sequelize.DATE,
  completionTime: Sequelize.DATE,
  userName: Sequelize.STRING,
  virtualCluster: Sequelize.STRING,
  retries: Sequelize.INTEGER,
  tasks: Sequelize.INTEGER,
  gpus: Sequelize.INTEGER,
  status: Sequelize.STRING
}, {
  sequelize,
  modelName: 'job'
})

function jobK8sObjValidate (obj) {
  try {
    assert('uid' in obj.metadata)
    assert('name' in obj.metadata)
  } catch (err) {
    console.warn('Object' + obj + 'is not a valid k8s object.')
    return false
  }
  return true
}

function jobK8sObjPreprocess (obj) {
  return {
    uuid: obj.metadata.uid,
    name: obj.metadata.labels.jobName,
    startTime: obj.status ? new Date(obj.status.startTime) : null,
    transitionTime: obj.status ? new Date(obj.status.transitionTime) : null,
    completionTime: obj.status ? new Date(obj.status.completionTime) : null,
    userName: obj.metadata.labels.userName,
    virtualCluster: obj.metadata.labels.virtualCluster,
    retries: obj.status ? obj.status.retryPolicyStatus.totalRetriedCount : null,
    tasks: obj.spec.taskRoles.reduce((s, v) => s + v.taskNumber, 0),
    gpus: obj.metadata.annotations.totalGpuNumber === 'NaN' ? 0 : parseInt(obj.metadata.annotations.totalGpuNumber),
    status: obj.status.attemptStatus.type.name ? obj.status.attemptStatus.type.name : null
  }
}

class JobListSynchronizer extends ListSynchronizer {
  async list () {
    const [k8sRet, dbObjList] = await Promise.all([this.k8sClient.listFrameworks(), this.dbModel.findAll()])
    return {
      k8sObjList: k8sRet.items,
      dbObjList: dbObjList
    }
  }

  k8sObjValidate (obj) {
    return jobK8sObjValidate(obj)
  }

  k8sObjPreprocess (obj) {
    return jobK8sObjPreprocess(obj)
  }
}

class JobWatchSynchronizer extends WatchSynchronizer {
  async watch (eventCallback) {
    this.k8sClient.watchFrameworks(eventCallback)
  }

  k8sObjValidate (obj) {
    return jobK8sObjValidate(obj)
  }

  k8sObjPreprocess (obj) {
    return jobK8sObjPreprocess(obj)
  }

  dbObjPreprocess (obj) {
    return obj
  }
}

module.exports = {
  JobModel: JobModel,
  JobListSynchronizer: JobListSynchronizer,
  JobWatchSynchronizer: JobWatchSynchronizer
}
