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
// for model start
require('bootstrap/js/modal.js');
// for model end

const breadcrumbComponent = require('../../job/breadcrumb/breadcrumb.component.ejs');
const loadingComponent = require('../../job/loading/loading.component.ejs');
const templateImportComponent = require('./template-import.component.ejs');
const loading = require('../../job/loading/loading.component');
const webportalConfig = require('../../config/webportal.config.json');
const userAuth = require('../../user/user-auth/user-auth.component');
const jobSchema = require('./template-import.schema.js');
// for model start
const userEditModalComponent = require('./submit-modal-component.ejs');
// for model end

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
  let res = {'data': [], 'script': [], 'docker': []};
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
        'env': ('env' in task) ? task['env']: {},
        'command': task['command'],
      });
    });
    res['job'] = d;
  }
  if ('prerequisites' in data) {
    Object.keys(data['prerequisites']).forEach(function(key) {
      let item = data['prerequisites'][key];
      switch (item['type']) {
        case 'data':
          res['data'].push(item);
          break;
        case 'script':
          res['script'].push(item);
          break;
        case 'dockerimage':
          res['docker'].push(item);
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
      job['parameters'] = tryStringToJson(job['parameters']);
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

  ['data', 'script', 'docker'].forEach((t) => {
    data[t].forEach((d) => {
      d['type'] = t == 'docker' ? 'dockerimage' : t;
      res['prerequisites'].push(d); 
    });
  });
  console.log(res);
  return res;
};


let editors = {
  'data': null,
  'script': null,
  'docker': null,
  'job': null,
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
  Object.keys(editors).forEach((key)=>{
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
  })
};

const initTableContent = () => {
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
        if (type != 'job') data = {'prerequisites': [data]};
        data = restApi2JsonEditor(data);
        
        Object.keys(editors).forEach((key) => {
          let editor = editors[key];

          const val = cookies.get('editor_' + key);
          if (val) {
            editor.setValue(JSON.parse(val));
          }
          if (key in data) {
            editor.setValue(editor.getValue().concat(data[key]));
          }
          cookies.set('editor_' + key, JSON.stringify(editor.getValue()), {expires: 10});

          // -------defind the new add button.
          let t = $(`#editor-${key}-holder > div > div.well.well-sm > div.btn-group`);
          let d =  document.createElement("div");
          d.className = "btn-group";
          d.style.cssText  = "display: inline-block;";
          d.innerHTML = t.html();
          t.remove();
          d.e = editor.editors.root;
          // console.log(d);
          d.addEventListener("click", (t) => {
            t.preventDefault(),
            t.stopPropagation();
            let e = d.e;
            // console.log(e);
            var i = e.rows.length;
            e.row_cache[i] ? (e.rows[i] = e.row_cache[i],
            e.rows[i].setValue(e.rows[i].getDefault(), !0),
            e.rows[i].container.style.display = "",
            e.rows[i].tab && (e.rows[i].tab.style.display = ""),
            e.rows[i].register()) : e.addRow(),
            e.active_tab = e.rows[i].tab,
            e.refreshTabs(),
            e.refreshValue(),
            e.onChange(!0)
          });
          $(`#${key}-title`).append(d);
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
  userAuth.checkToken(function(token) {
    loadEditor();
    initTableContent();
  
    Object.keys(editors).forEach((key)=>{
      let editor = editors[key];
      let enabled = true;
      editor.on('change', () => {
        enabled &= (editor.validate().length == 0);
      });
      $('#submitJob').prop('disabled', !enabled);
    });
  
    $(document).on('click', '#submitJob', () => {
      showEditInfo();
    });
  
    $(document).on('click', '#single', () => {
      submitJob(jsonEditor2RestApi(editors));
    });
  });
});

module.exports = {submitJob, showEditInfo};

