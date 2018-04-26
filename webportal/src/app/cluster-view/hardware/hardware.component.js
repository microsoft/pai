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
require('./hardware.component.scss');
const hardwareComponent = require('./hardware.component.ejs');
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const webportalConfig = require('../../config/webportal.config.json');
//
let table = null;

//

const getCellId = (instanceName) => {
  return '#' + instanceName.replace(/(:|\.|\[|\]|,|=|@)/g, '\\$1');
};

//

const getCellHtml = (percentage) => {
  let innerColorString = '';
  let outerColorString = '';
  let loadLevelString = '';
  if (percentage < 10) {
    innerColorString = 'hsl(120, 100%, 40%)';
    outerColorString = 'hsl(120, 100%, 40%)';
    loadLevelString = 'Light load';
  } else if (percentage >= 10 && percentage < 90) {
    innerColorString = 'hsl(35, 100%, 50%)';
    outerColorString = 'hsl(35, 100%, 50%)';
    loadLevelString = 'Medium load';
  } else if (percentage >= 90) {
    innerColorString = 'hsl(0, 100%, 45%)';
    outerColorString = 'hsl(0, 100%, 45%)';
    loadLevelString = 'Heavy load';
  }
  const title = (Math.round(percentage * 100) / 100) + '% (' + loadLevelString + ')';
  let cellHtml = '';
  cellHtml += '<span title="' + percentage + '">';
  cellHtml += '<span class=\'fa-stack metric-span\' title=\'' + title + '\'>';
  cellHtml += '<i class=\'fa fa-circle fa-stack-1x metric-icon\' style=\'color:' + innerColorString + '\'></i>';
  cellHtml += '<i class=\'fa fa-circle-thin fa-stack-1x metric-icon\' style=\'color:' + outerColorString + '\'></i>';
  cellHtml += '</span>';
  return cellHtml;
};

//

const initCells = (idPrefix, instanceList, table) => {
  const noDataCellHtml = '<span title="-1"/><font color=\'silver\' title=\'\'>N/A</font>';
  for (let i = 0; i < instanceList.length; i++) {
    const cellId = getCellId(idPrefix + ':' + instanceList[i]);
    table.cell(cellId).data(noDataCellHtml);
  }
};

//

const loadCpuUtilData = (prometheusUri, currentEpochTimeInSeconds, instanceList, table) => {
  const metricGranularity = '5m';
  $.ajax({
    type: 'GET',
    url: prometheusUri + '/api/v1/query_range?' +
      'query=100%20-%20(avg%20by%20(instance)(irate(node_cpu%7Bmode%3D%22idle%22%7D%5B' + metricGranularity + '%5D))%20*%20100)' +
      '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
    success: function(data) {
      initCells('cpu', instanceList, table);
      const result = data.data.result;
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        const cellId = getCellId('cpu:' + item.metric.instance);
        const percentage = item.values[0][1];
        const cellHtml = getCellHtml(percentage);
        table.cell(cellId).data(cellHtml);
      }
    },
    error: function() {
      initCells('cpu', instanceList, table);
      alert('Error when loading CPU utilization data.');
    },
  });
};

//

const loadMemUtilData = (prometheusUri, currentEpochTimeInSeconds, instanceList, table) => {
  $.ajax({
    type: 'GET',
    url: prometheusUri + '/api/v1/query_range?' +
      'query=node_memory_MemTotal+-+node_memory_MemFree+-+node_memory_Buffers+-+node_memory_Cached' +
      '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
    success: function(dataOfMemUsed) {
      let dictOfMemUsed = {};
      const result = dataOfMemUsed.data.result;
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        dictOfMemUsed[item.metric.instance] = item.values[0][1];
      }
      $.ajax({
        type: 'GET',
        url: prometheusUri + '/api/v1/query_range?' +
          'query=node_memory_MemTotal' +
          '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
        success: function(dataOfMemTotal) {
          initCells('mem', instanceList, table);
          const result = dataOfMemTotal.data.result;
          for (let i = 0; i < result.length; i++) {
            const item = result[i];
            const cellId = getCellId('mem:' + item.metric.instance);
            const percentage = dictOfMemUsed[item.metric.instance] / item.values[0][1] * 100;
            const cellHtml = getCellHtml(percentage);
            table.cell(cellId).data(cellHtml);
          }
        },
        error: function() {
          initCells('mem', instanceList, table);
          alert('Error when loading memory utilization data (step 2).');
        },
      });
    },
    error: function() {
      initCells('mem', instanceList, table);
      alert('Error when loading memory utilization data (step 1).');
    },
  });
};

