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
const querystring = require('querystring');
const stripJsonComments = require('strip-json-comments');
const { clearToken } = require('../../user/user-logout/user-logout.component');

const jobSubmitHtml = jobSubmitComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
});

let editor;
let jobDefaultConfig;

const getChecksum = str => {
  let res = 0;
  for (const c of str) {
    res ^= c.charCodeAt(0) & 0xff;
  }
  return res.toString(16);
};

const isValidJson = str => {
  let valid = true;
  let errors = null;
  try {
    const json = JSON.parse(str);
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
    alert('Please fix the invalid parameters: ' + errors);
  }
  return valid;
};

const exportFile = (data, filename, type) => {
  const file = new Blob([data], { type: type });
  if (window.navigator.msSaveOrOpenBlob) {
    // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  } else {
    // Others
    const a = document.createElement('a');
    const url = URL.createObjectURL(file);
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

const submitJob = jobConfig => {
  userAuth.checkToken(token => {
    const user = cookies.get('user');
    loading.showLoading();
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/jobs/${user}~${jobConfig.jobName}`,
      data: JSON.stringify(jobConfig),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: data => {
        loading.hideLoading();
        if (data.error) {
          alert(data.message);
          $('#submitHint').text(data.message);
        } else {
          alert('submit success');
          $('#submitHint').text('submitted successfully!');
        }
        window.location.replace('/job-list.html');
      },
      error: (xhr, textStatus, error) => {
        loading.hideLoading();
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
        if (res.code === 'UnauthorizedUserError') {
          clearToken();
        }
      },
    });
  });
};

const loadEditor = () => {
  const element = $('#editor-holder')[0];
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
  const heights = window.innerHeight;
  $('#editor-holder')[0].style.height = heights - 300 + 'px';
};

$('#sidebar-menu--submit-job').addClass('active');

$('#content-wrapper').html(jobSubmitHtml);
$(document).ready(() => {
  userAuth.checkToken(function(token) {
    loadEditor();
    editor.on('change', () => {
      $('#submitJob').prop('disabled', editor.validate().length !== 0);
    });

    // choose the first edit json box
    $('[title="Edit JSON"]')
      .filter(':first')
      .one('click', () => {
        // disable old save button to avoid saving automatically
        const oldSave = $('[title="Edit JSON"]')
          .filter(':first')
          .next('div')
          .children('[title=Save]')[0];
        const newSave = oldSave.cloneNode(true);
        oldSave.parentNode.replaceChild(newSave, oldSave);

        // add new click listener
        $(newSave).on('click', () => {
          const curConfig = editor.root.editjson_textarea.value;
          if (isValidJson(curConfig)) {
            editor.root.setValue(JSON.parse(curConfig));
            editor.root.hideEditJSON();
          }
        });
      });
    $('[title="Object Properties"]').each((index, element) => {
      $($(element).contents()[2]).replaceWith('More Properties');
    });

    $(document).on('change', '#fileUpload', event => {
      const reader = new FileReader();
      reader.onload = event => {
        const jobConfig = stripJsonComments(event.target.result);
        if (isValidJson(jobConfig)) {
          editor.setValue(
            Object.assign({}, jobDefaultConfig, JSON.parse(jobConfig)),
          );
        }
      };
      reader.readAsText(event.target.files[0]);
      $('#fileUpload').val('');
    });
    $(document).on('click', '#submitJob', () => {
      submitJob(editor.getValue());
    });
    $(document).on('click', '#fileExport', () => {
      exportFile(
        JSON.stringify(editor.getValue(), null, 4),
        (editor.getEditor('root.jobName').getValue() || 'jobconfig') + '.json',
        'application/json',
      );
    });
    resize();
    window.onresize = function() {
      resize();
    };
    const query = querystring.parse(window.location.search.replace(/^\?+/, ''));
    const op = query.op;
    const type = query.type;
    const username = query.user;
    const jobName = query.jobName;
    if (op === 'resubmit') {
      if (type != null && username != null && jobName != null) {
        const url =
          username === ''
            ? `${webportalConfig.restServerUri}/api/v1/jobs/${jobName}/config`
            : `${webportalConfig.restServerUri}/api/v2/jobs/${username}~${jobName}/config`;
        $.ajax({
          url: url,
          type: 'GET',
          success: data => {
            let jobConfigObj = data;
            if (typeof jobConfigObj === 'string') {
              jobConfigObj = JSON.parse(data);
            }
            let name = jobConfigObj.jobName;
            if (
              /_\w{8}$/.test(name) &&
              getChecksum(name.slice(0, -2)) === name.slice(-2)
            ) {
              name = name.slice(0, -9);
            }
            name = `${name}_${Date.now()
              .toString(16)
              .substr(-6)}`;
            name = name + getChecksum(name);
            jobConfigObj.jobName = name;
            editor.setValue(Object.assign({}, jobDefaultConfig, jobConfigObj));
          },
          error: (xhr, textStatus, error) => {
            const res = JSON.parse(xhr.responseText);
            if (res.message === 'ConfigFileNotFound') {
              alert("This job's config file has not been stored.");
            } else {
              alert('Error: ' + res.message);
            }
          },
        });
      }
    } else if (op === 'init') {
      try {
        const jobConfigObj = JSON.parse(
          window.sessionStorage.getItem('init-job'),
        );
        editor.setValue(Object.assign({}, jobDefaultConfig, jobConfigObj));
      } finally {
        window.sessionStorage.removeItem('init-job');
      }
    }
  });
});

module.exports = { submitJob };
