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

const dockerScriptDataFormat = require('./docker-script-data-format.ejs');
const taskFormat = require('./task-format.ejs');
const addModalFormat = require('./add.ejs');
const userEditModalComponent = require('./edit.ejs');
const jobSchema = require('./json-editor-schema.js');
const yamlHelper = require('./yaml-json-editor-convert.js');

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

  let data = yamlHelper.yamlToJsonEditor(d);

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

const showAddModal = (type) => {
  let html = addModalFormat({
    type: type,
  });
  $('#addModalPlace').html(html);

  $('#addModal').modal('show');
  $(`#call-${type}-edit-modal`).on('click', () => {
    $('#addModal').modal('hide');

    let id = editors[type].length + 1;
    $('#addCustomizeModalPlace').empty();
    let editor = loadEditor({}, type, id, false, '#addCustomizeModalPlace');
    $(`#${type}${id}-modal`).modal('show');

    $(`#${type}${id}-edit-save-button`).on('click', () => {
      let data = editor.getValue();
      data['type'] = type;
      $(`#${type}${id}-modal`).modal('hide');
      $('#addCustomizeModalPlace').html('');
      if (type == 'task') {
        insertNewTask(data);
      } else {
        insertNewDockerDataScript(data);
      }
    });
  });
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
