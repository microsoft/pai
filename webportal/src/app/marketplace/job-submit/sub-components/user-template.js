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

require('json-editor');

const dockerScriptDataFormat = require('./docker-script-data-format.ejs');
const taskFormat = require('./task-format.ejs');
const userEditModalComponent = require('./edit.ejs');
const jobSchema = require('./json-editor-schema.js');
const yamlHelper = require('./yaml-json-editor-convert.js');

const initArray = ()=> {
  return {
    'data': [],
    'script': [],
    'dockerimage': [],
    'task': [],
    'job': [],
  };
};

let userChooseTemplateValues = initArray();
let editors = initArray();


const loadEditor = (d, type, id, insertEditors=true) => {
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

const addNewJsonEditor =(d, id, type)=>{
  $('#json-editor-container').append(userEditModalComponent({
    type: type,
    id: id,
  })); // append the modal html

  let editor = loadEditor(d, type, id); // load json editor

  if (type != 'task') {
    editor.on('change', function() {
      let val = editor.getValue();
      ['name', 'description'].forEach((cur)=>{
        $(`#${type}${id}-${cur}`).text(val[cur]);
      });
      $(`#${type}${id}-title > a > span`).text(val['name']);
    });
  } else {
    // todo add task listen function.
  }

  // edit modal
  $(`#${type}${id}-edit-button`).on('click', () => {
    $(`#${type}${id}-modal`).modal('show');
  });

  // delete item
  $(`#${type}${id}-remove-button`).on('click', ()=>{
    $(`#${type}${id}-container`).remove();
    editors[type][id - 1] = null;
  });

  $(`#${type}${id}-edit-save-button`).on('click', ()=>{
    $(`#${type}${id}-modal`).modal('hide');
  });
};

const insertNewTask = (task)=>{
  let type = 'task';
  let id = userChooseTemplateValues[type].length + 1;
  let itemHtml = taskFormat({
    id: id,
    type: type,
    role: task['role'],
    dockerimage: task['dockerimage'],
    instances: task['instances'],
    cpu: task['cpu'],
    memoryMB: task['memoryMB'],
    gpu: task['gpu'],
    command: 'command' in task && task['command'] ? task['command'][0] : '',
  });
  $(`#task-container`).append(itemHtml); // append the task html

  addNewJsonEditor(task, id, type);
  userChooseTemplateValues[type].push(task);
};

const insertNewDockerDataScript = (item)=>{
  let type = item['type'];
  let id = userChooseTemplateValues[type].length + 1;
  let itemHtml = dockerScriptDataFormat({
    name: item['name'],
    description: item['description'],
    id: id,
    type: type,
  });
  $(`#${item['type']}-container`).append(itemHtml);

  addNewJsonEditor(item, id, type);
  userChooseTemplateValues[type].push(item);
};

const updatePageFromYaml = (d) => {
  // clear the template values
  userChooseTemplateValues = initArray();
  editors = initArray();
  let data = yamlHelper.yamlToJsonEditor(d);

  if ('prerequisites' in data) {
    Object.keys(data['prerequisites']).forEach(function(key) {
      insertNewDockerDataScript(data['prerequisites'][key]);
    });
  }

  if ('tasks' in data) {
    data['tasks'].forEach((task) => {
      insertNewTask(task);
    });
  }

  userChooseTemplateValues['job'] = data;
  addNewJsonEditor(data, '', 'job');
};

const exportsJson = ()=>{
  yamlHelper.jsonEditorToJobJson(editors);
};


module.exports = {
  updatePageFromYaml,
  exportsJson,
};
