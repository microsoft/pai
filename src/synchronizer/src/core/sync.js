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

class ListSynchronizer extends Synchronizer {
  constructor (k8sClient, dbModel, listIntervalSeconds = 120, deletePolicy = 'delete') {
    super(k8sClient, dbModel)
    this.listIntervalSeconds = listIntervalSeconds
    assert(['delete', 'retain'].indexOf(deletePolicy) >= 0)
    this.deletePolicy = deletePolicy
  }

  /*
  This function should return:
    {
      'k8sObjList': <list of k8s Object>,
      'dbObjList': <list of db Object>
    }
   If there is any error during retrieving, this function should throw it.
  */
  async list () {
    throw new Error('Not Implemented.')
  }

  run () {
    // use arrow function to capture `this`
    const realRun = () => {
      this.list().then(({ k8sObjList, dbObjList }) => {
        try {
          k8sObjList = k8sObjList.filter(obj => this.k8sObjValidate(obj)).map(obj => this.k8sObjPreprocess(obj))
          dbObjList = dbObjList.filter(obj => this.dbObjValidate(obj)).map(obj => this.dbObjPreprocess(obj))
          const k8sUuidSet = new Set(); const dbUuidSet = new Set()
          k8sObjList.map(obj => k8sUuidSet.add(obj.uuid))
          dbObjList.map(obj => dbUuidSet.add(obj.uuid))
          // DELETE from database
          if (this.deletePolicy === 'delete') {
            for (const obj of dbObjList) {
              if (!(k8sUuidSet.has(obj.uuid))) {
                console.log('[ListSynchronizer] delete uuid: ' + obj.uuid)
                this.dbModel.destroy({ where: { uuid: obj.uuid } })
              }
            }
          }
          // INSERT to database
          for (const obj of k8sObjList) {
            if (!(dbUuidSet.has(obj.uuid))) {
              console.log('[ListSynchronizer] create: ' + JSON.stringify(obj))
              this.dbModel.create(obj)
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
                console.log('[ListSynchronizer] update:' + JSON.stringify(obj))
                this.dbModel.update(obj, { where: { uuid: obj.uuid } })
              }
            }
          }
        } catch (err) {
          console.error(err)
        }
        setTimeout(realRun, this.listIntervalSeconds * 1000)
      }, err => console.error(err))
    }
    realRun()
  }
}

class WatchSynchronizer extends Synchronizer {
  constructor (k8sClient, dbModel, deletePolicy = 'delete') {
    super(k8sClient, dbModel)
    assert(['delete', 'retain'].indexOf(deletePolicy) >= 0)
    this.deletePolicy = deletePolicy
  }

  /*
  This function should be replaced with a real watch function.
  However, users should not call .watch() directly.
  */
  async watch (eventCallback) {
    throw new Error('Not Implemented.')
  }

  run () {
    this.watch(
      event => {
        try {
          let obj = event.object
          if (this.k8sObjValidate(obj)) {
            obj = this.k8sObjPreprocess(obj)
            if (event.type === 'ADDED') {
              console.log('[WatchSynchronizer] create: ' + JSON.stringify(obj))
              this.dbModel.create(obj)
            } else if (event.type === 'MODIFIED') {
              console.log('[WatchSynchronizer] update: ' + JSON.stringify(obj))
              this.dbModel.update(obj, { where: { uuid: obj.uuid } })
            } else if (event.type === 'DELETED') {
              if (this.deletePolicy === 'delete') {
                console.log('[WatchSynchronizer] delete uuid: ' + obj.uuid)
                this.dbModel.destroy({ where: { uuid: obj.uuid } })
              }
            }
          }
        } catch (err) {
          console.error(err)
        }
      }
    )
  }
}

module.exports = {
  ListSynchronizer: ListSynchronizer,
  WatchSynchronizer: WatchSynchronizer
}
