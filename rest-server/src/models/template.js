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


const https = require('https');
const github = require('@octokit/rest')();
const yaml = require('js-yaml');

const logger = require('../config/logger');
const config = require('../config/github');

/**
 * Get related templates by the given query.
 */
const filter = (text, perSize, pageNo, callback) => {
  github.search.code({
    q: createQuery(text),
    per_page: perSize,
    page: pageNo,
  }, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      let urls = [];
      res.data.items.forEach(function(item) {
        urls.push(createDownloadUrl(item.path));
      });
      downloadInParallel(urls, callback);
    }
  });
};

createQuery = (text) => {
  return text + `+in:file+language:yaml+repo:${config.owner}/${config.repository}`; 
};

createDownloadUrl = (path) => {
  return `https://raw.githubusercontent.com/${config.owner}/${config.repository}/master/${path}`;
};

/**
 * Get the top K templates by the given type.
 */
const top = (type, count, callback) => {
  github.repos.getContent({
    owner: config.owner,
    repo: config.repository,
    path: type,
  }, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      let len = Math.min(count, res.data.length);
      let urls = [];
      for (let i = 0; i < len; i++) {
        urls.push(res.data[i].download_url);
      }
      downloadInParallel(urls, callback);
    }
  });
};

const downloadInParallel = (urls, callback) => {
  let templates = [];
  let completed = 0;
  urls.forEach(function(url) {
    let responses = [];
    https.get(url, function(res) {
      res.on('data', function(chunk) {
        responses.push(chunk);
      });
      res.on('end', function() {
        let body = responses.join('');
        try {
          let item = yaml.safeLoad(body);
          templates.push(item);
        } catch (e) {
          logger.error(e);
        }
        if (++completed >= urls.length) {
          callback(null, templates);
        }
      });
    }).on('error', function(e) {
      logger.error(e);
      completed++;
    });
  });
};

module.exports = {
  filter,
  top,
};
