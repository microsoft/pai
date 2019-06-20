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


const dbUtility = require('@pai/utils/dbUtil');
const logger = require('@pai/config/logger');

/**
 * A K-V store with 10-min timeout.
 * Key: HTTP requested path.
 * Val: { code: xxx, data: yyy }
 */
const cache = dbUtility.getStorageObject('localCache', {
  ttlSeconds: 600,
});

const wrapWithCache = (handler) => {
  return function(req, res) {
    let key = req.originalUrl;
    cache.get(key, null, function(err1, val1) {
      if (err1 || !val1) {
        handler(req, function(err2, val2) {
          if (err2) {
            // Double check because other request may fill in cache already
            cache.get(key, null, function(err3, val3) {
              if (err3 || !val3) {
                logger.error(err3);
                res.status(err2.code).json({
                  message: err2.message,
                });
              } else {
                res.status(val3.code).json(val3.data);
              }
            });
          } else {
            cache.set(key, val2, null, function(err3, _) {
              if (err3) {
                logger.error(err3);
              }
              res.status(val2.code).json(val2.data);
            });
          }
        });
      } else {
        logger.debug(`hit cache with path "${key}"`);
        res.status(val1.code).json(val1.data);
      }
    });
  };
};

module.exports = wrapWithCache;
