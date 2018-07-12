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

const yaml = require('js-yaml');
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const templateViewComponent = require('./template-view.component.ejs');
const templateTableComponent = require('./template-table.component.ejs');
const resourceTableComponent = require('./resource-table.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');

let templateTable = null;
let resourceTable = null;

const templateViewHtml = templateViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  templateTable: templateTableComponent,
  resourceTable: resourceTableComponent
});

const generateQueryString = function(data) {
  return '?name=' + encodeURIComponent(data.name) + '&version='
    + encodeURIComponent(data.version);
};

const loadRecommended = function() {
  $.getJSON(`${webportalConfig.restServerUri}/api/v1/template/recommend`,
    function(data) {
      data.forEach(function(item) {
        var qs = generateQueryString(item);
        $('#recommend-list').append(`
          <li>
            <button class="btn btn-danger" type="button"
              onclick="window.location.href='/import.html${qs}'">
              <span class="badge">Hot</span>
              ${item.name} - ${item.type}
            </button>
          </li>
        `);
      });
    }
  );
};

const extractAndFormat = function(propertyName) {
  return function(row, type, val, meta) {
    var array = [];
    row[propertyName].forEach(function(item) {
      array.push(item.name + ':' + item.version);
    });
    return array.join(',');
  }
};

const loadTemplates = function() {
  $('#view-table').html(templateTableComponent());
  const $table = $('#template-table')
    .on('preXhr.dt', loading.showLoading)
    .on('xhr.dt', loading.hideLoading);

  templateTable = $table.dataTable({
    ajax: {
      url: `${webportalConfig.restServerUri}/api/v1/template`,
      type: 'GET',
      dataSrc: (data) => {
        if (data.code) {
          alert(data.message);
        } else {
          return data;
        }
      },
    },
    'columns': [
      {
        title: 'Template',
        data: 'name'
      },
      {
        title: 'Type',
        data: 'type'
      },
      {
        title: 'Constributor',
        data: function(data, type, set, meta) {
          return data['contributors'].join(',');
        },
        orderable: false
      },
      {
        title: 'Datasets',
        data: extractAndFormat('datasets'),
        orderable: false
      },
      {
        title: 'Scripts',
        data: extractAndFormat('scripts'),
        orderable: false
      },
      {
        title: 'Dockers',
        data: extractAndFormat('dockers'),
        orderable: false
      },
      {
        title: 'Description',
        data: 'description',
        orderable: false
      },
      {
        title: 'Operation',
        data: generateQueryString,
        orderable: false,
        searchable: false,
        render: function(qs, type) {
          return '<button class="btn btn-default btn-sm" onclick="window.location.href=\'/import.html'
            + qs + '\'">Use</button>';
        }
      },
    ],
    'order': [
      [0, 'asc']
    ],
    'scrollY': (($(window).height() - 265)) + 'px',
    'lengthMenu': [[20, 50, 100, -1], [20, 50, 100, 'All']],
    'deferRender': true,
    'autoWidth': false,
  }).api();
};

const resizeContentWrapper = function(event) {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  if (templateTable != null) {
    $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
    templateTable.columns.adjust().draw();
  }
};

const analyzeFile = function(source) {
  $('#form-table').html(resourceTableComponent());
  resourceTable = null;
  if (source.files && source.files[0]) {
    if (window.FileReader) {
      var file = source.files[0];
      var fr = new FileReader();
      fr.onload = function(e) {
        if (e.target.result) {
          try {
            var data = yaml.safeLoad(e.target.result);
            resources = [
              {
                'name': data.job.name,
                'type': 'job',
                'version': data.job.version
              }
            ];
            data.prerequisites.forEach(function (element) {
              resources.push({
                'name': element.name,
                'type': element.type,
                'version': element.version
              });
            });
            resourceTable = $('#resource-table').DataTable({
              data: resources,
              columns: [
                {
                  title: 'Name',
                  data: 'name'
                },
                {
                  title: 'Type',
                  data: 'type'
                },
                {
                  title: 'Version',
                  data: 'version'
                },
                {
                  title: 'Include',
                  data: null,
                  orderable: false,
                  searchable: false,
                  render: function(data, type) {
                    return `<input type="checkbox" name="included" value="${data.name}:${data.version}" checked="checked" />`;
                  }
                }
              ],
              'order': [
                [0, 'asc']
              ],
              'autoWidth': false,
              'deferRender': true,
              'paging': false,
              'info': false,
              'searching': false
            });
            resourceTable.originData = data;
            resourceTable.originFileName = file.name;
            return;
          } catch (e) {
            if (e.message) {
              return alert(e);
            }
          }
        }
        alert('Failed to read the selected file.');
      };
      fr.readAsText(file);
    } else {
      alert('The browser does not support preview text file!');
    }
  }
};

const submitTemplate = function(source) {
  var ajaxData = {
    'template': resourceTable.originData,
    'included': [],
    'filename': resourceTable.originFileName
  }
  $('[name="included"]').each(function(index, element) {
    if (element.checked) {
      ajaxData['included'].push(element.value);
    }
  });

  //$('#shareModal').modal('hide');
  if (resourceTable != null) {
    //loading.showLoading();
    userAuth.checkToken((token) => {
      $.ajax({
        type: "POST",
        url: `${webportalConfig.restServerUri}/api/v1/template`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: ajaxData,
        dataType: 'json',
        success: function() {
          alert('success!');
          //loading.hideLoading();
        },
        error: function(xhr, status, error) {
          var res = JSON.parse(xhr.responseText);
          alert(res.message ? res.message : res.toString());
          //loading.hideLoading();
        }
      });
    });
  }
};

window.analyzeFile = analyzeFile;
window.onresize = resizeContentWrapper;
window.submitTemplate = submitTemplate;

$('#content-wrapper').html(templateViewHtml);

$(document).ready(() => {
  $('#sidebar-menu--template-view').addClass('active');
  $('#content-wrapper').css({'overflow': 'hidden'});
  resizeContentWrapper();
  loadTemplates();
  loadRecommended();
});

module.exports = {loadTemplates};
