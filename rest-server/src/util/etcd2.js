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
const StorageBase = require('./storageBase');

class Etcd2 extends StorageBase {
  constructor(options) {
    super();
    this.options = options;
    this.etcdClient = new Etcd(this.options.hosts);
  }

  get(key, options, callback) {
    try {
      this.etcdClient.get(key, options, (err, res) => {
        if (!err) {
          let kvMap = this.flattenRes(res.node);
          callback(null, kvMap);
        } else {
          callback(err, null);
        }
      });
    } catch (err) {
      callback(err, null);
    }
  }

  set(key, value, options, callback) {
    try {
      this.etcdClient.set(key, value, options, (err, res) => {
        if (!err) {
          callback(null, res);
        } else {
          callback(err, null);
        }
      });
    } catch (err) {
      callback(err, null);
    }
  }

  delete(key, options, callback) {
    try {
      this.etcdClient.del(key, options, (err, res) => {
        if (!err) {
          callback(null, res);
        } else {
          callback(err, null);
        }
      });
    } catch (err) {
      callback(err, null);
    }
  }

  has(key, options, callback) {
    this.etcdClient.get(key, options, (err, res) => {
      if (err && err.errorCode === 100) {
        callback(err, false);
      } else {
        callback(null, true);
      }
    });
  }

  flattenRes(res) {
    let flatRes = new Map();
    flatRes.set(res.key, res.value);
    if (res.dir !== undefined && res.dir && res.nodes !== undefined) {
      for (let node of res.nodes) {
        this.flattenRes(node).forEach((value, key) => {
          flatRes.set(key, value);
        });
      }
    }
    return flatRes;
  }
}

module.exports = Etcd2;
