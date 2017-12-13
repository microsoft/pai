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
const jobSubmitComponent = require('./job-submit.component.ejs');
const loading = require('../loading/loading.component');


const jobSubmitHtml = jobSubmitComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent
});

const submitJob = (jobConfig) => {
  loading.showLoading();
  $.ajax({
    url: 'http://10.151.40.133:9186/api/job/' + jobConfig.jobName,
    data: jobConfig,
    type: 'PUT',
    success: (data) => {
      loading.hideLoading();
      if (data.error) {
        alert(data.message);
        $('#submitHint').text(data.message);
      } else {
        alert('submit success');
        $('#submitHint').text('submitted successfully!');
      }
      window.location.replace("/view.html");
    }
  });
};

$(document).ready(() => {
  $(document).on('change', '#file', (event) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const jobConfig = JSON.parse(event.target.result);
      submitJob(jobConfig);
    };
    reader.readAsText(event.target.files[0]);
  });
  $('#content-wrapper').html(jobSubmitHtml);
});

module.exports = { submitJob };