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


const NodeCache = require('node-cache');

const StorageBase = require('./storageBase');

class LocalCache extends StorageBase {
  constructor(options) {
    super();
    let ttl = options && options.ttlSeconds ? options.ttlSeconds : 0;
    let period = Math.max(ttl / 2, 60);
    this.store = new NodeCache({
      stdTTL: options && options.ttlSeconds ? options.ttlSeconds : 0,
      period: period,
    });
  }

  get(key, options, callback) {
    this.store.get(key, function(err, val) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, !val && options && options.defaultValue ? options.defaultValue : val);
      }
    });
  }

  set(key, value, options, callback) {
    let handler = function(err, success) {
      if (!err && !success) {
        err = new Error(`Failed to set value for key "${key}".`);
      }
      if (err) {
        callback(err, null);
      } else {
        callback(null, true);
      }
    };
    if (options && options.ttlSeconds) {
      this.store.set(key, value, options.ttlSeconds, handler);
    } else {
      this.store.set(key, value, handler);
    }
  }

  delete(key, options, callback) {
    this.store.del(key, function(err, count) {
      if (err) {
        callback(err, null);
      } else {
        callback(null, options && options.checkExistence ? count == 1 : true);
      }
    });
  }

  has(key, options, callback) {
    this.store.get(key, function(err, val) {
      if (err) {
        callback(err, null);
      } else {
        let res = val != undefined;
        if (options.ignoreNull) {
          res = (val != null) && res;
        }
        callback(null, res);
      }
    });
  }
}

module.exports = LocalCache;
