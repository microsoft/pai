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

const monaco = require('monaco-editor/esm/vs/editor/editor.api');

const dockerScriptDataFormat = require('./docker-script-data-format.ejs');
const taskFormat = require('./task-format.ejs');
const addModalFormat = require('./add.ejs');
const userEditModalComponent = require('./edit.ejs');
const jobSchema = require('./json-editor-schema.js');
const yamlHelper = require('./yaml-json-editor-convert.js');
const common = require('../../template-common/template-search.component.js');
const webportalConfig = require('../../../config/webportal.config.js');

const initArray = () => {
  return {
    data: [],
    script: [],
    dockerimage: [],
    task: [],
    job: [],
  };
};

const initCandidateList = () => {
  return {
    data: new Set(['']),
    script: new Set(['']),
    dockerimage: new Set(['']),
  };
};

let editors = initArray();
let editorsValue = initArray();
let candidateList = initCandidateList();

let yamleditor = null;

let addModalVariables = {
  addEditor: null,
  id: -1,
};

const emptyPage = () => {
  // clear grid item
  ['data', 'script', 'dockerimage', 'task'].forEach(type => {
    $(`#${type}-container`).empty();
    if (type != 'task') {
      jobSchema['taskSchema']['properties'][type]['enum'] = [];
    }
  });

  // clear json editor and their UI elements.
  editors = initArray();
  editorsValue = initArray();
  candidateList = initCandidateList();
  $('#json-editor-container').empty();
};

const updateTaskSchema = () => {
  ['data', 'script', 'dockerimage'].forEach(type => {
    jobSchema['taskSchema']['properties'][type]['enum'] = Array.from(
      candidateList[type],
    );
  });
};

const loadEditor = (
  d,
  type,
  id,
  insertEditors = true,
  containerName = '#json-editor-container',
) => {
  if (containerName != null) {
    $(containerName).append(
      userEditModalComponent({
        type: type,
        id: id,
      }),
    ); // append the modal html
  }

  if (type == 'task') {
    updateTaskSchema();
  }

  let element = document.getElementById(`${type}${id}-json-editor-holder`);
  element.innerHTML = '';
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
      editorsValue[type].push(JSON.parse(JSON.stringify(editor.getValue())));
    }
  }

  if (type != 'task') {
    // docker/script/data/job listener
    editor.on('change', () => {
      let error = editor.validate();
      $(`#${type}${id}-edit-save-button`).prop('disabled', error.length != 0);
      if (error.length == 0) {
        let val = editor.getValue();
        ['name', 'description'].forEach(cur => {
          $(`#${type}${id}-${cur}`).text(val[cur]);
        });
        $(`#${type}${id}-title > a > span`).text(val['name']);
      }
    });
  } else {
    // task listen function.
    editor.on('change', () => {
      let error = editor.validate();
      $(`#${type}${id}-edit-save-button`).prop('disabled', error.length != 0);
      if (error.length == 0) {
        let val = editor.getValue();
        [
          'role',
          'dockerimage',
          'data',
          'script',
          'instances',
          'cpu',
          'gpu',
          'memoryMB',
        ].forEach(cur => {
          $(`#${type}${id}-${cur}`).text(val[cur]);
        });
        $(`#${type}${id}-command`).text(commandHelper(val));
      }
    });
  }
  return editor;
};

const addNewJsonEditor = (d, id, type) => {
  loadEditor(d, type, id); // load json editor

  if (['dockerimage', 'data', 'script'].indexOf(type) != -1 && d) {
    candidateList[type].add(d['name']);
  }

  // edit modal
  $(`#${type}${id}-edit-button`).on('click', () => {
    if (type == 'task') {
      editors[type][id - 1].destroy();
      editors[type][id - 1] = loadEditor(
        editorsValue[type][id - 1],
        type,
        id,
        false,
        '',
      );
    }
    $(`#${type}${id}-modal`).modal({ backdrop: 'static', keyboard: false });
  });

  // delete item
  $(`#${type}${id}-remove-button`).on('click', () => {
    $(`#${type}${id}-container`).remove();
    if (type != 'task') {
      candidateList[type].delete(editorsValue[type][id - 1]['name']);
    }
    editors[type][id - 1] = null;
    editorsValue[type][id - 1] = null;
  });

  // close button
  $(`#${type}${id}-close-button`).on('click', () => {
    $(`#${type}${id}-modal`).modal('hide');
    editors[type][id - 1].setValue(editorsValue[type][id - 1]);
  });

  // save item
  $(`#${type}${id}-edit-save-button`).on('click', () => {
    // todo delete old name.
    let d = JSON.parse(JSON.stringify(editors[type][id - 1].getValue()));
    if (type != 'task' && type != 'job') {
      candidateList[type].delete(editorsValue[type][id - 1]['name']);
      candidateList[type].add(d['name']);
    }
    editorsValue[type][id - 1] = d;
    $(`#${type}${id}-modal`).modal('hide');
  });
};

const commandHelper = task => {
  if ('command' in task && task['command'].length) {
    return (
      task['command'][0].substring(0, 30) +
      (task['command'][0].length > 30 ? '...' : '')
    );
  } else {
    return '';
  }
};

