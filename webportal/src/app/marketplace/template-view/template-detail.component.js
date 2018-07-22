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


require('./template-detail.component.scss');

const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
const detailComponent = require('./template-detail.component.ejs');

const loadSummary = function() {
  const searchParams = new URLSearchParams(window.location.search);
  let type = searchParams.get('type');
  let name = searchParams.get('name');
  let version = searchParams.get('version');
  if (!type || !name || !version) {
    window.location.href = "/template.html"
  } else {
    $('#txt-name').text(name);
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/template/${type}/${name}/${version}`,
      type: 'GET',
      dataType: 'json',
      success: function (data) {
        var template = data.job ? data.job : data;
        $('#txt-contributor').text(template.contributor);
        $('#txt-description').text(template.description);
      }
    });
    $('#btn-use').click(function(event) {
      window.location.href = "/import.html" + window.location.search
    });
  }
}

$('#content-wrapper').html(detailComponent({
  breadcrumbHtml: breadcrumbComponent({
    breadcrumbTitle: 'Template',
    pages: [
      {
        title: 'Marketplace',
        path: '/template.html'
      },
      {
        title: 'Template',
        path: '#'
      },
    ]
  }),
}));

// detail page start
$(document).ready(() => {
  $('#sidebar-menu--template-view').addClass('active');
  loadSummary();
});
