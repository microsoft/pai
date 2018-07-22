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
require('../template-view/template-view.component.scss');
require('json-editor'); /* global JSONEditor */
require('bootstrap/js/modal.js');

const yaml = require('js-yaml');
const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const templateImportComponent = require('./template-import.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');
const jobSchema = require('./user-choose-layout/template-import.schema.js');
const userSubmitModalComponent = require('./submit-modal-component.ejs');
const userEditModalComponent = require('./user-choose-layout/edit.ejs');
const userChooseMainLayout = require('./user-choose-layout/main-layout.ejs');
const userChooseSummaryLayout = require('./user-choose-layout/summary-layout.ejs');
const userChooseTitleLayout = require('./user-choose-layout/title-layout.ejs');
const userAddModalComponent = require('./add-modal.component.ejs');
const userAddItemLayout = require('./user-choose-layout/add-layout.ejs');
const userRecommandLayout = require('./user-choose-layout/recommand-layout.ejs');
const templateView = require('../template-view/template-view.component');

const templateViewHtml = templateImportComponent({
  breadcrumb: breadcrumbComponent,
  loading: loadingComponent,
});

let addEditor = null;
let finalEditor = null;
const showAddModal = (type) => {
  console.log(type);
  addEditor = null;
  finalEditor = null;
  $('#addModalPlaceHolder').html(userAddModalComponent);
  $('#itemPlaceHolder').html(userChooseMainLayout({
    name: type,
    contributor: '',
    description: '',
    type: type,
    id: 1,
    summaryLayout: userAddItemLayout,
    titleLayout: userChooseTitleLayout,
  }));
  $('#recommandPlaceHolder').html(userRecommandLayout({
    type: type,
  }));
  templateView.loadTemplates(type, 'recommand-');
  $('#btn-add-search').click((event) => {
    templateView.search(event, [type], 'recommand-', '#add-search');
  });
  $('#add-search').on('keyup', (event) => {
    templateView.search(event, [type], 'recommand-', '#add-search');
  });
  $('#btn-add-upload').click(() => {

  });
  $('#btn-add-customize').click(() => {
    let id = userChooseTemplateValues[type].length;
    $('#editPlaceHolder').html(userEditModalComponent({
      type: type,
      id: id
    }));
    addEditor = loadEditor(null, type, id);

    $('#edit-save').click((event) => {
      finalEditor = addEditor;
      data = finalEditor.getValue();
      $('#itemPlaceHolder').html(userChooseMainLayout({
        name: data.name,
        contributor: data.contributor,
        description: data.description,
        type: type,
        id: 1,
        summaryLayout: userChooseSummaryLayout,
        titleLayout: userChooseTitleLayout,
      }));
      $(`#${type}${id}-modal`).modal('hide');
    });

    $('#edit-close').click((event) => {
      $(`#${type}${id}-modal`).modal('hide');
    });

    $(`#${type}${id}-modal`).modal('show');
  });
  $('#btn-add-modal').click((event) => {
    if (finalEditor != null) {
      let d = finalEditor.getValue();
      console.log(d);
      if (type != 'job') { // job is a object, others is an array.
        insertNewChooseResult([d], type);
      }
      else { // job
        insertNewChooseResult(d, type);
      }
    }
  });
  $('#addModal').modal('show');
};

const restApi2JsonEditor = (data) => {
  let res = { 'data': [], 'script': [], 'dockerimage': [] };
  if ('job' in data) {
    let d = data['job'];

    let parameters = d['parameters'];
    d['parameters'] = [];
    Object.keys(parameters).forEach((key)=>{
      d['parameters'].push({
        name: key,
        value: parameters[key],
      });
    });

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
        'instances': val,
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
      res[item['type']].push(item);
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
  let res = {
    'prerequisites': [],
  };
  if ('job' in editors) {
    let jobs = editors['job']; // is a array, but I assume only one job.
    jobs.forEach((job) => {
      job = job.getValue();
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
    editors[t].forEach((d) => {
      let curData = d.getValue();
      curData['type'] = t;
      res['prerequisites'].push(curData);
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

let editors = {
  'data': [],
  'script': [],
  'dockerimage': [],
  'job': [],
}

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


const loadEditor = (d, type, id) => {
  let element = document.getElementById(`${type}${id}-json-editor-holder`);
  let editor = new JSONEditor(element, {
    schema: jobSchema[`${type}Schema`],
    theme: 'bootstrap3',
    iconlib: 'bootstrap3',
    disable_array_reorder: true,
    no_additional_properties: true,
    show_errors: 'always',
    disable_properties: true,
  });
  jobDefaultConfigs[type] = editor.getValue();
  if (d) {
    editor.setValue(d);
    editors[type].push(editor);
  } else {
    return editor;
  }
};

const insertNewChooseResult = (d, type) => {
  userChooseTemplateValues[type].length ? insertNewTitleAndSummary(d, type) : insertNewContent(d, type);
  let id = userChooseTemplateValues[type].length;
  $('#user-choose-holder').append(userEditModalComponent({
    type: type,
    id: id
  }));
  loadEditor(d, type, id);

  $(`#${type}${id} .user-edit`).on('click', () => {
    console.log(`${type}${id}-modal`);
    $(`#${type}${id}-modal`).modal('show');
  });
}

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

        data = restApi2JsonEditor(data);
        console.log(data);
        Object.keys(userChooseTemplateValues).forEach((key) => {
          if (key != 'job') { // job is a object, others is an array.
            data[key].forEach((d) => {
              insertNewChooseResult(d, key);
            });
          }
          else { // job
            insertNewChooseResult(data[key], key);
          }
        });
      }
    });
  }
};


$('#content-wrapper').html(templateViewHtml);
$(document).ready(() => {
  userAuth.checkToken(function(token) {
    initContent();
  // Object.keys(editors).forEach((key)=>{
  //   let editor = editors[key];
  //   let enabled = true;
  //   editor.on('change', () => {
  //     enabled &= (editor.validate().length == 0);
  //   });
  //   $('#submitJob').prop('disabled', !enabled);
  // });

    $('#submitModalPlaceHolder').html(userSubmitModalComponent);
    $(document).on('click', '#submitJob', () => {
      $('#userSumbitModal').modal('show');
    });

    $(document).on('click', '#single', () => {
      submitJob(jsonEditor2RestApi(editors));
    });

    $(document).on('click', '#saveTemplate', () => {
      let template = yaml.safeDump(jsonEditor2RestApi(editors));
      let toDownload = new Blob([template], {type: 'application/octet-stream'});
      url = URL.createObjectURL(toDownload);
      let link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'template.yaml');
      let event = document.createEvent('MouseEvents');
      event.initMouseEvent('click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
      link.dispatchEvent(event);
    });

    $(document).on('click', "#add-data-btn", () => {
      showAddModal('data');
    });
  });
});

module.exports = { submitJob };

