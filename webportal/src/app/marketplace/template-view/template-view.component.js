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


require('bootstrap/js/modal.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('./template-view.component.scss');

const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const templateViewComponent = require('./template-view.component.ejs');
const templateTableComponent = require('./template-table.component.ejs');
const templateModalComponent = require('./template-modal.component');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');

let templateTable = null;

$('#content-wrapper').html(templateViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  templateTable: templateTableComponent,
}));

const extractAndFormat = function(propertyName) {
  return function(row, type, val, meta) {
    let array = [];
    row[propertyName].forEach(function(item) {
      array.push(item.name + ':' + item.version);
    });
    return array.join(',');
  };
};

const loadTemplates = function() {
  $('#view-table').html(templateTableComponent());
  const $table = $('#template-table')
    .on('preXhr.dt', loading.showLoading)
    .on('xhr.dt', loading.hideLoading);

  templateTable = $table.dataTable({
    'ajax': {
      url: `${webportalConfig.restServerUri}/api/v1/template/job`,
      type: 'GET',
      dataSrc: (data) => {
        if (data.code) {
          alert(data.message);
        } else {
          let list = [];
          data.forEach(function(item) {
            list.push(toJobSummary(item));
          });
          return list;
        }
      },
    },
    'columns': [
      {
        title: 'Template',
        data: 'name',
      },
      {
        title: 'Used',
        data: 'used',
      },
      {
        title: 'Constributor',
        data: 'contributor',
      },
      {
        title: 'Datasets',
        data: extractAndFormat('datasets'),
        orderable: false,
      },
      {
        title: 'Scripts',
        data: extractAndFormat('scripts'),
        orderable: false,
      },
      {
        title: 'Docker Images',
        data: extractAndFormat('dockerimages'),
        orderable: false,
      },
      {
        title: 'Description',
        data: 'description',
        orderable: false,
      },
      {
        title: 'Operation',
        data: function(job, type, val, meta) {
          return '?name=' + encodeURIComponent(job.name)
            + '&version=' + encodeURIComponent(job.version);
        },
        orderable: false,
        searchable: false,
        render: function(qs, type) {
          return '<button class="btn btn-default btn-sm" onclick="window.location.href=\'/import.html'
            + qs + '\'">Use</button>';
        },
      },
    ],
    'order': [
      [1, 'desc'],
    ],
    'scrollY': (($(window).height() - 265)) + 'px',
    'lengthMenu': [[20, 50, 100, -1], [20, 50, 100, 'All']],
    'deferRender': true,
    'autoWidth': false,
  }).api();
};

const toJobSummary = (template) => {
  let datasets = [];
  let scripts = [];
  let dockerimages = [];
  template.prerequisites.forEach((item) => {
    switch (item.type) {
      case 'data':
        datasets.push(item);
        break;
      case 'script':
        scripts.push(item);
        break;
      case 'dockerimage':
        dockerimages.push(item);
        break;
    }
  });
  let job = template.job;
  return {
    'name': job.name,
    'version': job.version,
    'contributor': job.contributor,
    'description': job.description,
    'used': template.count,
    'datasets': datasets,
    'scripts': scripts,
    'dockerimages': dockerimages,
  };
};

$(window).resize(function(event) {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  if (templateTable != null) {
    $('.dataTables_scrollBody').css('height', (($(window).height() - 315)) + 'px');
    templateTable.columns.adjust().draw();
  }
});

$('#btn-share').click(function(event) {
  $('#modalPlaceHolder').html(templateModalComponent.generateHtml());
  templateModalComponent.initializeComponent();
  $('#shareModal').modal('show');
});

$(document).ready(() => {
  $('#sidebar-menu--template-view').addClass('active');
  $('#content-wrapper').css({'overflow': 'hidden'});
  loadTemplates();
  window.dispatchEvent(new Event('resize'));
});
