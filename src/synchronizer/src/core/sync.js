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

const _ = require('underscore')
const assert = require('assert')
const AsyncLock = require('async-lock')
const logger = require('./logger')

class Synchronizer {
  constructor (k8sClient, dbModel) {
    this.k8sClient = k8sClient
    this.dbModel = dbModel
  }

  k8sObjValidate () {
    return true
  }

  k8sObjPreprocess (obj) {
    return obj
  }

  dbObjValidate (obj) {
    return true
  }

  dbObjPreprocess (obj) {
    // `createdAt` and `updatedAt` are two special fields in Sequelize
    // they should not be used for object comparision
    obj = obj.toJSON()
    if ('createdAt' in obj) {
      delete obj['createdAt']
    }
    if ('updatedAt' in obj) {
      delete obj['updatedAt']
    }
    return obj
  }

  isEqual (obj1, obj2) {
    return _.isEqual(obj1, obj2)
  }

  run () {
    throw new Error('Not Implemented.')
  }
}

class ListWatchSynchronizer extends Synchronizer {
  constructor (k8sClient, dbModel, listIntervalSeconds = 120, deletePolicy = 'delete') {
    super(k8sClient, dbModel)
    this.listIntervalSeconds = listIntervalSeconds
    assert(['delete', 'retain'].indexOf(deletePolicy) >= 0)
    this.deletePolicy = deletePolicy
    this.lock = new AsyncLock({ maxPending: Number.MAX_SAFE_INTEGER })
  }

  /*
  This function should return:
    {
      'k8sObjList': <list of k8s Object>,
      'resourceVersion': 'k8s list resource version'
      'dbObjList': <list of db Object>
    }
   If there is any error during retrieving, this function should throw it.
  */
  async list () {
    throw new Error('Not Implemented.')
  }

  /*
  This function should be override with a real watch function.
  However, users should not call .watch() directly.
  It will be called by the synchronizer internally.
  */
  async watch (dataCallback, endCallback, resourceVersion, timeoutSeconds) {
    throw new Error('Not Implemented.')
  }

  _submit (method, obj) {
    if (method === 'insert') {
      this.lock.acquire(obj.uuid, () => {
        logger.info('insert: ' + JSON.stringify(obj))
        return this.dbModel.create(obj)
      }).catch(err => logger.error(err))
    } else if (method === 'update') {
      this.lock.acquire(obj.uuid, () => {
        logger.info('update:' + JSON.stringify(obj))
        return this.dbModel.update(obj, { where: { uuid: obj.uuid } })
      }).catch(err => logger.error(err))
    } else if (method === 'delete') {
      this.lock.acquire(obj.uuid, () => {
        logger.info('delete uuid: ' + obj.uuid)
        return this.dbModel.destroy({ where: { uuid: obj.uuid } })
      }).catch(err => logger.error(err))
    } else {
      throw new Error('Unknown submitted method: ' + method)
    }
  }

  /*
  Synchronize one time by `list`.
  If there is any error, this function should throw it.
  */
  async listSynchronize () {
    let { k8sObjList, resourceVersion, dbObjList } = await this.list()
    k8sObjList = k8sObjList.filter(obj => this.k8sObjValidate(obj)).map(obj => this.k8sObjPreprocess(obj))
    dbObjList = dbObjList.filter(obj => this.dbObjValidate(obj)).map(obj => this.dbObjPreprocess(obj))
    const k8sUuidSet = new Set()
    const dbUuidSet = new Set()
    k8sObjList.map(obj => k8sUuidSet.add(obj.uuid))
    dbObjList.map(obj => dbUuidSet.add(obj.uuid))
    // DELETE from database
    if (this.deletePolicy === 'delete') {
      for (const obj of dbObjList) {
        if (!(k8sUuidSet.has(obj.uuid))) {
          this._submit('delete', obj)
        }
      }
    }
    // INSERT to database
    for (const obj of k8sObjList) {
      if (!(dbUuidSet.has(obj.uuid))) {
        this._submit('insert', obj)
      }
    }
    // UPDATE in database
    const dbUuidToObj = new Map()
    for (const obj of dbObjList) {
      dbUuidToObj.set(obj.uuid, obj)
    }
    for (const obj of k8sObjList) {
      if (dbUuidToObj.has(obj.uuid)) {
        if (!(this.isEqual(obj, dbUuidToObj.get(obj.uuid)))) {
          this._submit('update', obj)
        }
      }
    }

    return resourceVersion
  }

  watchDataCallBack (data) {
    try {
      let obj = data.object
      if (this.k8sObjValidate(obj)) {
        obj = this.k8sObjPreprocess(obj)
        if (data.type === 'ADDED') {
          this._submit('insert', obj)
        } else if (data.type === 'MODIFIED') {
          this._submit('update', obj)
        } else if (data.type === 'DELETED') {
          if (this.deletePolicy === 'delete') {
            this._submit('delete', obj)
          }
        }
      }
    } catch (err) {
      logger.error(err)
    }
  }

  /*
  This function does `list` -> `watch` -> `list` ..... forever.
  */
  run () {
    const _realRun = async () => {
      let resourceVersion
      try {
        logger.info('start `list`.')
        resourceVersion = await this.listSynchronize()
      } catch (err) {
        logger.error(err)
        resourceVersion = null
      }
      if (resourceVersion) {
        logger.info('start `watch` from resourceVersion ' + resourceVersion + '.')
      } else {
        logger.info('start `watch` without resourceVersion.')
      }
      this.watch(
        (data) => this.watchDataCallBack(data),
        () => _realRun(),
        resourceVersion,
        this.listIntervalSeconds
      )
    }
    _realRun()
  }
}

module.exports = {
  ListWatchSynchronizer: ListWatchSynchronizer
}