const insertNewTask = task => {
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

const insertNewDockerDataScript = item => {
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

const updatePageFromJson = data => {
  // data is a json
  yamlHelper.jsonToJsonEditor(data);
  if ('type' in data) {
    emptyPage();

    if (data['type'] == 'job') {
      // it is a job
      // update docker/script/data
      if ('prerequisites' in data) {
        Object.keys(data['prerequisites']).forEach(key => {
          let d = data['prerequisites'][key];
          candidateList[d['type']].add(d['name']);
          insertNewDockerDataScript(d);
        });
      }

      // update task
      if ('tasks' in data) {
        data['tasks'].forEach(task => {
          insertNewTask(task);
        });
      }

      // update job
      $('#job-name').text(data['name']);
      $('#job-description').text(data['description']);
      addNewJsonEditor(data, 1, 'job');
    } else {
      // update docker/script/data
      insertNewDockerDataScript(data);
      addNewJsonEditor({}, 1, 'job');
    }
  }
};

const updatePageFromYaml = d => {
  // d is a string
  updatePageFromJson(yamlHelper.yamlLoad(d));
};

const replaceHrefs = htmls => {
  $('#recommandPlaceHolder').html('');
  Object.keys(htmls).forEach(type => {
    if (htmls[type].length > 0) {
      $('#recommandPlaceHolder').append(htmls[type]);
    }
  });
  $('.cardhref').each((i, obj) => {
    $(obj).removeAttr('href');
    $(obj).attr('data-toggle', 'tooltip');
    $(obj).attr('data-html', 'ture');
    $(obj).attr('data-placement', 'right');
    $(obj).attr(
      'title',
      '<h5>' +
        $(obj)
          .find('.item-dsp')
          .html() +
        '</h5>',
    );
    $(obj).click(() => {
      let items = $(obj)
        .attr('id')
        .split('-');
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v2/template/${items[0]}/${
          items[1]
        }?version=${items[2]}`,
        type: 'GET',
        dataType: 'json',
        success: data => {
          data = yamlHelper.jsonToJsonEditor(data);
          addModalVariables.addEditor.setValue(data);
        },
      });
    });
  });
  $('[data-toggle="tooltip"]').tooltip();
};

const showAddModal = type => {
  if (type != 'task') {
    addModalVariables.addEditor = null;
    addModalVariables.id = editors[type].length + 1;

    $('#addModalPlace').html(
      addModalFormat({
        type: type,
        id: addModalVariables.id,
      }),
    );
    $('#recommandPlaceHolder').html(common.generateLoading());
    addModalVariables.addEditor = loadEditor(
      null,
      type,
      addModalVariables.id,
      false,
      null,
    );

    // ----------- recommand ---------------
    common.load(type, replaceHrefs, 4);

    $('#btn-add-search').click(event => {
      common.search($('#add-search').val(), [type], replaceHrefs, 4);
    });
    $('#add-search').on('keyup', event => {
      if (event.keyCode == 13) {
        common.search($('#add-search').val(), [type], replaceHrefs, 4);
      }
    });

    // ---------- some button listener ----------
    $(`#${type}${addModalVariables.id}-edit-save-button`).click(() => {
      $('#addModal').modal('hide');
      let data = addModalVariables.addEditor.getValue();
      data['type'] = type;
      $('#addModalPlace').html('');
      insertNewDockerDataScript(data);
    });
    $('#addModal').modal({ backdrop: 'static', keyboard: false });
  } else {
    // add task;
    let id = editors[type].length + 1;
    $('#addCustomizeModalPlace').empty();
    let editor = loadEditor({}, type, id, false, '#addCustomizeModalPlace');
    $(`#${type}${id}-modal`).modal({ backdrop: 'static', keyboard: false });
    $(`#${type}${id}-edit-save-button`).on('click', () => {
      let error = editor.validate();
      if (error.length != 0) {
        alert(error);
        return false;
      }
      let data = editor.getValue();
      data['type'] = type;
      $(`#${type}${id}-modal`).modal('hide');
      $('#addCustomizeModalPlace').html('');
      insertNewTask(data);
    });
  }
};

const createDownload = text => {
  let filename = 'job.yaml';
  let element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
  );
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
  yamleditor.setValue(res);
  $('#yaml-modal').modal('show');
  $('#yaml-content').css('height', document.documentElement.clientHeight * 0.8);
  $('#yaml-editor-holder').css(
    'height',
    document.documentElement.clientHeight * 0.79,
  );
};

const updatePageByYamlEditor = () => {
  try {
    let res = yamleditor.getValue();
    updatePageFromYaml(res);
    $('#yaml-modal').modal('hide');
  } catch (YAMLException) {
    alert('Yaml is invalid, please check your yaml!');
  }
};

const createSubmitData = () => {
  return yamlHelper.jsonEditorToJobJson(editors);
};

const initPage = () => {
  let initJob = {
    name: 'Job Name',
    description: 'Please add job description.',
  };
  addNewJsonEditor(initJob, 1, 'job'); // init a job jsonEditor

  yamleditor = monaco.editor.create(
    document.getElementById('yaml-editor-holder'),
    {
      value: 'test:\n  - 1\n',
      language: 'yaml',
      automaticLayout: true,
      theme: 'vs-dark',
    },
  );
};

module.exports = {
  updatePageFromYaml,
  editYaml,
  updatePageByYamlEditor,
  updatePageFromJson,
  exportsYaml,
  showAddModal,
  createSubmitData,
  initPage,
};
