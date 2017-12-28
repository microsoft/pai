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
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/ip-address.js');
const url = require('url');
const hardwareComponent = require('./hardware.component.ejs');
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');

const hardwareHtml = hardwareComponent({
  breadcrumb: breadcrumbComponent,
  grafanaUri: webportalConfig.grafanaUri
});

const loadMachines = () => {
  $.ajax({
    url: `http://10.151.40.179:9090/api/v1/pod`,
    type: 'GET',
    dataType: 'jsonp',
    success: (data) => {
      alert("yay!");
      loading.hideLoading();
      if (data.error) {
        alert(data.message);
      } else {
        $('#hardware-table').html(hardwareComponent({
          machines: data
        }));
      }
    },
    error: (xhr, textStatus, error) => {
      const res = JSON.parse(xhr.responseText);
      alert(res.message);
    }
  });
};

function resizeContentWrapper() {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
}

window.onresize = function (envent) {
  resizeContentWrapper();
}

$(document).ready(() => {
  //loadMachines();
  resizeContentWrapper();
  $("#sidebar-menu--cluster-view").addClass("active");
  $("#sidebar-menu--cluster-view--hardware").addClass("active");
  $('#content-wrapper').html(hardwareHtml);
  $('#hardware-table').DataTable({
    "scrollY": (($(window).height() - 265)) + 'px',
    "scrollCollapse": false,
    "lengthMenu": [[20, 50, 100, -1], [20, 50, 100, "All"]],
    columnDefs: [
      { type: 'natural', targets: [0] },
      { type: 'ip-address', targets: [1] }
    ]
  });
});
