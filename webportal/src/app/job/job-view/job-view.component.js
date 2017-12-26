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
const breadcrumbComponent = require('../breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../loading/loading.component.ejs');
const jobTableComponent = require('./job-table.component.ejs');
const jobViewComponent = require('./job-view.component.ejs');
const loading = require('../loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');


const jobViewHtml = jobViewComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
  jobTable: jobTableComponent
});

const convertTime = (elapsed, startTime, endTime) => {
  if (startTime) {
    if (elapsed) {
      if (!endTime) {
        endTime = Date.now();
      }
      const elapsedTime = parseInt((endTime - startTime) / 1000);
      const elapsedDay = parseInt(elapsedTime / (24 * 60 * 60));
      const elapsedHour = ('0' + parseInt((elapsedTime % (24 * 60 * 60)) / (60 * 60))).slice(-2);
      const elapsedMinute = ('0' + parseInt(elapsedTime % (60 * 60) / 60)).slice(-2);
      return `${elapsedDay}:${elapsedHour}:${elapsedMinute}`;
    } else {
      const startDate = new Date(startTime);
      return startDate.toLocaleString();
    }
  } else {
    return '--';
  }
};

const convertState = (state, exitType) => {
  let cls;
  switch (state) {
    case 'JOB_NOT_FOUND':
      cls = 'label-danger';
      break;
    case 'FRAMEWORK_WAITING':
      cls = 'label-warning';
      break;
    case 'APPLICATION_RUNNING':
      cls = 'label-info';
      break;
    case 'FRAMEWORK_COMPLETED':
      if (exitType === 'SUCCEEDED') {
        cls = 'label-success';
        state = 'SUCCEEDED';
      } else {
        cls = 'label-danger';
        state = 'FAILED';
      }
      break;
    default:
      cls = 'label-primary';
  }
  return `<span class="label ${cls}">${state}</span>`;
};

const loadJobs = () => {
  loading.showLoading();
  $.ajax({
    url: `${webportalConfig.restServerUri}/api/v1/job`,
    type: 'GET',
    success: (data) => {
      loading.hideLoading();
      if (data.error) {
        alert(data.message);
      } else {
        $('#job-table').html(jobTableComponent({
          jobs: data,
          convertTime,
          convertState
        }));
      }
    },
    error: (xhr, textStatus, error) => {
      const res = JSON.parse(xhr.responseText);
      alert(res.message);
    }
  });
};

const deleteJob = (jobName) => {
  const res = confirm('Are you sure to delete the job?');
  if (res) {
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v1/job/${jobName}`,
        type: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        },
        success: (data) => {
          loadJobs();
        },
        error: (xhr, textStatus, error) => {
          const res = JSON.parse(xhr.responseText);
          alert(res.message);
        }
      });
    });
  }
};

window.loadJobs = loadJobs;
window.deleteJob = deleteJob;

$("#sidebar-menu--job-view").addClass("active");

$('#content-wrapper').html(jobViewHtml);
$(document).ready(() => {
  loadJobs();
});

module.exports = { loadJobs, deleteJob }