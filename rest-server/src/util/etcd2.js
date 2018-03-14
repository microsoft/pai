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
const unirest = require('unirest');
const logger = require('../config/logger');
const StorageBase = require('./storageBase');

class EtcdRest extends StorageBase {
  get_new_promise() {
    return new Promise((undefined, reject) => {
      logger.info('kit v1')
      reject()
    });
  }

    handle_promise_helper(options) {
        return new Promise(function (resolve, reject) {
            unirest.get(options.url)
                .end((res) => {
                    logger.info("options.url is " + options.url);
                    if (res.status === 200) {
                        logger.info(options.url + ":get info succeed");
                        resolve(res);
                    }
                    else {
                        logger.warn(options.url + ":get info failed");
                        reject(res)
                    }
                })
        });
    }

    get(key, next) {
        var startPromise = get_new_promise();
        key.forEach(item => {
            startPromise = startPromise.then(undefined, (undefined) => {
                return handle_promise_helper({ 'url': item })
            })
        });
    }
}

module.exports = { get };