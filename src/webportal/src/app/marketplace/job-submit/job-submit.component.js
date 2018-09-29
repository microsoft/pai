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

require('bootstrap/js/modal.js');

const webportalConfig = require('../../config/webportal.config.js');
const loadingComponent = require('../../job/loading/loading.component.ejs');
// const loading = require('../../job/loading/loading.component');
const common = require('../template-common/template-search.component.js');
const userAuth = require('../../user/user-auth/user-auth.component');
const submitComponent = require('./job-submit.component.ejs');
const userTemplate = require('./sub-components/user-template.js');
const url = require('url');

require('./job-submit.component.scss');
require('./sub-components/task-format.scss');
require('./sub-components/prerequisite-format.scss');

$('#sidebar-menu--submit-v2').addClass('active');

const submitHtml = submitComponent({
  loading: loadingComponent,
});

$('#content-wrapper').html(submitHtml);

$(document).on('click', '#add-task-btn', () => {
  userTemplate.showAddModal('task');
});

$(document).on('click', '#add-dockerimage-btn', () => {
  userTemplate.showAddModal('dockerimage');
});

$(document).on('click', '#add-script-btn', () => {
  userTemplate.showAddModal('script');
});

$(document).on('click', '#add-data-btn', () => {
  userTemplate.showAddModal('data');
});

$(document).on('click', '#EditYamlBtn', () => {
  $('#submitJob').attr('disabled', false);
  userTemplate.editYaml();
});

$(document).on('click', '#exportYamlBtn', () => {
  userTemplate.exportsYaml();
});

$(document).on('click', '#yaml-edit-save-button', () => {
  userTemplate.updatePageByYamlEditor();
});

$(document).on('click', '#submitJob', () => {
  userAuth.checkToken((token) => {
    // loading.showLoading();
    $('#submit-job-loading').removeClass('no-submit').addClass('loading-submit');
    $('#submit-job-loading').html(common.generateLoading());
    let data = userTemplate.createSubmitData();
    data.name += '_' + new Date().toISOString().replace(new RegExp('[-:TZ]', 'g'), '');
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v2/jobs/${data.name}`,
      data: JSON.stringify(data),
      headers: {
        Authorization: `Bearer ${token}`,
      },
      contentType: 'application/json; charset=utf-8',
      type: 'PUT',
      dataType: 'json',
      success: (data) => {
        // loading.hideLoading();
        $('#submit-job-loading').removeClass('loading-submit').addClass('no-submit');
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
        // loading.hideLoading();
        $('#submit-job-loading').removeClass('loading-submit').addClass('no-submit');
        const res = JSON.parse(xhr.responseText);
        alert(res.message);
      },
    });
  });
});

$(document).ready(() => {
  userAuth.checkToken(function(token) {
    userTemplate.initPage();
    $('#submitJob').attr('disabled', 'disabled');
    document.getElementById('importYaml').addEventListener('change', function(evt) {
      let files = evt.target.files;
      if (files.length) {
        let f = files[0];
        let reader = new FileReader(); // read the local file
        reader.onload = function(e) {
          userTemplate.updatePageFromYaml(e.target.result);
        };
        reader.readAsText(f);
        $('#submitJob').attr('disabled', false);
      }
    }, false);

    const query = url.parse(window.location.href, true).query;
    const type = query.type;
    const name = query.name;
    const username = query.user;
    const jobname = query.jobname;

    if (type != null && name != null) {
      const u = `${webportalConfig.restServerUri}/api/v2/template/${type}/${name}`;
      $.getJSON(u, (data) => {
        userTemplate.updatePageFromJson(data);
        $('#submitJob').attr('disabled', false);
      });
    }
    if (type != null && username != null && jobname != null) {
      const url = `${webportalConfig.restServerUri}/api/v1/user/${username}/jobs/${jobname}/config`;
      $.get(url, (data) => {
        userTemplate.updatePageFromYaml(data);
        $('#submitJob').attr('disabled', false);
      });
    }
  });
});

window.onbeforeunload = function() {
  if ($('#submitJob').prop('disabled') == true) {
    return undefined;
  } else {
    return 'you will lost your editing, save as yaml';
  }
};
