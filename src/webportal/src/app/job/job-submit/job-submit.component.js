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
require('./job-submit.component.scss');
require('json-editor'); /* global JSONEditor */
const breadcrumbComponent = require('../breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../loading/loading.component.ejs');
const jobSubmitComponent = require('./job-submit.component.ejs');
const loading = require('../loading/loading.component');
const webportalConfig = require('../../config/webportal.config.js');
const userAuth = require('../../user/user-auth/user-auth.component');
const jobSchema = require('./job-submit.schema.js');
const url = require('url');

const jobSubmitHtml = jobSubmitComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
});

let editor;
let jobDefaultConfig;

const isValidJson = (str) => {
  let valid = true;
  let errors = null;
  try {
    let json = JSON.parse(str);
    errors = editor.validate(json);
    if (errors.length) {
      valid = false;
      errors = errors[0].path.replace('root.', '') + ': ' + errors[0].message;
    }
  } catch (e) {
    errors = e.message;
    valid = false;
  }
  if (!valid) {
    alert('Please upload a valid json file: ' + errors);
  }
  return valid;
};

const exportFile = (data, filename, type) => {
  let file = new Blob([data], {type: type});
  if (window.navigator.msSaveOrOpenBlob) { // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else { // Others
    let a = document.createElement('a');
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }
};

const submitJob = (jobConfig) => {
  userAuth.checkToken((token) => {
    const user = cookies.get('user');
    loading.showLoading();
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/user/${user}/jobs/${jobConfig.jobName}`,
      data: JSON.stringify(jobConfig),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        loading.hideLoading();
        if (data.error) {
          alert(data.message);
          $('#submitHint').text(data.message);
        } else {
          alert('submit success');
          $('#submitHint').text('submitted successfully!');
        }
        window.location.replace('/view.html');
      },
      error: (xhr, textStatus, error) => {
        loading.hideLoading();
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
};

const loadEditor = () => {
  let element = $('#editor-holder')[0];
  editor = new JSONEditor(element, {
    schema: jobSchema,
    theme: 'bootstrap3',
    iconlib: 'bootstrap3',
    disable_array_reorder: true,
    no_additional_properties: true,
    show_errors: 'always',
  });
  jobDefaultConfig = editor.getValue();
};

const resize = () => {
  let heights = window.innerHeight;
  $('#editor-holder')[0].style.height = heights - 300 + 'px';
};

$('#sidebar-menu--submit-job').addClass('active');

$('#content-wrapper').html(jobSubmitHtml);
$(document).ready(() => {
  loadEditor();
  editor.on('change', () => {
    $('#submitJob').prop('disabled', (editor.validate().length != 0));
  });

  $(document).on('change', '#fileUpload', (event) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const jobConfig = event.target.result;
      if (isValidJson(jobConfig)) {
        editor.setValue(Object.assign({}, jobDefaultConfig, JSON.parse(jobConfig)));
      }
    };
    reader.readAsText(event.target.files[0]);
    $('#fileUpload').val('');
  });
  $(document).on('click', '#submitJob', () => {
    submitJob(editor.getValue());
  });
  $(document).on('click', '#fileExport', () => {
    exportFile(JSON.stringify(editor.getValue(), null, 4),
      (editor.getEditor('root.jobName').getValue() || 'jobconfig') + '.json',
      'application/json');
  });
  resize();
  window.onresize = function() {
    resize();
  };
  const query = url.parse(window.location.href, true).query;
  const type = query.type;
  const username = query.user;
  const jobname = query.jobname;
  if (type != null && username != null && jobname != null) {
    const url = `${webportalConfig.restServerUri}/api/v1/user/${username}/jobs/${jobname}/config`;
    $.getJSON(url, (data) => {
      editor.setValue(Object.assign({}, jobDefaultConfig, JSON.parse(data)));
    });
  }
});

module.exports = {submitJob};
