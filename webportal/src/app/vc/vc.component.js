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

//

require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/title-numeric.js');
const url = require('url');
//
require('./vc.component.scss');
const vcComponent = require('./vc.component.ejs');
const breadcrumbComponent = require('../job/breadcrumb/breadcrumb.component.ejs');
const webportalConfig = require('../config/webportal.config.json');
//
let table = null;

//

const loadData = (specifiedVc) => {
  $.ajax({
    type: 'GET',
    url: webportalConfig.restServerUri + '/api/v1/virtual-clusters',
    success: function(data) {
      const vcHtml = vcComponent({
        breadcrumb: breadcrumbComponent,
        specifiedVc: specifiedVc,
        data: data,
        formatNumber: formatNumber,
        yarnWebPortalUri: webportalConfig.yarnWebPortalUri,
        grafanaUri: webportalConfig.grafanaUri,
      });
      $('#content-wrapper').html(vcHtml);
      table = $('#vc-table').dataTable({
        scrollY: (($(window).height() - 265)) + 'px',
        lengthMenu: [[20, 50, 100, -1], [20, 50, 100, 'All']],
        columnDefs: [
          {type: 'natural', targets: [0, 1, 2, 3, 4, 5, 6]},
        ],
      }).api();
    },
    error: function() {
      alert('Error when loading data.');
    },
  });
};

//

const formatNumber = (x, precision) => {
  const n = Math.pow(10, precision);
  return (Math.round(x * n) / n).toFixed(precision);
};

//

const resizeContentWrapper = () => {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  if (table != null) {
    $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
    table.columns.adjust().draw();
  }
};

//

$(document).ready(() => {
  $('#sidebar-menu--vc').addClass('active');
  window.onresize = function(envent) {
    resizeContentWrapper();
  };
  resizeContentWrapper();
  loadData(url.parse(window.location.href, true).query['vcName']);
});
