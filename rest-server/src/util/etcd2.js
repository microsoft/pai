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

// module dependencies
const Etcd = require('node-etcd');
const StorageBase = require('./storageBase')
const logger = require('../config/logger')

class EtcdV2 extends StorageBase {
  constructor(options) {
    super();
    this.options = options;
    this.etcdClient = new Etcd(this.options.hosts);
  }

  get(key, next, options = null) {
    let resJson = {}
    try {
      this.etcdClient.get(key, options, (err, res) => {
        if (err === null) {
          resJson = {
            errCode: StorageBase.prototype.getErrorCode().SUCCESS,
            key: res.node.key,
            value: res.node.value
          };
        } else {
          resJson = {
            errCode: StorageBase.prototype.getErrorCode().ERROR,
            errMsg: err.message
          };
        }
        next(err, resJson);
      });
    } catch (err) {
      resJson = {
        errCode: StorageBase.prototype.getErrorCode().FAILED,
        errMsg: "Exception in etcd2 get function. Error message: " + err.message
      }
      next(err, resJson);
    }
  }

  set(key, value, next, options = null) {
    let resJson = {}
    try {
      this.etcdClient.set(key, value, options, (err, res) => {
        if (err === null) {
          resJson = {
            errCode: StorageBase.prototype.getErrorCode().SUCCESS,
            errMsg: "OK"
          };
        } else {
          resJson = {
            errCode: StorageBase.prototype.getErrorCode().ERROR,
            errMsg: err.message
          };
        }
        next(err, resJson);
      });
    } catch (err) {
      resJson = {
        errorCode: StorageBase.prototype.getErrorCode().FAILED,
        errorMsg: "Exception in etcd2 set function. Error message: " + err.message
      };
      next(err, resJson)
    }
  }

  delete(key, next, options = null) {
    let resJson = {}
    try {
      this.etcdClient.del(key, options, (err, res) => {
        if (err === null) {
          resJson = {
            errCode: StorageBase.prototype.getErrorCode().SUCCESS,
            errMsg: "OK"
          }
        } else {
          resJson = {
            errCode: StorageBase.prototype.getErrorCode().ERROR,
            errMsg: err.message
          }
        }
        next(err, resJson);
      })
    } catch (err) {
      const resJson = {
        errorCode: StorageBase.prototype.getErrorCode().FAILED,
        errorMsg: "Exception in etcd2 delete function. Error message: " + err.message
      }
      next(err, resJson)
    }
  }

  getSync(key, options = null) {
    let resJson = {}
    try {
      let res = this.etcdClient.getSync(key, options);
      if (res.err === null) {
        resJson = {
          errCode: StorageBase.prototype.getErrorCode().SUCCESS,
          key: res.body.node.key,
          value: res.body.node.value
        }
      } else {
        resJson = {
          errCode: StorageBase.prototype.getErrorCode().ERROR,
          errMsg: res.err.error.message
        }
      }
    } catch (err) {
      resJson = {
        errCode: StorageBase.prototype.getErrorCode().FAILED,
        errMsg: "Exception in etcd2 getSync function. Error message: " + err.message
      }
    } finally {
      return resJson;
    }
  }

  setSync(key, value, options = null) {
    let resJson = {};
    try {
      let res = this.etcdClient.setSync(key, value, options);
      if (res.err === null) {
        resJson = {
          errCode: StorageBase.prototype.getErrorCode().SUCCESS,
          errMsg: "OK"
        }
      } else {
        resJson = {
          errCode: StorageBase.prototype.getErrorCode().ERROR,
          errMsg: res.err.error.message
        }
      }
    } catch (err) {
      resJson = {
        errCode: StorageBase.prototype.getErrorCode().FAILED,
        errMsg: "Exception in etcd2 setSync function. Error message: " + err.message
      }
    } finally {
      return resJson
    }
  }

  delSync(key, options = null) {
    let resJson = {};
    try {
      let res = this.etcdClient.delSync(key, options);
      if (res.err === null) {
        resJson = {
          errCode: StorageBase.prototype.getErrorCode().SUCCESS,
          errMsg: "OK"
        }
      } else {
        resJson = {
          errCode: StorageBase.prototype.getErrorCode().ERROR,
          errMsg: res.err.error.message
        }
      }
    } catch (err) {
      resJson = {
        errorCode: StorageBase.prototype.getErrorCode().FAILED,
        errorMsg: "Exception in etcd2 delete function. Error message: " + err.message
      }
    } finally {
      return resJson
    }
  }

  has(key, next, options = null) {
    this.get(key, (err, res) => {
      if (res.errCode === StorageBase.prototype.getErrorCode().ERROR && res.errMsg === 'Key not found') {
        next(res.errMsg, false);
      } else {
        next(null, true);
      }
    }, options);
  }
}

module.exports = EtcdV2