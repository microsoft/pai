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

var template = '{{#jobs}} \
    <tr> \
    <td><a href="{{{appTrackingUrl}}}">{{{name}}}</a></td> \
    <td>{{ &convertCreatedTime }}</td> \
    <td>{{ &convertCompletedTime }}</td> \
    <td>{{&showState}}</td> \
    <td><a href="#" onclick="deleteJob(\'{{{name}}}\')">DELETE</a></td> \
    </tr> \
    {{/jobs}}';

loadJobs = function () {
  console.log('loadJobs');
  showLoading();
  $.get('/jobs', function (data) {
    if (typeof (data) === 'string') {
      data = JSON.parse(data);
    }
    if (data.error) {
      hideLoading();
      alert('Can not get job list');
    } else {
      Mustache.parse(template);
      var jobData = {};
      jobData.jobs = data;
      jobData['showState'] = function (render) {
        if (this.state == 'FRAMEWORK_COMPLETED') {
          var tag = '<span class="label label-info">' + this.state + '</span>';
          tag += '&nbsp;&nbsp;';
          if (this.appExitType == 'SUCCEEDED') {
            tag += '<span class="label label-success">SUCCEEDED</span>';
          } else {
            tag += '<span class="label label-danger">FAILED</span>';
          }
        } else if (this.state == 'JOB_NOT_FOUND') {
          return '<span class="label label-danger">' + this.state + '</span>';
        } else if (this.state == 'APPLICATION_RUNNING') {
          return '<span class="label label-info">' + this.state + '</span>';
        } else if (this.state == 'FRAMEWORK_WAITING') {
          return '<span class="label label-warning">' + this.state + '</span>';
        } else {
          return '<span class="label label-primary">' + this.state + '</span>';
        }
      };
      jobData['convertCreatedTime'] = function (render) {
        if (this.createdTime) {
          var date = new Date(this.createdTime);
          return date.toLocaleString();
        } else {
          return '--';
        }
      }
      jobData['convertCompletedTime'] = function (render) {
        if (this.completedTime) {
          var date = new Date(this.completedTime);
          return date.toLocaleString();
        } else {
          return '--';
        }
      }
      var rendered = Mustache.render(template, jobData);
      $('#tbody').html(rendered);
      console.log(rendered);
      hideLoading();
    }
  })
};

deleteJob = function (jobName) {
  var r = confirm('Are you sure to delete the job?');
  if (r) {
    $.ajax({
      url: '/jobs/' + jobName,
      type: 'DELETE',
      success: function (result) {
        console.log(result);
        window.location.replace('/viewjobs');
      }
    })
  }
};

showLoading = function () {
  $('#mask').show();
};

hideLoading = function () {
  $('#mask').hide();
};

$(function () {
  loadJobs();
})
