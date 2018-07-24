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
const templateModalComponent = require('./template-modal.component');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const viewCardComponent = require('./view-cards.component.ejs');

$('#content-wrapper').html(templateViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
}));

const generateUI = function(type, data) {
  let newdata = [];
  data.forEach(function(item) {
    newdata.push({
      type: item.type,
      name: item.name,
      version: item.version,
      avatar: `/assets/img/${item.type}.png`,
      description: item.description,
      contributor: item.contributor,
      star: item.rating,
      downloads: item.count,
    });
  });
  return viewCardComponent({ type: type, data: newdata });
} 

const loadTemplates = function(name, generateTableName, postProcess) {
  const tablename = generateTableName(name);
  $(tablename).on('preXhr.dt', loading.showLoading)
    .on('xhr.dt', loading.hideLoading);
  $.ajax({
    url: `${webportalConfig.restServerUri}/api/v1/template/${name}`,
    type: 'GET',
    dataType: 'json',
    success: function (data) {
      $(tablename).html(generateUI(name, data));
      if (postProcess) {
        postProcess();
      }
    }
  });
};

const search = function(event, types, generateTableName, query, postProcess) {
  if (event == null || !event.keyCode || event.keyCode == 13) {
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
            if (item.type in categories) {
              categories[item.type].push(item);
            }
          });
          Object.keys(categories).forEach((type) => {
            $(generateTableName(type)).html(generateUI(type, categories[type]));
          });
          if (postProcess) {
            postProcess();
          } 
        }
      });
    } else {
      // No query, list popular templates
      window.location.reload(false);
    }
  }
};

$('#btn-search').click((event) => {
  search(event, ['data', 'dockerimage', 'script', 'job'], (type) => { return '#' + type + '-table-view'; }, 
    $('#search').val(), null);
});
$('#search').on('keyup', (event) => {
  search(event, ['data', 'dockerimage', 'script', 'job'], (type) => { return '#' + type + '-table-view'; }, 
    $('#search').val(), null);
});

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
  loadTemplates('job', (type) => { return '#' + type + '-table-view'; }, null);
  loadTemplates('data', (type) => { return '#' + type + '-table-view'; }, null);
  loadTemplates('script', (type) => { return '#' + type + '-table-view'; }, null);
  loadTemplates('dockerimage', (type) => { return '#' + type + '-table-view'; }, null);
  window.dispatchEvent(new Event('resize'));
});

module.exports = { loadTemplates, search };