//

const loadGpuUtilData = (prometheusUri, currentEpochTimeInSeconds, instanceList, table) => {
  $.ajax({
    type: 'GET',
    url: prometheusUri + '/api/v1/query_range?' +
      'query=avg+by+(instance)(nvidiasmi_utilization_gpu)' +
      '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
    success: function(data) {
      initCells('gpu', instanceList, table);
      const result = data.data.result;
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        const cellId = getCellId('gpu:' + item.metric.instance);
        const percentage = item.values[0][1];
        const cellHtml = getCellHtml(percentage);
        table.cell(cellId).data(cellHtml);
      }
    },
    error: function() {
      initCells('gpu', instanceList, table);
      alert('Error when loading GPU utilization data.');
    },
  });
};

//

const loadGpuMemUtilData = (prometheusUri, currentEpochTimeInSeconds, instanceList, table) => {
  $.ajax({
    type: 'GET',
    url: prometheusUri + '/api/v1/query_range?' +
      'query=avg+by+(instance)(nvidiasmi_utilization_memory)' +
      '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
    success: function(data) {
      initCells('gpumem', instanceList, table);
      const result = data.data.result;
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        const cellId = getCellId('gpumem:' + item.metric.instance);
        const percentage = item.values[0][1];
        const cellHtml = getCellHtml(percentage);
        table.cell(cellId).data(cellHtml);
      }
    },
    error: function() {
      initCells('gpumem', instanceList, table);
      alert('Error when loading GPU memory utilization data.');
    },
  });
};

//

const loadDiskUtilData = (prometheusUri, currentEpochTimeInSeconds, instanceList, table) => {
  const metricGranularity = '5m';
  $.ajax({
    type: 'GET',
    url: prometheusUri + '/api/v1/query_range?' +
      'query=sum+by+(instance)(rate(node_disk_bytes_read%5B' + metricGranularity + '%5D))' +
      '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
    success: function(dataOfDiskBytesRead) {
      let dictOfDiskBytesRead = {};
      const result = dataOfDiskBytesRead.data.result;
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        dictOfDiskBytesRead[item.metric.instance] = item.values[0][1];
      }
      $.ajax({
        type: 'GET',
        url: prometheusUri + '/api/v1/query_range?' +
          'query=sum+by+(instance)(rate(node_disk_bytes_written%5B' + metricGranularity + '%5D))' +
          '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
        success: function(dataOfDiskBytesWritten) {
          initCells('disk', instanceList, table);
          const result = dataOfDiskBytesWritten.data.result;
          for (let i = 0; i < result.length; i++) {
            const item = result[i];
            const cellId = getCellId('disk:' + item.metric.instance);
            const diskBytesRead = dictOfDiskBytesRead[item.metric.instance];
            const diskBytesWritten = item.values[0][1];
            if (diskBytesRead && diskBytesWritten) {
              const p1 = Math.min(1, (diskBytesRead / 1024 / 1024) / 500) * 100;
              const p2 = Math.min(1, (diskBytesWritten / 1024 / 1024) / 500) * 100;
              const percentage = Math.max(p1, p2);
              const cellHtml = getCellHtml(percentage);
              table.cell(cellId).data(cellHtml);
            }
          }
        },
        error: function() {
          initCells('disk', instanceList, table);
          alert('Error when loading disk utilization data (step 2).');
        },
      });
    },
    error: function() {
      initCells('disk', instanceList, table);
      alert('Error when loading disk utilization data (step 1).');
    },
  });
};

