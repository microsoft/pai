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


// module dependencies
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const serviceTableComponent = require('./service-table.component.ejs');
const serviceViewComponent = require('./services.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const service = require('./service-info.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/ip-address.js');
require('datatables.net-plugins/sorting/title-numeric.js');
require('./service-view.component.scss');

const serviceViewHtml = serviceViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  serviceTable: serviceTableComponent,
});


const loadServices = () => {
  loading.showLoading();
  service.getServiceView(webportalConfig.k8sApiServerUri, 'default', (data) => {
    loading.hideLoading();
    $('#service-table').html(serviceTableComponent({
      data,
      k8sUri: webportalConfig.k8sDashboardUri,
      grafanaUri: webportalConfig.grafanaUri,
      exporterPort: webportalConfig.exporterPort,
    }));
    $('#service-datatable').dataTable({
      'scrollY': (($(window).height() - 265)) + 'px',
        'lengthMenu': [[20, 50, 100, -1], [20, 50, 100, 'All']],
        'columnDefs': [
          {orderDataType: 'dom-text', targets: [1, 2]},
          {type: 'ip-address', targets: [0]},
        ],
    }).api();
  });
};

window.loadServices = loadServices;

$('#sidebar-menu--cluster-view').addClass('active');
$('#sidebar-menu--cluster-view--services').addClass('active');

$('#content-wrapper').html(serviceViewHtml);
$(document).ready(() => {
  loadServices();
});

module.exports = {loadServices};


