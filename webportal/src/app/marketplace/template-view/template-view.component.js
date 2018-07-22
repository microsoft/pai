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

$('#content-wrapper').html(templateViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  template: templateTableComponent,
}));

const generateQueryString = function(data) {
  return 'type=' + encodeURIComponent(data.type) + '&name=' + encodeURIComponent(data.name) + '&version='
    + encodeURIComponent(data.version);
};

const generateUI = function(type, data) {
  let htmlstr = '';
  let itemNum = 0;
  let itemLimit = parseInt(($(window).width() - 230) / 200 - 2);
  console.log(itemLimit);
  data.forEach((item) => {
    if (itemNum % itemLimit == 0) {
      if (itemNum == 0) {
        htmlstr += '<div class=\"item active\">' + '<div class=\"row\">';
      } else {
        htmlstr += '</div></div><div class=\"item\">' + '<div class=\"row\">';
      }
    }
    htmlstr += '<a href=\"/detail.html?' + generateQueryString(item) + '\">' +
                '<div class=\"card\">' + 
                '<div class=\"img-container\">' +
                '<img src=\"/assets/img/' + type + '.png\" height=\"100%\">' +
                '</div>' +
                '<div class=\"text-container\">' +
                '<span class=\"item-title\">' + item.name + '</span>' +
                '<span class=\"item-dsp\">' + item.description + '</span>' + 
                '<div class=\"star-rating\">';
    for (let i = 0; i < 4; i++) {
      htmlstr += '<span class=\"fa fa-star span-left\"></span>';
    }
    for (let i = 4; i < 5; i++) {
      htmlstr += '<span class=\"fa fa-star-o span-left\"></span>'
    }
    htmlstr += '<span class=\"fa fa-download span-right\">' + item.count + '</span>' +
                '</div>' + 
                '</div>' + 
                '</div>' + 
                '</a>';
    itemNum += 1;
  });
  if (itemNum != 0) {
    htmlstr += '</div></div>';
  }
  return htmlstr;
};

const loadTemplates = function(name, tableprefix) {
  const tablename = '#' + tableprefix + name + '-table';
  $(tablename).on('preXhr.dt', loading.showLoading)
    .on('xhr.dt', loading.hideLoading);
  $.ajax({
    url: `${webportalConfig.restServerUri}/api/v1/template/${name}`,
    type: 'GET',
    dataType: 'json',
    success: function (data) {
      $(tablename).html(generateUI(name, data));
    }
  });
};

const search = function(event, types, tableprefix) {
  if (!event.keyCode || event.keyCode == 13) {
    var query = $('#search').val();
    if (query) {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/template?query=` + encodeURIComponent(query),
        type: 'GET',
        dataType: 'json',
        success: function (data) {
          let categories = {};
          types.forEach((item) => {
            categories[item] = [];
          })
          data.forEach((item) => {
              categories[item.type].push(item);
          });
          Object.keys(categories).forEach((type) => {
            $('#' + tableprefix + type + '-table').html(generateUI(type, categories[type]));
          }); 
        }
      });
    } else {
      // No query, list popular templates
      window.location.reload(false);
    }
  }
};

$('#btn-search').click(search, ['data', 'dockerimage', 'script', 'job'], '');
$('#search').on('keyup', search, ['data', 'dockerimage', 'script', 'job'], '');

$(window).resize(function(event) {
  $('#content-wrapper').css({'height': (($(window).height() - 200)) + 'px'});
});

$('#btn-share').click(function(event) {
  $('#modalPlaceHolder').html(templateModalComponent.generateHtml());
  templateModalComponent.initializeComponent();
  $('#shareModal').modal('show');
});

$(document).ready(() => {
  $('#sidebar-menu--template-view').addClass('active');
  $('#content-wrapper').css({'overflow': 'auto'});
  $('#table-view').html(templateTableComponent());
  loadTemplates('job', '');
  loadTemplates('data', '');
  loadTemplates('script', '');
  loadTemplates('dockerimage', '');
  window.dispatchEvent(new Event('resize'));
});

module.exports = { loadTemplates, search };