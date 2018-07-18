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

const list = (req, res) => {
  template.top(req.params.type, 0, 10, function(err, list) {
    if (err) {
      logger.error(err);
      return res.status(500).json({
        'message': err.toString(),
      });
    }
    return res.status(200).json(list);
  });
};

const fetch = (req, res) => {
  let name = req.param('name');
  let version = req.param('version');
  template.load(name, version, (err, item) => {
    if (err) {
      logger.error(err);
      return res.status(404).json({
        'message': 'Not Found',
      });
    }
    return res.status(200).json(item);
  });
};

const share = (req, res) => {
  let content = req.body.template;
  let name = content.job.name;
  let version = content.job.version;
  template.has(name, version, function(err, has) {
    if (err) {
      logger.error(err);
      return res.status(500).json({
        message: 'Failed to detect the job template.',
      });
    }
    if (has) {
      return res.status(400).json({
        message: `The job template titled "${name}:${version} has already existed.".`,
      });
    }
    template.save(content, function(err, num) {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          message: 'IO error happened when stroing the job template.',
        });
      }
      let created = [];
      let existed = [];
      let failed = [];
      content.prerequisites.forEach(function(item) {
        template.has(item.name, item.version, function(err, has) {
          if (err) {
            logger.error(err);
            failed.push({
              'name': item.name,
              'version': item.version,
              'message': err.message ? err.message : err.toString(),
            });
          } else if (has) {
            existed.push({
              'name': item.name,
              'version': item.version,
            });
          } else {
            template.save(item, function(err, num) {
              if (err) {
                logger.error(err);
                failed.push({
                  'name': item.name,
                  'version': item.version,
                  'message': err.message ? err.message : err.toString(),
                });
              } else {
                created.push({
                  'name': item.name,
                  'version': item.version,
                });
              }
            });
          }
        });
      });
      res.status(200).json({
        'created': created,
        'existed': existed,
        'failed': failed,
      });
    });
  });
};

module.exports = {
  list,
  fetch,
  share,
};
