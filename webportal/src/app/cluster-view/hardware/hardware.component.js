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

// module dependencies
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

const calculateLoadLevel = (percentage) => {
  let loadLevel = 0;
  if (percentage < 10) {
    loadLevel = 0;
  } else if (percentage >= 10 && percentage < 30) {
    loadLevel = 1;
  } else if (percentage >= 30 && percentage < 80) {
    loadLevel = 2;
  } else if (percentage >= 80) {
    loadLevel = 3;
  }
  return loadLevel;
}

//

const setIcon = (cellId, loadLevel) => {
  let classValue = "fa fa-spinner fa-pulse fa-fw text-grey";
  let titleValue = "0";
  if (loadLevel == 0) {
    classValue = "fa fa-circle-thin text-grey";
    titleValue = "0";
  } else if (loadLevel == 1) {
    classValue = "fa fa-circle text-green";
    titleValue = "1";
  } else if (loadLevel == 2) {
    classValue = "fa fa-circle text-yellow";
    titleValue = "2";
  } else if (loadLevel == 3) {
    classValue = "fa fa-circle text-red";
    titleValue = "3";
  }
  $(cellId).attr('class', classValue);
  $(cellId).attr('title', titleValue);
}

//

const loadCpuUtilData = (prometheusUri, currentEpochTimeInSeconds) => {
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
        const loadLevel = calculateLoadLevel(percentage);
        setIcon(cellId, loadLevel);
      }
    },
    error: function() {
      alert("Error when loading CPU utilization data.");
    }
  });
}

//

const loadMemUtilData = (prometheusUri, currentEpochTimeInSeconds) => {
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
            const loadLevel = calculateLoadLevel(percentage);
            setIcon(cellId, loadLevel);
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
      loadCpuUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds);
      loadMemUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds);
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
