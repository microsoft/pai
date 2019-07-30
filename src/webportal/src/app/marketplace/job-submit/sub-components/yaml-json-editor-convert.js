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

const yaml = require('js-yaml');

const convertParameterToKeyValue = (d) => {
  if ('parameters' in d) {
    const {parameters} = d;
    d.parameters = [];
    Object.keys(parameters).forEach((key) => {
      d.parameters.push({
        name: key,
        value: parameters[key],
      });
    });
  }
};

const convertParameterFromKeyValue = (d) => {
  if ('parameters' in d) {
    const {parameters} = d;
    d.parameters = {};
    parameters.forEach((t) => {
      d.parameters[t.name] = t.value;
    });
  }
};

const yamlLoad = (yamlString) => {
  try {
    return yaml.safeLoad(yamlString);
  } catch (error) {
    alert(`Failed to load yaml file: ${  error}`);
    return null;
  }
};

const jsonToJsonEditor = (data) => {
  try {
    if (!data || typeof data !== 'object') {
      throw new Error('Content is null or does not have required format.');
    }

    if ('tasks' in data) {
      data.tasks.forEach((task) => {
        task.instances = task.resource.instances;
        task.cpu = task.resource.resourcePerInstance.cpu;
        task.gpu = task.resource.resourcePerInstance.gpu;
        task.memoryMB = task.resource.resourcePerInstance.memoryMB;
        task.portList = task.resource.portList;
        delete task.resource;
        convertParameterToKeyValue(task);
      });
    }

    if ('parameters' in data) {
      convertParameterToKeyValue(data);
    }

    return data;
  } catch (error) {
    alert(`Failed to parse yaml file. ${  error}`);
    return null;
  }
};

const jsonEditorToJobJson = (editors) => {
  const res = JSON.parse(JSON.stringify(editors.job[0].getValue())); // deep copy
  convertParameterFromKeyValue(res);

  res.type = 'job';
  res.prerequisites = [];
  res.tasks = [];

  ['data', 'script', 'dockerimage', 'task'].forEach((type) => {
    editors[type].forEach((editor) => {
      if (editor != null) {
        const temp = JSON.parse(JSON.stringify(editor.getValue()));
        if (type == 'task') {
          convertParameterFromKeyValue(temp);
          temp.resource = {
            'instances': temp.instances,
            'resourcePerInstance': {
              cpu: temp.cpu,
              memoryMB: temp.memoryMB,
              gpu: temp.gpu,
            },
            'portList': temp.portList,
          };
          delete temp.portList;
          delete temp.instances;
          delete temp.cpu;
          delete temp.memoryMB;
          delete temp.gpu;
          res.tasks.push(temp);
        } else {
          temp.type = type;
          res.prerequisites.push(temp);
        }
      }
    });
  });
  return res;
};

const exportToYaml = (editors) => {
  const res = jsonEditorToJobJson(editors);
  return yaml.safeDump(res);
};

module.exports = {
  yamlLoad,
  jsonToJsonEditor,
  jsonEditorToJobJson,
  exportToYaml,
};
