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


const base64 = require('js-base64').Base64;
const github = require('@octokit/rest');
const https = require('https');
const url = require('url');
const yaml = require('js-yaml');

const logger = require('../config/logger');
const config = require('../config/github');

const contentUrlPrefix = `https://raw.githubusercontent.com/${config.owner}/${config.repository}`;

/**
 * Get template content by the given qualifier.
 * @param {*} options A MAP object containing keys 'type', 'name', 'version'.
 * @param {*} callback A function object accepting 2 parameters which are error and result.
 */
const load = (options, callback) => {
  let ref = options.version ? options.version : config.branch;
  let responses = [];
  let contentUrl = `${contentUrlPrefix}/${ref}/${config.path}/${options.type}/${options.name}.yaml`;
  logger.debug('fetch content of ' + contentUrl);
  https.get(contentUrl, function(res) {
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
      }
    }).on('error', function(e) {
      callback(e, null);
    });
  });
};

const getAuthenticatedClient = (pat) => {
  let client = github();
  client.authenticate({
    type: 'token',
    token: pat,
  });
  return client;
};

/**
 * Save the template.
 * @param {*} options A MAP object containing keys 'type', 'name', 'template', and 'pat'.
 * @param {*} callback A function object accepting 2 parameters which are error and result.
 */
const save = function(options, callback) {
  let type = options.type;
  let name = options.name;
  let template = options.template;
  let pat = options.pat;
  try {
    let client = getAuthenticatedClient(pat);
    let b64text = base64.encode(yaml.dump(template));
    client.repos.createFile({
      owner: config.owner,
      repo: config.repository,
      path: `${config.path}/${type}/${name}.yaml`,
      message: 'Create template from PAI Marketplace.',
      content: b64text,
    }, function(err, res) {
      if (err) {
        // Maybe existed, try to update
        update({
          type: type,
          name: name,
          b64text: b64text,
          client: client,
        }, callback);
      } else {
        logger.debug(res);
        callback(null, {
          new: true,
          summary: createSummary(type, name, res),
        });
      }
    });
  } catch (err) {
    return callback(err, null);
  }
};

/**
 * Update the template.
 * @param {*} options A MAP object containing keys 'type', 'name', 'b64text' and 'client'.
 * @param {*} callback A function object accepting 2 parameters which are error and result.
 */
const update = function(options, callback) {
  let type = options.type;
  let name = options.name;
  let b64text = options.b64text;
  let client = options.client;
  client.repos.getContent({
    owner: config.owner,
    repo: config.repository,
    path: `${config.path}/${type}/${name}.yaml`,
  }, function(err, res) {
    if (err) {
      return callback(err, null);
    } else {
      client.repos.updateFile({
        owner: config.owner,
        repo: config.repository,
        path: res.data.path,
        message: 'Update template from PAI Marketplace.',
        content: b64text,
        sha: res.data.sha,
      }, function(err, res) {
        if (err) {
          logger.error(`Error when trying to update file ${type}/${name}.yaml`);
          callback(err, null);
        } else {
          logger.debug(res);
          callback(null, {
            new: false,
            summary: createSummary(type, name, res),
          });
        }
      });
    }
  });
};

const createSummary = (type, name, res) => {
  return {
    type: type,
    name: name,
    version: res.data.commit.sha,
    contributor: res.data.commit.author.name,
  };
};

const defaultGithubClient = github();

const getAuthenticatedClientOrDefault = (options) => {
  let pat = options.pat;
  if (pat) {
    try {
      return getAuthenticatedClient(pat);
    } catch (_) {
      logger.error('authentication failed with pat ' + pat);
    }
  }
  logger.debug('use anonymous GitHub client');
  return defaultGithubClient;
};

/**
 * Get related templates by the given query.
 * @param {*} options A MAP object containing keys 'keywords', 'type', 'pageSize', 'pageNo'.
 * @param {*} callback A function object accepting 2 parameters which are error and result.
 */
const search = (options, callback) => {
  let params = createQuery(options);
  let client = getAuthenticatedClientOrDefault(options);
  logger.debug(params);
  client.search.code(params, function(err, res) {
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
    q: `in:file+language:yaml+repo:${config.owner}/${config.repository}+path:${config.path}`,
    per_page: 5,
    page: 1,
  };
  if (options.type) {
    params.q += `/${options.type}`;
  }
  if (options.keywords) {
    params.q = options.keywords + `+${params.q}`;
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
  if (list && list.length) {
    let completed = 0;
    list.forEach(function(item) {
      let responses = [];
      let remoteUrl = url.parse(item.url, true);
      let ref = remoteUrl.query.ref;
      let contentUrl = `${contentUrlPrefix}/${ref}/${item.path}`;
      logger.debug('fetch content of ' + contentUrl);
      https.get(contentUrl, function(res) {
        res.on('data', function(chunk) {
          responses.push(chunk);
        });
        res.on('end', function() {
          if (res.statusCode == 200) {
            try {
              let one = yaml.safeLoad(responses.join(''));
              templates.push({
                type: one.type,
                name: one.name,
                contributor: one.contributor,
                version: ref,
                description: one.description,
                score: item.score,
              });
            } catch (err) {
              logger.error('failed to parse YAML at ' + contentUrl);
            }
          } else {
            logger.error(res.statusMessage);
          }
          if (++completed >= list.length) {
            callback(null, templates);
          }
        });
      }).on('error', function(e) {
        completed -= list.length; // Ensure callback is called only once
        callback(e, null);
      });
    });
  } else {
    callback(null, templates);
  }
};

module.exports = {
  load,
  save,
  search,
};
