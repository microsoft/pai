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

const template = require('./template-list.component.ejs');
const itemTemplate = require('./template-list.item.component.ejs');
const webportalConfig = require('../../config/webportal.config.js');
const githubThrottled = require('../template-common/github-throttled');
require('./template-list.component.css');
const url = require('url');

$('#sidebar-menu--template-view').addClass('active');

const context = {
  parseType: function(raw) {
    return {
      'job': 'job',
      'dockerimage': 'docker',
      'script': 'script',
      'data': 'data',
    }[raw];
  },
};

function request(type, query) {
  if (type === 'docker') type = 'dockerimage';
  const uri = query
    ? `${webportalConfig.restServerUri}/api/v2/template?query=${encodeURIComponent(query)}&type=${type}`
    : `${webportalConfig.restServerUri}/api/v2/template/${type}`;

  return req(1);

  function req(page) {
    return $.getJSON(uri, {pageno: page})
      .then(render)
      .then(function(data) {
        if (data.pageNo * data.pageSize < data.totalCount) {
          return req(+data.pageNo + 1);
        }
      }).catch(function(error) {
        if (!githubThrottled()) {
          throw error;
        }
      });
  }
}

function render(data) {
  $('#result-count').text(data.totalCount);
  $('#results').append(itemTemplate.call(context, data));
  return data;
}

$(function() {
  const query = url.parse(window.location.href, true).query;

  if (!(query.type in {job: true, docker: true, script: true, data: true})) {
    return window.location.href = '/';
  }

  $('#content-wrapper').html(template({type: query.type, query: query.query}));

  request(query.type, query.query);
});
