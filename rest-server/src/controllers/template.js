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


const cacheWrapper = require('../middlewares/cache');
const config = require('../config/template');
const github = require('../models/github');
const logger = require('../config/logger');
const template = require('../models/template');

const fetch = (req, cb) => {
  let type = req.params.type;
  if (!type || !config.types.includes(type)) {
    return cb({
      code: 400,
      message: 'Found illegal type value in the request.',
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
  let type = req.query.type;
  if (type && !config.types.includes(type)) {
    return cb({
      code: 400,
      message: 'Found illegal type value in the request.',
    });
  }
  let account = req.user ? req.user.username : null;
  github.getPAT(account, function(err, pat) {
    template.search({
      keywords: query,
      pageNo: req.query.pageno,
      type: type,
      pat: err ? null : pat,
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
  });
};

const list = (req, cb) => {
  let type = req.params.type;
  if (!config.types.includes(type)) {
    return cb({
      code: 400,
      message: 'Found illegal type value in the request.',
    });
  }
  template.search({
    pageNo: req.query.pageno,
    type: type,
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

const fetchWithCache = cacheWrapper(fetch);
const filterWithCache = cacheWrapper(filter);
const listWithCache = cacheWrapper(list);

const share = (req, res) => {
  let item = req.body;
  let type = item.type;
  let name = item.name;
  if (!type || !name) {
    return res.status(400).json({
      'message': 'Failed to parse template content.',
    });
  }
  let account = req.user.username;
  logger.debug(`${account} is trying to share template.`);
  github.getPAT(account, function(err, pat) {
    if (err) {
      logger.error(err);
      return res.status(500).json({
        message: 'Failed to fetch GitHub PAT for current user.',
      });
    }
    if (!pat) {
      return res.status(500).json({
        message: 'Current user has not registered a GitHub PAT.',
      });
    }
    template.save({
      type: type,
      name: name,
      template: item,
      pat: pat,
    }, function(err, saved) {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          message: 'Failed to save the template. Current Github PAT may not have write access to template repo. Error: {{Code:' + err.code + '},'+ err.message + '}',
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
