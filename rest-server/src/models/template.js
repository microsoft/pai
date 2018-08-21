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


const github = require('@octokit/rest')();
const https = require('https');
const url = require('url');
const yaml = require('js-yaml');

const logger = require('../config/logger');
const config = require('../config/github');

/**
 * Get template content by the given qualifier.
 * @param {*} options A MAP object containing keys 'type', 'name', 'version'.
 * @param {*} callback A function object accepting 2 parameters which are error and result. 
 */
const load = (options, callback) => {
  let ref = options.version ? options.version : 'master';
  let responses = [];
  let path = `${config.owner}/${config.repository}/${ref}/${options.type}/${options.name}.yaml`;
  https.get('https://raw.githubusercontent.com/' + path, function(res) {
    res.on('data', function(chunk) {
      responses.push(chunk);
    });
    res.on('end', function() {
      if (res.statusCode == 200) {
        let body = responses.join('');
        let item = yaml.safeLoad(body);
        item.version = ref;
        callback(null, item);
      } else {
        callback(new Error(res.statusMessage), null);
      };
    }).on('error', function(e) {
      callback(e, null);
    });;
  });
};

/**
 * Get related templates by the given query.
 * @param {*} options A MAP object containing keys 'keywords', 'type', 'pageSize', 'pageNo'.
 * @param {*} callback A function object accepting 2 parameters which are error and result.
 */
const search = (options, callback) => {
  let params = createQuery(options);
  logger.debug(params);
  github.search.code(params, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      downloadInParallel(res.data.items, function(err, templates) {
        callback(err, {
          totalCount: res.data.total_count,
          pageNo: params.page,
          pageSize: params.per_page,
          items: templates,
        });
      });
    }
  });
};

const createQuery = (options) => {
  let params = {
    q: `in:file+language:yaml+repo:${config.owner}/${config.repository}`,
    per_page: 5,
    page: 1,
  };
  if (options.keywords) {
    params.q = options.keywords + `+${params.q}`;
  }
  if (options.type) {
    params.q += `+path:${options.type}`;
  }
  if (options.pageSize) {
    params.per_page = options.pageSize;
  }
  if (options.pageNo) {
    params.page = options.pageNo;
  }
  return params;
};

const downloadInParallel = (list, callback) => {
  let templates = [];
  let completed = 0;
  list.forEach(function(item) {
    let responses = [];
    let remoteUrl = url.parse(item.url, true);
    https.get({
      host: remoteUrl.host,
      path: remoteUrl.path,
      headers: {
        'Accept': 'application/vnd.github.VERSION.raw',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0',
      },
    }, function(res) {
      res.on('data', function(chunk) {
        responses.push(chunk);
      });
      res.on('end', function() {
        if (res.statusCode == 200) {
          let one = yaml.safeLoad(responses.join(''));
          templates.push({
            type: one.type,
            name: one.name,
            contributor: one.contributor,
            version: remoteUrl.query.ref,
          });
        } else {
          logger.error(res.statusMessage);
        };
        if (++completed >= list.length) {
          callback(null, templates);
        }
      });
    }).on('error', function(e) {
      completed -= list.length; // Ensure callback is called only once
      callback(e, null);
    });
  });
};

module.exports = {
  load,
  search,
};
