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
require('bootstrap/js/tooltip.js');

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
let id = -1;
let addModalActive = false;

const saveTemplateOnAddModal = (type, id) => {
  finalEditor = addEditor;
  data = finalEditor.getValue();
  $(`#${type}${id}-modal .edit-save`).attr('data-dismiss', 'modal');
  $(`#${type}${id}-modal .edit-save`).attr('aria-hidden', 'true');
  
  $('#itemPlaceHolder').html(userChooseMainLayout({
    name: data.name,
    contributor: data.contributor,
    description: data.description,
    type: type,
    id: id,
    summaryLayout: userChooseSummaryLayout,
    titleLayout: userChooseTitleLayout,
  }));
  $(`#${type}${id} .user-edit`).on('click', () => {
    console.log(`${type}${id}-modal`);
    $(`#${type}${id}-modal`).modal('show');
  });
};

const getTemplateByAJAX = (type, name, version, process) => {
  $.ajax({
    url: `${webportalConfig.restServerUri}/api/v1/template/${type}/${name}/${version}`,
    type: 'GET',
    dataType: 'json',
    success: function (data) {
      if (type != 'job') data = { 'prerequisites': [data] };
      data = restApi2JsonEditor(data);
      Object.keys(userChooseTemplateValues).forEach((key) => {
        if (key != 'job') { // job is a object, others is an array.
          data[key].forEach((d) => {
            process(d, key);
          });
        }
        else if (key in data) { // job
          process(data[key], key);
        }
      });
    }
  });
};

const replaceHrefs = () => {
  $('.cardhref').map(function() {
    $(this).removeAttr('href');
    $(this).attr('data-toggle', 'tooltip');
    $(this).attr('data-html', 'ture');
    $(this).attr('data-placement', 'right');
    $(this).click(() => {
      let items = $(this).attr('id').split('-');
      getTemplateByAJAX(items[0], items[1], items[2], (data, type) => {
        if (addModalActive == false) {
          $('#user-recommand-holder').html('');
          showAddModal(items[0]);
        }
        addEditor.setValue(data);
        saveTemplateOnAddModal(items[0], id);
      });
    });
    let tooltiphtml = '<h4>' + $(this).find('.item-title').html() + '</h4>' + 
                      '<p>' + $(this).find('.item-dsp').html() + '</p>' +
                      $(this).find('.star-rating').html();
    console.log(tooltiphtml);
    $(this).attr('title', tooltiphtml);
  });
  $('[data-toggle="tooltip"]').tooltip();
  if (addModalActive == false) {
    $('.recommand-container').map(function() {
      let type = $(this).attr('id').substring(3);
      if ($('#recommand-' + type + '-table').html() == '') {
        $(this).remove();
      }
    });
    if ($('#user-recommand-holder .recommand-container').length == 0) {
      $('#user-recommand-holder').html('');
    }
  }
};