//

const loadEthUtilData = (prometheusUri, currentEpochTimeInSeconds, instanceList, table) => {
  const metricGranularity = '5m';
  $.ajax({
    type: 'GET',
    url: prometheusUri + '/api/v1/query_range?' +
      'query=sum+by+(instance)(rate(node_network_receive_bytes%5B' + metricGranularity + '%5D))' +
      '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
    success: function(dataOfEthBytesRecieved) {
      let dictOfEthBytesRecieved = {};
      const result = dataOfEthBytesRecieved.data.result;
      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        dictOfEthBytesRecieved[item.metric.instance] = item.values[0][1];
      }
      $.ajax({
        type: 'GET',
        url: prometheusUri + '/api/v1/query_range?' +
          'query=sum+by+(instance)(rate(node_disk_bytes_written%5B' + metricGranularity + '%5D))' +
          '&start=' + currentEpochTimeInSeconds + '&end=' + currentEpochTimeInSeconds + '&step=1',
        success: function(dataOfEthBytesSent) {
          initCells('eth', instanceList, table);
          const result = dataOfEthBytesSent.data.result;
          for (let i = 0; i < result.length; i++) {
            const item = result[i];
            const cellId = getCellId('eth:' + item.metric.instance);
            const ethBytesReceived = dictOfEthBytesRecieved[item.metric.instance];
            const ethBytesSent = item.values[0][1];
            if (ethBytesReceived && ethBytesSent) {
              const p1 = Math.min(1, (ethBytesReceived / 1024 / 1024) / 100) * 100;
              const p2 = Math.min(1, (ethBytesSent / 1024 / 1024) / 100) * 100;
              const percentage = Math.max(p1, p2);
              const cellHtml = getCellHtml(percentage);
              table.cell(cellId).data(cellHtml);
            }
          }
        },
        error: function() {
          initCells('eth', instanceList, table);
          alert('Error when loading ethernet utilization data (step 2).');
        },
      });
    },
    error: function() {
      initCells('eth', instanceList, table);
      alert('Error when loading ethernet utilization data (step 1).');
    },
  });
};

//

const loadData = () => {
  const currentEpochTimeInSeconds = (new Date).getTime() / 1000;
  $.ajax({
    type: 'GET',
    url: webportalConfig.prometheusUri + '/api/v1/query?' +
      'query=node_uname_info&time=' + currentEpochTimeInSeconds,
    success: function(data) {
      const hardwareHtml = hardwareComponent({
        breadcrumb: breadcrumbComponent,
        grafanaUri: webportalConfig.grafanaUri,
        machineMetaData: data,
      });
      $('#content-wrapper').html(hardwareHtml);
      table = $('#hardware-table').dataTable({
        scrollY: (($(window).height() - 265)) + 'px',
        lengthMenu: [[20, 50, 100, -1], [20, 50, 100, 'All']],
        columnDefs: [
          {type: 'natural', targets: [0]},
          {type: 'ip-address', targets: [1]},
          {type: 'title-numeric', targets: [2, 3, 4, 5, 6, 7]},
        ],
      }).api();
      let instanceList = [];
      for (let i = 0; i < data.data.result.length; i++) {
        instanceList.push(data.data.result[i].metric.instance);
      }
      loadCpuUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds, instanceList, table);
      loadMemUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds, instanceList, table);
      loadGpuUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds, instanceList, table);
      loadGpuMemUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds, instanceList, table);
      loadDiskUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds, instanceList, table);
      loadEthUtilData(webportalConfig.prometheusUri, currentEpochTimeInSeconds, instanceList, table);
    },
    error: function() {
      alert('Error when loading data.');
    },
  });
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
  $('#sidebar-menu--cluster-view').addClass('active');
  $('#sidebar-menu--cluster-view--hardware').addClass('active');
  loadData();
  window.onresize = function(envent) {
    resizeContentWrapper();
  };
  resizeContentWrapper();
});
