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


require('./template-import.component.scss');
require('json-editor'); /* global JSONEditor */
require('bootstrap/js/modal.js');

const yaml = require('js-yaml');
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const templateImportComponent = require('./template-import.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');
const jobSchema = require('./template-import.schema.js');
const userEditModalComponent = require('./submit-modal-component.ejs');
const userChooseMainLayout = require('./template-import-user-choose-layout/main-layout.ejs');
const userChooseSummaryLayout = require('./template-import-user-choose-layout/summary-layout.ejs');
const userChooseTitleLayout = require('./template-import-user-choose-layout/title-layout.ejs');

const templateViewHtml = templateImportComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
});

// for model start
const showEditInfo = () => {
  $('#modalPlaceHolder').html(userEditModalComponent);
  $('#userEditModal').modal('show');
};
// for model end

const restApi2JsonEditor = (data) => {
  let res = { 'data': [], 'script': [], 'dockerimage': [] };
  if ('job' in data) {
    let d = data['job'];
    let tasks = d['tasks'];
    d['tasks'] = [];
    tasks.forEach((task) => {
      let val = 1;
      if (typeof task['resource']['instances'] == 'string') {
        let paths = task['resource']['instances'].substring(1).split('.');
        val = data;
        for (let i = 0; i < paths.length && val != undefined; i++) {
          if (paths[i] in val) {
            val = val[paths[i]];
          } else {
            val = val.filter((element) => element.name == paths[i]).pop();
          }
        }
        if (typeof val != 'number') {
          val = 1;
        }
      }
      d['tasks'].push({
        'role': task['name'],
        'instances': val, // the task['resource']['instances'] is a string like '$job.parameters.num_of_worker', not a int.
        'data': task['data'],
        'portList': ('portList' in task['resource']) ? task['resource']['portList'] : [],
        'cpu': task['resource']['resourcePerInstance']['cpu'],
        'script': task['script'],
        'gpu': task['resource']['resourcePerInstance']['gpu'],
        'dockerimage': task['dockerimage'],
        'memoryMB': task['resource']['resourcePerInstance']['memoryMB'],
        'env': ('env' in task) ? task['env'] : {},
        'command': task['command'],
      });
    });
    res['job'] = d;
  }
  if ('prerequisites' in data) {
    Object.keys(data['prerequisites']).forEach(function (key) {
      let item = data['prerequisites'][key];
      switch (item['type']) {
        case 'data':
          res['data'].push(item);
          break;
        case 'script':
          res['script'].push(item);
          break;
        case 'dockerimage':
          res['dockerimage'].push(item);
          break;
      }
    });
  }
  return res;
};

const tryStringToJson = (s) => {
  // if s is empty, using JSON.parse(s) will be error.
  let res = {};
  try {
    res = JSON.parse(s);
  } catch (e) {

  }
  return res;
};

const jsonEditor2RestApi = (editors) => {
  let data = {};
  Object.keys(editors).forEach((key) => {
    data[key] = editors[key].getValue();
  });
  let res = {
    'prerequisites': [],
  };
  if ('job' in data) {
    let jobs = data['job']; // is a array, but I assume only one job.
    jobs.forEach((job) => {
      job['type'] = 'job';
      let tasks = job['tasks'];
      let parameters = job['parameters'];
      job['parameters'] = {};
      parameters.forEach((t) => {
        job['parameters'][t['name']] = t['value'];
      });

      job['tasks'] = [];
      tasks.forEach((task) => {
        job['tasks'].push({
          'name': task['role'],
          'data': task['data'],
          'dockerimage': task['dockerimage'],
          'command': tryStringToJson(task['command']),
          'script': task['script'],
          'env': tryStringToJson(task['env']),
          'resource': {
            'instances': task['instances'],
            'resourcePerInstance': {
              'cpu': task['cpu'],
              'gpu': task['gpu'],
              'memoryMB': task['memoryMB']
            },
            'portList': task['portList'],
          }
        });
      });
      res['job'] = job;
    });
  }

  ['data', 'script', 'dockerimage'].forEach((t) => {
    data[t].forEach((d) => {
      res['prerequisites'].push(d);
    });
  });
  console.log(res);
  return res;
};


