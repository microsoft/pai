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

require('json-editor'); /* global JSONEditor */
require('bootstrap/js/tooltip.js');

const dockerScriptDataFormat = require('./docker-script-data-format.ejs');
const taskFormat = require('./task-format.ejs');
const addModalFormat = require('./add.ejs');
const userEditModalComponent = require('./edit.ejs');
const userChooseSummaryLayout = require('./summary-layout.ejs');
const userChooseInsertLayout = require('./insert-layout.ejs');
const jobSchema = require('./json-editor-schema.js');
const yamlHelper = require('./yaml-json-editor-convert.js');
const common = require('../../template-common/template-search.component.js');
const webportalConfig = require('../../../config/webportal.config.js');

const initArray = () => {
  return {
    'data': [],
    'script': [],
    'dockerimage': [],
    'task': [],
    'job': [],
  };
};

let editors = initArray();

let addModalVariables = {
  addEditor: null,
  finalEditor: null,
  id: -1,
  active: false,
};

const emptyPage = () => {
  // clear grid item
  ['data', 'script', 'dockerimage', 'task'].forEach((type) => {
    $(`#${type}-container`).empty();
  });

  // clear json editor and their UI elements.
  editors = initArray();
  $('#json-editor-container').empty();
};


const loadEditor = (d, type, id, insertEditors = true, containerName = '#json-editor-container') => {
  $(containerName).append(userEditModalComponent({
    type: type,
    id: id,
  })); // append the modal html

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
  if (d != null) {
    editor.setValue(d);
    if (insertEditors) {
      editors[type].push(editor);
    }
  }
  return editor;
};

const addNewJsonEditor = (d, id, type) => {
  let editor = loadEditor(d, type, id); // load json editor

  if (type != 'task') { // docker/script/data/job listener
    editor.on('change', () => {
      let val = editor.getValue();
      ['name', 'description'].forEach((cur) => {
        $(`#${type}${id}-${cur}`).text(val[cur]);
      });
      $(`#${type}${id}-title > a > span`).text(val['name']);
    });
  } else {
    // task listen function.
    editor.on('change', () => {
      let val = editor.getValue();
      ['role', 'dockerimage', 'data', 'script', 'instances', 'cpu', 'gpu', 'memoryMB'].forEach((cur) => {
        $(`#${type}${id}-${cur}`).text(val[cur]);
      });
      $(`#${type}${id}-command`).text(commandHelper(val));
    });
  }

  // edit modal
  $(`#${type}${id}-edit-button`).on('click', () => {
    $(`#${type}${id}-modal`).modal('show');
  });

  // delete item
  $(`#${type}${id}-remove-button`).on('click', () => {
    $(`#${type}${id}-container`).remove();
    editors[type][id - 1] = null;
  });

  $(`#${type}${id}-edit-save-button`).on('click', () => {
    $(`#${type}${id}-modal`).modal('hide');
  });
};

const commandHelper = (task) => {
  if ('command' in task && task['command'].length) {
    return task['command'][0].substring(0, 30) + (task['command'][0].length > 30 ? '...' : '');
  } else {
    return '';
  }
};

const insertNewTask = (task) => {
  let type = 'task';
  let id = editors[type].length + 1;
  let itemHtml = taskFormat({
    id: id,
    type: type,
    role: task['role'],
    dockerimage: task['dockerimage'],
    data: task['data'],
    script: task['script'],
    instances: task['instances'],
    cpu: task['cpu'],
    memoryMB: task['memoryMB'],
    gpu: task['gpu'],
    command: commandHelper(task),
  });
  $(`#task-container`).append(itemHtml); // append the task html

  addNewJsonEditor(task, id, type);
};

const insertNewDockerDataScript = (item) => {
  let type = item['type'];
  let id = editors[type].length + 1;
  let itemHtml = dockerScriptDataFormat({
    name: item['name'],
    description: item['description'],
    id: id,
    type: type,
  });
  $(`#${item['type']}-container`).append(itemHtml);

  addNewJsonEditor(item, id, type);
};

const updatePageFromYaml = (d) => {
  emptyPage();

  let data = yamlHelper.yamlToJsonEditor(yamlHelper.yamlLoad(d));

  // update docker/script/data
  if ('prerequisites' in data) {
    Object.keys(data['prerequisites']).forEach((key) => {
      insertNewDockerDataScript(data['prerequisites'][key]);
    });
  }

  // update task
  if ('tasks' in data) {
    data['tasks'].forEach((task) => {
      insertNewTask(task);
    });
  }

  // update job
  $('#job-name').text(data['name']);
  $('#job-description').text(data['description']);
  addNewJsonEditor(data, '', 'job');
};

