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
    try {
      this.etcdClient.get(key, options, (err, res) => {
        logger.info("get");
        logger.info(res);
        if (err === null) {
          const resJson = {
            errCode: "0",
            key: res.node.key,
            value: res.node.value
          };
          next(resJson);
        } else {
          const resJson = {
            errCode: "-1",
            errMsg: err.message
          };
          next(resJson);
        }
      });
    } catch (err) {
      const resJson = {
        errCode: "-2",
        errMsg: "Exception in etcd2 get function. Error message: " + err.message
      }
      next(resJson);
    }
  }

  set(key, value, next, options = null) {
    try {
      this.etcdClient.set(key, value, options, (err, res) => {
        if (err === null) {
          const resJson = {
            errCode: "0",
            errMsg: "OK"
          };
          next(resJson)
        } else {
          const resJson = {
            errCode: "-1",
            errMsg: err.message
          };
          next(resJson)
        }
      });
    } catch (err) {
      const resJson = {
        errorCode: "-2",
        errorMsg: "Exception in etcd2 set function. Error message: " + err.message
      };
      next(resJson)
    }
  }

  delete(key, next, options = null) {
    try {
      this.etcdClient.del(key, options, (err, res) => {
        if (err === null) {
          const resJson = {
            errCode: "0",
            errMsg: "OK"
          }
          next(resJson)
        } else {
          const resJson = {
            errCode: "-1",
            errMsg: err.message
          }
          next(resJson)
        }
      })
    } catch (err) {
      const resJson = {
        errorCode: "-2",
        errorMsg: "Exception in etcd2 delete function. Error message: " + err.message
      }
      next(resJson)
    }
  }

  getSync(key, options = null) {
    var resJson = {}
    try {
      let res = this.etcdClient.getSync(key, options);
      if (res.err === null) {
        resJson = {
          errCode: "0",
          key: res.body.node.key,
          value: res.body.node.value
        }
      } else {
        resJson = {
          errCode: "-1",
          errMsg: res.err.error.message
        }
      }
    } catch (err) {
      resJson = {
        errCode: "-2",
        errMsg: "Exception in etcd2 getSync function. Error message: " + err.message
      }
    } finally {
      return resJson;
    }
  }

  setSync(key, value, options = null) {
    var resJson = {};
    try {
      this.etcdClient.set("/can_directory");
      let res = this.etcdClient.setSync(key, value, options);
      if (res.err === null) {
        resJson = {
          errCode: "0",
          errMsg: "OK"
        }
      } else {
        resJson = {
          errCode: "-1",
          errMsg: res.err.error.message
        }
      }
    } catch (err) {
      resJson = {
        errCode: "-2",
        errMsg: "Exception in etcd2 setSync function. Error message: " + err.message
      }
    } finally {
      return resJson
    }
  }

  delSync(key, options = null) {
    var resJson = {};
    try {
      let res = this.etcdClient.delSync(key, options);
      if (res.err === null) {
        resJson = {
          errCode: "0",
          errMsg: "OK"
        }
      } else {
        resJson = {
          errCode: "-1",
          errMsg: res.err.error.message
        }
      }
    } catch (err) {
      resJson = {
        errorCode: "-2",
        errorMsg: "Exception in etcd2 delete function. Error message: " + err.message
      }
    } finally {
      return resJson
    }
  }
}

module.exports = EtcdV2