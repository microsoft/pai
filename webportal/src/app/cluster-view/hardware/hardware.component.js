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
require('datatables.net-plugins/sorting/ip-address.js');
require('datatables.net-plugins/sorting/title-numeric.js');
const url = require('url');
const hardwareComponent = require('./hardware.component.ejs');
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');

//

const getCellHtml = (percentage) => {
  let classValue = "fa fa-circle";
  let h = (1.0 - percentage / 100) * 240;
  let s = 100;
  let l = 50;
  border = false;
  if (h > 180) {
    l = 50 + (h - 180) / 60 * 50;
    h = 180;
    border = true;
  }
  const colorString = "hsl(" + h + "," + s + "%," + l + "%)";
  let cellHtml = "";
  if (border) {
    cellHtml += "<span class='fa-stack' title=\"" + percentage + "\" style='width:14px;height:14px;'>";
    cellHtml += "<i class='fa fa-circle fa-stack-1x' style='top:-7px;color:" + colorString + "'></i>";
    cellHtml += "<i class='fa fa-circle-o fa-stack-1x' style='top:-7px;color:cyan'></i>";
    cellHtml += "</span>";
  } else {
    cellHtml += "<i class='fa fa-circle' title=\"" + percentage + "\" style='color:" + colorString + "'></i>";
  }
  return cellHtml;
}

//

const loadCpuUtilData = (prometheusUri, currentEpochTimeInSeconds, table) => {
  const metricGranularity = "1m";
  $.ajax({
    type: 'GET',
    url: prometheusUri + "/api/v1/query_range?" +
      "query=100%20-%20(avg%20by%20(instance)(irate(node_cpu%7Bmode%3D%22idle%22%7D%5B" + metricGranularity + "%5D))%20*%20100)" +
      "&start=" + currentEpochTimeInSeconds + "&end=" + currentEpochTimeInSeconds + "&step=1",
    success: function(data) {
      const result = data.data.result;
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        const cellId = "#" + CSS.escape("cpu:" + item.metric.instance);
        const percentage = item.values[0][1];
        const cellHtml = getCellHtml(percentage);
        table.cell(cellId).data(cellHtml).draw();
      }
    },
    error: function() {
      alert("Error when loading CPU utilization data.");
    }
  });
}

//

const loadMemUtilData = (prometheusUri, currentEpochTimeInSeconds, table) => {
  $.ajax({
    type: 'GET',
    url: prometheusUri + "/api/v1/query_range?" +
      "query=node_memory_MemTotal+-+node_memory_MemFree+-+node_memory_Buffers+-+node_memory_Cached" +
      "&start=" + currentEpochTimeInSeconds + "&end=" + currentEpochTimeInSeconds + "&step=1",
    success: function(usedMemData) {
      let usedMemDict = {};
      const result = usedMemData.data.result;
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        usedMemDict[item.metric.instance] = item.values[0][1];
      }
      $.ajax({
        type: 'GET',
        url: prometheusUri + "/api/v1/query_range?" +
          "query=node_memory_MemTotal" +
          "&start=" + currentEpochTimeInSeconds + "&end=" + currentEpochTimeInSeconds + "&step=1",
        success: function(totalMemData) {
          const result = totalMemData.data.result;
          for (let i = 0; i < result.length; i++) {
            const item = result[i];
            const cellId = "#" + CSS.escape("mem:" + item.metric.instance);
            const percentage = usedMemDict[item.metric.instance] / item.values[0][1] * 100;
            const cellHtml = getCellHtml(percentage);
            table.cell(cellId).data(cellHtml).draw();
          }
        },
        error: function() {
          alert("Error when loading memory utilization data (step 2).");
        }      
      });
    },
    error: function() {
      alert("Error when loading memory utilization data (step 1).");
    }
  });
}

//

const loadData = () => {
  const currentEpochTimeInSeconds = (new Date).getTime() / 1000;
  let table = null;
  $.ajax({
    type: 'GET',
    url: webportalConfig.prometheusUri + "/api/v1/query?" +
        "query=node_uname_info&time=" + currentEpochTimeInSeconds,
    success: function(data) {
      const hardwareHtml = hardwareComponent({
        breadcrumb: breadcrumbComponent,
        grafanaUri: webportalConfig.grafanaUri,
        machineMetaData: data
      });
      $('#content-wrapper').html(hardwareHtml);
      table = $('#hardware-table').DataTable({
        "scrollY": (($(window).height() - 265)) + 'px',
        "lengthMenu": [[20, 50, 100, -1], [20, 50, 100, "All"]],
        columnDefs: [
          { type: 'natural', targets: [0] },
          { type: 'ip-address', targets: [1] },
          { type: 'title-numeric', targets: [2, 3, 4, 5, 6, 7] }
        ]
      });
      loadCpuUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds, table);
      loadMemUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds, table);
    },
    error: function() {
      alert("Error when loading data.");
    }
  });
}

//

function resizeContentWrapper() {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
}

//

window.onresize = function (envent) {
  resizeContentWrapper();
}

//

$(document).ready(() => {
  resizeContentWrapper();
  $("#sidebar-menu--cluster-view").addClass("active");
  $("#sidebar-menu--cluster-view--hardware").addClass("active");
  loadData();
});