let userChooseTemplateValues = {
  'data': [],
  'script': [],
  'dockerimage': [],
  'job': [],
};

let jobDefaultConfigs = {};


const submitJob = (jobConfig) => {
  userAuth.checkToken((token) => {
    loading.showLoading();
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/jobs/${jobConfig.job.name}`,
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
  Object.keys(editors).forEach((key) => {
    let element = document.getElementById(`editor-${key}-holder`);
    let editor = new JSONEditor(element, {
      schema: jobSchema[`${key}Schema`],
      theme: 'bootstrap3',
      iconlib: 'bootstrap3',
      disable_array_reorder: true,
      no_additional_properties: true,
      show_errors: 'always',
      disable_properties: true,
    });
    jobDefaultConfigs[key] = editor.getValue();
    editors[key] = editor;
  });
};

const insertNewContent = (d, key) => {
  let newItem = userChooseMainLayout({
    name: d['name'],
    contributor: d['contributor'],
    description: d['description'],
    type: key,
    id: 1,
    summaryLayout: userChooseSummaryLayout,
    titleLayout: userChooseTitleLayout,
  });
  $('#user-choose-holder').append(newItem);
  userChooseTemplateValues[key].push(d);
};

const insertNewTitleAndSummary = (d, key) => {
  let newTitle = userChooseTitleLayout({
    name: d['name'],
    type: key,
    id: userChooseTemplateValues[key].length + 1,
    active: '',
  });
  $(`#${key}-title`).append(newTitle);

  let newSummary = userChooseSummaryLayout({
    name: d['name'],
    contributor: d['contributor'],
    description: d['description'],
    type: key,
    id: userChooseTemplateValues[key].length + 1,
    active: '',
  });
  $(`#${key}-summary`).append(newSummary);
  userChooseTemplateValues[key].push(d);

};

const initContent = () => {
  // using AJAX to fill the table content.
  const searchParams = new URLSearchParams(window.location.search);
  let type = searchParams.get('type');
  let name = searchParams.get('name');
  let version = searchParams.get('version');
  if (name != null && version != null) {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v1/template/${type}/${name}/${version}`,
      type: 'GET',
      dataType: 'json',
      success: function (data) {
        if (type != 'job') data = { 'prerequisites': [data] };

        console.log(data);
        data = restApi2JsonEditor(data);
        console.log(data);

        Object.keys(userChooseTemplateValues).forEach((key) => {
          if (key != 'job') { // job is a object, others is an array.
            data[key].forEach((d) => {
              userChooseTemplateValues[key].length ? insertNewTitleAndSummary(d, key) : insertNewContent(d, key);
            });
          }
          else { // job
            insertNewContent(data[key], key);
          }
        });
      }
    });
  }
};

// for model start
window.showEditInfo = showEditInfo;
// for model end

$('#sidebar-menu--submit-job').addClass('active');

$('#content-wrapper').html(templateViewHtml);
$(document).ready(() => {
  // userAuth.checkToken(function(token) {
  // loadEditor();
  initContent();

  // Object.keys(editors).forEach((key)=>{
  //   let editor = editors[key];
  //   let enabled = true;
  //   editor.on('change', () => {
  //     enabled &= (editor.validate().length == 0);
  //   });
  //   $('#submitJob').prop('disabled', !enabled);
  // });

  // $(document).on('click', '#submitJob', () => {
  //   showEditInfo();
  // });

  // $(document).on('click', '#saveTemplate', () => {
  //   let template = yaml.safeDump(jsonEditor2RestApi(editors));
  //   var toDownload = new Blob([template], {type: 'application/octet-stream'});
  //   url = URL.createObjectURL(toDownload);
  //   var link = document.createElement('a');
  //   link.setAttribute('href', url);
  //   link.setAttribute('download', 'template.yaml');
  //   var event = document.createEvent('MouseEvents');
  //   event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
  //   link.dispatchEvent(event);
  // });

  // $(document).on('click', '#single', () => {
  //   submitJob(jsonEditor2RestApi(editors));
  // });
  // });
});

module.exports = { submitJob, showEditInfo };

