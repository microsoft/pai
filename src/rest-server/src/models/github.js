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


const dbUtility = require('../util/dbUtil');
const logger = require('../config/logger');
const userModel = require('../models/user');

/**
 * A K-V store with 10-min timeout.
 * Key: user name.
 * Val: GitHub PAT.
 */
const patCache = dbUtility.getStorageObject('localCache', {
  ttlSeconds: 600,
});

const getPatWithCache = (userName, callback) => {
  if (!userName) {
    return callback(new Error('Found invalid userName.'), null);
  }
  patCache.get(userName, null, function(err, val) {
    if (err) {
      return callback(err, null);
    }
    if (val) {
      logger.debug(`hit cache with account "${userName}"`);
      return callback(null, val);
    }
    userModel.getUserGithubPAT(userName, function(err, pat) {
      if (err) {
        return callback(err, null);
      }
      if (!pat) {
        return callback(null, null);
      }
      logger.debug('cache the GitHub pat for current user');
      patCache.set(userName, pat, null, function(err, _) {
        if (err) {
          logger.error(err);
        }
        callback(null, pat);
      });
    });
  });
};

module.exports = {
  getPAT: getPatWithCache,
};
