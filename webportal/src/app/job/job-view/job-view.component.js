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

require('bootstrap/js/modal.js');
require('datatables.net/js/jquery.dataTables.js');
require('datatables.net-bs/js/dataTables.bootstrap.js');
require('datatables.net-bs/css/dataTables.bootstrap.css');
require('datatables.net-plugins/sorting/natural.js');
require('datatables.net-plugins/sorting/title-numeric.js');
require('./job-view.component.scss');
const url = require('url');
// const moment = require('moment/moment.js');
const breadcrumbComponent = require('../breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../loading/loading.component.ejs');
const jobViewComponent = require('./job-view.component.ejs');
const jobTableComponent = require('./job-table.component.ejs');
const jobDetailTableComponent = require('./job-detail-table.component.ejs');
const jobDetailSshInfoModalComponent = require('./job-detail-ssh-info-modal.component.ejs');
const loading = require('../loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');

let table = null;
let sshInfo = null;

const jobViewHtml = jobViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  jobTable: jobTableComponent,
});

const getDurationInSeconds = (startTime, endTime) => {
  if (startTime == null) {
    return 0;
  }
  if (endTime == null) {
    endTime = Date.now();
  }
  return Math.round(Math.max(0, endTime - startTime) / 1000);
};

const convertTime = (elapsed, startTime, endTime) => {
  if (startTime) {
    if (elapsed) {
      const elapsedTime = getDurationInSeconds(startTime, endTime);
      // TODO: find a better way to humanize elapsedTime.
      // return moment.duration(elapsedTime, "seconds").humanize();
      let result = '';
      const elapsedDay = parseInt(elapsedTime / (24 * 60 * 60));
      if (elapsedDay > 0) {
        result += elapsedDay + 'd ';
      }
      const elapsedHour = parseInt((elapsedTime % (24 * 60 * 60)) / (60 * 60));
      if (result != '' || (result == '' && elapsedHour > 0)) {
        result += elapsedHour + 'h ';
      }
      const elapsedMinute = parseInt(elapsedTime % (60 * 60) / 60);
      if (result != '' || (result == '' && elapsedMinute > 0)) {
        result += elapsedMinute + 'm ';
      }
      const elapsedSecond = parseInt(elapsedTime % 60);
      result += elapsedSecond + 's';
      return result;
    } else {
      const startDate = new Date(startTime);
      return startDate.toLocaleString();
    }
  } else {
    return '--';
  }
};

const convertState = (state) => {
  let cls;
  let stateText = '';
  switch (state) {
    case 'JOB_NOT_FOUND':
      cls = 'label-default';
      stateText = 'N/A';
      break;
    case 'WAITING':
      cls = 'label-warning';
      stateText = 'Waiting';
      break;
    case 'RUNNING':
      cls = 'label-primary';
      stateText = 'Running';
      break;
    case 'SUCCEEDED':
      cls = 'label-success';
      stateText = 'Succeeded';
      break;
    case 'STOPPED':
      cls = 'label-warning';
      stateText = 'Stopped';
      break;
    case 'FAILED':
      cls = 'label-danger';
      stateText = 'Failed';
      break;
    default:
      cls = 'label-default';
      stateText = 'Unknown';
  }
  return `<span class="label ${cls}">${stateText}</span>`;
};

const convertGpu = (gpuAttribute) => {
  const bitmap = (+gpuAttribute).toString(2);
  const gpuList = [];
  for (let i = 0; i < bitmap.length; i ++) {
    if (bitmap[i] === '1') {
      gpuList.push(bitmap.length - i - 1);
    }
  }
  if (gpuList.length > 0) {
    gpuList.reverse();
    return gpuList.join(',');
  } else {
    return 'None';
  }
};