const saveTemplateOnAddModal = (type, id) => {
  addModalVariables.finalEditor = addModalVariables.addEditor;
  let data = addModalVariables.finalEditor.getValue();
  $(`#${type}${id}-modal .edit-save`).attr('data-dismiss', 'modal');
  $(`#${type}${id}-modal .edit-save`).attr('aria-hidden', 'true');
  
  $(`#${type}-summary`).html(userChooseSummaryLayout({
    name: data.name,
    contributor: data.contributor,
    description: data.description,
    type: type,
    id: id,
  }));
  $(`#${type}${id}-edit-button`).on('click', () => {
    $(`#${type}${id}-modal`).modal('show');
  });
};

const replaceHrefs = (htmls) => {
  $('#recommandPlaceHolder').html('');
  Object.keys(htmls).forEach((type) => {
    $('#recommandPlaceHolder').append(htmls[type]);
  });
  $('.cardhref').map(function() {
    $(this).removeAttr('href');
    $(this).attr('data-toggle', 'tooltip');
    $(this).attr('data-html', 'ture');
    $(this).attr('data-placement', 'right');
    $(this).click(() => {
      let items = $(this).attr('id').split('-');
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v2/template/${items[0]}/${items[1]}?version=${items[2]}`,
        type: 'GET',
        dataType: 'json',
        success: function (data) {
          data = yamlHelper.yamlToJsonEditor(data);
          if (addModalVariables.addModalActive == false) {
            $('#user-recommand-holder').html('');
            showAddModal(items[0]);
          }
          addModalVariables.addEditor.setValue(data);
          saveTemplateOnAddModal(items[0], addModalVariables.id);
        }
      });
    });
    let tooltiphtml = '<h5>' + $(this).find('.none').html() + '</h5>';
    $(this).attr('title', tooltiphtml);
  });
  $('[data-toggle="tooltip"]').tooltip();
  if (addModalVariables.addModalActive == false) {
    $('.recommand-container').map(function() {
      let type = $(this).attr('id').substring(3);
      if ($('#' + type + '-table').html().trim() == '') {
        $(this).remove();
      }
    });
    if ($('#user-recommand-holder .recommand-container').length == 0) {
      $('#user-recommand-holder').html('');
    }
  }
};

const showAddModal = (type) => {
  addModalVariables.active = true;
  addModalVariables.addEditor = null;
  addModalVariables.finalEditor = null;
  addModalVariables.id = editors[type].length + 1;

  $('#addModalPlace').html(addModalFormat({
    name: '',
    contributor: '',
    description: '',
    type: type,
    id: addModalVariables.id,
    summaryLayout: userChooseInsertLayout,
  }));

  addModalVariables.addEditor = loadEditor(null, type, addModalVariables.id, false, '#editPlaceHolder');
  $(`#${type}${addModalVariables.id}-modal .edit-save`).click(() => {
    saveTemplateOnAddModal(type, addModalVariables.id);
  });

  // ----------- recommand ---------------
 common.load(type, replaceHrefs, 3);

  $('#btn-add-search').click((event) => {
    common.search($('#add-search').val(), [type], replaceHrefs, 3);
  });
  $('#add-search').on('keyup', (event) => {
    if (event.keyCode == 13) {
      common.search($('#add-search').val(), [type], replaceHrefs, 3);
    }
  });

  // ---------- some button listener ----------
  $('#btn-add-customize').click(() => {
      $(`#${type}${addModalVariables.id}-modal`).modal('show');
  });

  $('#btn-close-add-modal').click(() => {
      addModalVariables.active = false;
  });
  
  $('#btn-add-modal').click(() => {
      addModalVariables.active = false;
      $('#btn-add-modal').attr('data-dismiss', 'modal');
      $('#btn-add-modal').attr('aria-hidden', 'true');
      $('#recommandPlaceHolder').html('');
      $('#editPlaceHolder').html('');
      if (addModalVariables.finalEditor != null) {
          let d = addModalVariables.finalEditor.getValue();
          d['type'] = type;
          insertNewDockerDataScript(d);
      }
  });
  $('#addModal').modal('show');
};

const createDownload = (text) => {
  let filename = 'job.yaml';
  let element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
};

const exportsYaml = () => {
  let res = yamlHelper.exportToYaml(editors);
  createDownload(res);
};

const editYaml = () => {
  let res = yamlHelper.exportToYaml(editors);
  $('#yaml-editor-holder').text(res);
  $('#yaml-modal').modal('show');
};

const createSubmitData = () => {
  return yamlHelper.jsonEditorToJobJson(editors);
};

const initPage = () => {
  let initJob = {
    name: 'Job Name',
    description: 'Please add job description.',
  };
  addNewJsonEditor(initJob, '', 'job'); // init a job jsonEditor
};


module.exports = {
  updatePageFromYaml,
  editYaml,
  exportsYaml,
  showAddModal,
  createSubmitData,
  initPage,
};
