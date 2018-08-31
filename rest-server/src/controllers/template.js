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


const logger = require('../config/logger');
const template = require('../models/template');
const userModel = require('../models/user');
const dbUtility = require('../util/dbUtil');

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
    cache.get(key, null, function(err, val) {
      if (err || !val) {
        handler(req, function(err, ret) {
          if (err) {
            res.status(err.code).json({
              message: err.message,
            });
          } else {
            cache.set(key, ret, null, function(err, _) {
              if (err) {
                logger.error(err);
              }
              res.status(ret.code).json(ret.data);
            });
          }
        });
      } else {
        logger.debug(`hit cache with "${key}"`);
        res.status(val.code).json(val.data);
      }
    });
  };
};

const fetch = (req, cb) => {
  let type = req.params.type;
  if (!type) {
    return cb({
      code: 400,
      message: 'Failed to extract "type" parameter in the request.',
    }, null);
  }
  let name = req.params.name;
  if (!name) {
    return cb({
      code: 400,
      message: 'Failed to extract "name" parameter in the request.',
    }, null);
  }
  template.load({
    type: type,
    name: name,
    version: req.query.version,
  }, (err, item) => {
    if (err) {
      logger.error(err);
      cb({
        code: 404,
        message: 'Failed to find any matched template.',
      }, null);
    } else {
      cb(null, {
        code: 200,
        data: item,
      });
    }
  });
};

const filter = (req, cb) => {
  let query = req.query.query;
  if (!query) {
    return cb({
      code: 400,
      message: 'Failed to extract "query" parameter in the request.',
    }, null);
  }
  template.search({
    keywords: query,
    pageNo: req.query.pageno,
  }, function(err, list) {
    if (err) {
      logger.error(err);
      cb({
        code: 500,
        message: 'Failed to scan templates.',
      }, null);
    } else {
      cb(null, {
        code: 200,
        data: list,
      });
    }
  });
};

const list = (req, cb) => {
  template.search({
    pageNo: req.query.pageno,
    type: req.params.type,
  }, function(err, list) {
    if (err) {
      logger.error(err);
      cb({
        code: 500,
        message: 'Failed to fetch templates from remote source.',
      }, null);
    } else {
      cb(null, {
        code: 200,
        data: list,
      });
    }
  });
};

const fetchWithCache = wrapWithCache(fetch);
const filterWithCache = wrapWithCache(filter);
const listWithCache = wrapWithCache(list);

const share = (req, res) => {
  let item = req.body;
  let type = item.type;
  let name = item.name;
  if (!type || !name) {
    return res.status(400).json({
      'message': 'Failed to parse template content.',
    });
  }
  let account = req.user.name;
  logger.debug(`${account} is tring to share template.`);
  userModel.getUserGithubPAT(account, function(err, pat) {
    if (err) {
      logger.error(err);
      return res.status(500).json({
        'message': 'Failed to fetch GitHub PAT for current user.',
      });
    }
    template.save(type, name, item, pat, function(err, saved) {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          message: 'Failed to save the template.',
        });
      }
      return res.status(saved.new ? 201 : 200).json(saved.summary);
    });
  });
};

module.exports = {
  fetch: fetchWithCache,
  filter: filterWithCache,
  list: listWithCache,
  share,
};