const loadJobs = () => {
  loading.showLoading();
  $.ajax({
    url: `${webportalConfig.restServerUri}/api/v1/jobs`,
    type: 'GET',
    success: (data) => {
      if (data.error) {
        alert(data.message);
      } else {
        $('#view-table').html(jobTableComponent({
          jobs: data,
          getDurationInSeconds,
          convertTime,
          convertState,
        }));
        table = $('#job-table').dataTable({
          'scrollY': (($(window).height() - 265)) + 'px',
          'lengthMenu': [[20, 50, 100, -1], [20, 50, 100, 'All']],
          'order': [[2, 'desc']],
          'columnDefs': [
            {type: 'natural', targets: [0, 1, 4, 5]},
            {type: 'title-numeric', targets: [2, 3]},
          ],
        }).api();
      }
      loading.hideLoading();
    },
    error: (xhr, textStatus, error) => {
      const res = JSON.parse(xhr.responseText);
      alert(res.message);
      loading.hideLoading();
    },
  });
};

const stopJob = (jobName) => {
  const res = confirm('Are you sure to stop the job?');
  if (res) {
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/jobs/${jobName}/executionType`,
        type: 'PUT',
        data: {
          value: 'STOP',
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
        success: (data) => {
          loadJobs();
        },
        error: (xhr, textStatus, error) => {
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
        },
      });
    });
  }
};

const loadJobDetail = (jobName) => {
  loading.showLoading();
  sshInfo = null;
  $.ajax({
    url: `${webportalConfig.restServerUri}/api/v1/jobs/${jobName}`,
    type: 'GET',
    success: (data) => {
      loading.hideLoading();
      if (data.error) {
        alert(data.message);
      } else {
        $('#view-table').html(jobDetailTableComponent({
          jobName: data.name,
          jobStatus: data.jobStatus,
          taskRoles: data.taskRoles,
          grafanaUri: webportalConfig.grafanaUri,
          convertTime,
          convertState,
          convertGpu,
        }));
        $('a[name^=sshInfoLink]').addClass('disabled');
        if (data.jobStatus.state !== 'RUNNING') {
          $('div[name^=sshInfoDiv]').attr('title', 'Job is not running.');
        } else {
          $.ajax({
            url: `${webportalConfig.restServerUri}/api/v1/jobs/${jobName}/ssh`,
            type: 'GET',
            success: (data) => {
              sshInfo = data;
              $('a[name^=sshInfoLink]').removeClass('disabled');
              $('div[name^=sshInfoDiv]').attr('title', '');
            },
            error: (xhr, textStatus, error) => {
              const res = JSON.parse(xhr.responseText);
              if (res.message === 'SshInfoNotFound') {
                $('div[name^=sshInfoDiv]').attr('title', 'This job does not contain SSH info.');
              }
            },
          });
        }
      }
    },
    error: (xhr, textStatus, error) => {
      const res = JSON.parse(xhr.responseText);
      alert(res.message);
    },
  });
};

const showSshInfo = (containerId) => {
  if (sshInfo === null) {
    return;
  }
  for (let x of sshInfo.containers) {
    if (x.id === containerId) {
      $('#sshInfoModalPlaceHolder').html(jobDetailSshInfoModalComponent({
        'containerId': containerId,
        'sshIp': x.sshIp,
        'sshPort': x.sshPort,
        'keyPair': sshInfo.keyPair,
      }));
      $('#sshInfoModal').modal('show');
      break;
    }
  }
};

window.loadJobs = loadJobs;
window.stopJob = stopJob;
window.loadJobDetail = loadJobDetail;
window.showSshInfo = showSshInfo;

const resizeContentWrapper = () => {
  $('#content-wrapper').css({'height': $(window).height() + 'px'});
  if (table != null) {
    $('.dataTables_scrollBody').css('height', (($(window).height() - 265)) + 'px');
    table.columns.adjust().draw();
  }
};

$('#content-wrapper').html(jobViewHtml);

$(document).ready(() => {
  window.onresize = function(envent) {
    resizeContentWrapper();
  };
  resizeContentWrapper();
  $('#sidebar-menu--job-view').addClass('active');
  const query = url.parse(window.location.href, true).query;
  if (query['jobName']) {
    loadJobDetail(query['jobName']);
    $('#content-wrapper').css({'overflow': 'auto'});
  } else {
    loadJobs();
    $('#content-wrapper').css({'overflow': 'hidden'});
  }
});

module.exports = {loadJobs, stopJob, loadJobDetail};