const showAddModal = (type) => {
  addModalActive = true;
  addEditor = null;
  finalEditor = null;
  id = userChooseTemplateValues[type].length + 1;
  $('#addModalPlaceHolder').html(userAddModalComponent);

  $('#editPlaceHolder').html(userEditModalComponent({
    type: type,
    id: id,
  }));
  loadEditor(null, type, id);
  $(`#${type}${id}-modal .edit-save`).click(() => {
    saveTemplateOnAddModal(type, id);
  });
  
  $('#itemPlaceHolder').html(userChooseMainLayout({
    name: type,
    contributor: '',
    description: '',
    type: type,
    id: id,
    summaryLayout: userAddItemLayout,
    titleLayout: userChooseTitleLayout,
  }));
  $('#recommandPlaceHolder').html(userRecommandLayout({
    type: type,
  }));
  templateView.loadTemplates(type, (type) => { return '#recommand-' + type + '-table'; }, replaceHrefs);

  $('#btn-add-search').click((event) => {
    templateView.search(event, [type], (type) => { return '#recommand-' + type + '-table'; }, $('#add-search').val(), replaceHrefs);
  });
  $('#add-search').on('keyup', (event) => {
    templateView.search(event, [type], (type) => { return '#recommand-' + type + '-table'; }, $('#add-search').val(), replaceHrefs);
  });

  $('#btn-add-upload').click(() => {

  });
  
  $('#btn-add-customize').click(() => {
    $(`#${type}${id}-modal`).modal('show');
  });

  $('#btn-close-add-modal').click(() => {
    addModalActive = false;
  });
  
  $('#btn-add-modal').click(() => {
    addModalActive = false;
    $('#btn-add-modal').attr('data-dismiss', 'modal');
    $('#btn-add-modal').attr('aria-hidden', 'true');
    $('#recommandPlaceHolder').html('');
    if (finalEditor != null) {
      let d = finalEditor.getValue();
      insertNewChooseResult(d, type);
      let searchTypes = [];
      Object.keys(userChooseTemplateValues).forEach((t) => {
        let allEmpty = true;
        editors[type].forEach((x) => {
          if (x) allEmpty = false;
        });
        if (userChooseTemplateValues[t].length == 0 || allEmpty) {
          searchTypes.push(t);
        }
      });
      if (searchTypes.length != 0) {
        $('#user-recommand-holder').html('<h2>Recommand</h2>');
        searchTypes.forEach((t) => {
          $('#user-recommand-holder').append(userRecommandLayout({
            type: t,
          }));
        });
        templateView.search(null, searchTypes, (type) => { return '#recommand-' + type + '-table'; }, d['description'], replaceHrefs);
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
  
  ['data', 'script', 'dockerimage'].forEach((t) => {
    editors[t].forEach((d) => {
      if(d!=null){
        let curData = d.getValue();
        curData['type'] = t;
        res['prerequisites'].push(curData);
      }
    });
  });

  if ('job' in editors) {
    let jobs = editors['job']; // is a array, but I assume only one job.
    jobs.forEach((job) => {
      if(job != null){
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
      }
    });
  }

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
  $(`#panel-head-add-new-${key}`).on('click', (t)=>{
    showAddModal(key);
  });
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
  if (d != null) {
    editor.setValue(d);
    editors[type].push(editor);
  } else {
    addEditor = editor;
  }
  return editor;
};

const insertNewChooseResult = (d, type) => {
  let allEmpty = true;
  editors[type].forEach((x) => {
    if (x) allEmpty = false;
  });
  (userChooseTemplateValues[type].length && !allEmpty) ? insertNewTitleAndSummary(d, type) : insertNewContent(d, type);
  let id = userChooseTemplateValues[type].length;
  $('#user-choose-holder').append(userEditModalComponent({
    type: type,
    id: id
  }));

  let editor = loadEditor(d, type, id);

  $(`#${type}${id}-summary .user-edit`).on('click', () => {
    $(`#${type}${id}-modal`).modal('show');
  });

  editor.on('change',function() {
    let val = editor.getValue();
    ['name', 'contributor', 'description'].forEach((cur)=>{
      $(`#${type}${id}-${cur}`).text(val[cur]);
    });
    $(`#${type}${id}-title > a > span`).text(val['name']);
  });

  $(`#${type}${id}-edit-save-button`).on('click', ()=>{
    $(`#${type}${id}-modal`).modal('hide');
  });

  $(`#${type}${id}-remove-button`).on('click', (t)=>{
    if($(`#${type}${id}-title`).hasClass("active")){
      let i = 0;
      for(; i < editors[type].length; ++i){
        if(editors[type][i] && i != id - 1)
          break;
      }
      if(i == editors[type].length){
        $(`#user-choose-holder div.panel[content-type="${type}"`).remove();
        editors[type] = [];
      }
      else{
        $(`#${type}${i + 1}-title`).addClass("active");
        $(`#${type}${i + 1}-summary`).addClass("active");
      }
    }
    $(`#${type}${id}-title`).remove();
    $(`#${type}${id}-summary`).remove();
    editors[type][id - 1] = null;
  });
}

const initContent = () => {
  // using AJAX to fill the table content.
  const searchParams = new URLSearchParams(window.location.search);
  let type = searchParams.get('type');
  let name = searchParams.get('name');
  let version = searchParams.get('version');
  if (name != null && version != null) {
    getTemplateByAJAX(type, name, version, insertNewChooseResult);
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

    $(document).on('click', "#add-job-btn", () => {
      showAddModal('job');
    });
    $(document).on('click', "#add-data-btn", () => {
      showAddModal('data');
    });
    $(document).on('click', "#add-script-btn", () => {
      showAddModal('script');
    });
    $(document).on('click', "#add-docker-btn", () => {
      showAddModal('dockerimage');
    });
  });
});

module.exports = { submitJob };

