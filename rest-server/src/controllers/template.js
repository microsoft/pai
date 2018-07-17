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

// parse the json data to template summary format.
const toTemplateSummary = (data) => {
  let res = {
    'datasets': [],
    'scripts': [],
    'dockers': [],
  };
  if ('job' in data) {
    let d = data['job'];
    res['name'] = d['name'];
    res['type'] = 'job';
    res['version'] = d['version'];
    res['contributors'] = [d['contributor']]; // todo split the contributor string?
    res['description'] = d['description'];
  }
  if ('prerequisites' in data) {
    Object.keys(data['prerequisites']).forEach((key) => {
      let d = data['prerequisites'][key];
      let item = {
        'name': d['name'],
        'version': d['version'],
      };
      switch (d['type']) {
        case 'data':
          res['datasets'].push(item);
          break;
        case 'script':
          res['scripts'].push(item);
          break;
        case 'dockerimage':
          res['dockers'].push(item);
          break;
      }
    });
  }
  return res;
};

const list = (req, res) => {
  template.getTemplateList((err, list) => {
    if (err) {
      logger.error(err);
      return res.status(500).json({
        'message': err.toString(),
      });
    }
    let templateList = [];
    list.forEach((item) => {
      templateList.push(toTemplateSummary(item));
    });
    return res.status(200).json(templateList);
  });
};

const recommend = (req, res) => {
  let count = req.param('count', 3);
  template.getRankedTemplateList(0, 3, (err, list) => {
    if (err) {
      logger.error(err);
      return res.status(500).json({
        'message': err.toString(),
      });
    }
    if (count > list.length) {
      count = list.length;
    }
    let templateList = [];
    for (let i = 0; i < count; ++i) {
      templateList.push(toTemplateSummary(list[i]));
    }
    return res.status(200).json(templateList);
  });
};

const fetch = (req, res) => {
  let name = req.param('name');
  let version = req.param('version');
  template.getTemplate(name, version, (err, item) => {
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
  template.hasTemplate(name, version, (err, has) => {
    if (err) {
      logger.error(err);
      return res.status(500).json({
        message: 'IO error happened when detecting template.',
      });
    }
    if (has) {
      return res.status(400).json({
        message: `The template titled "${name}:${version} has already existed.".`,
      });
    }
    template.saveTemplate(name, version, content, (err, num) => {
      if (err) {
        logger.error(err);
        return res.status(500).json({
          message: 'IO error happened when stroing template.',
        });
      }
      res.status(201).json({
        name: name,
        version: version,
      });
    });
  });
};

module.exports = {
  list,
  recommend,
  fetch,
  share,
};
