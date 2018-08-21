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

const yamlToJsonEditor = (yamlString) => {
  let data = yaml.safeLoad(yamlString);
  // console.log(data);
  if ('tasks' in data) {
    data['tasks'].forEach((task) => {
      task['instances'] = task['resource']['instances'];
      task['cpu'] = task['resource']['resourcePerInstance']['cpu'];
      task['gpu'] = task['resource']['resourcePerInstance']['gpu'];
      task['memoryMB'] = task['resource']['resourcePerInstance']['memoryMB'];
      delete task['resource'];
      let parameters = task['parameters'];
      task['parameters'] = [];
      Object.keys(parameters).forEach((key)=>{
        task['parameters'].push({
          name: key,
          value: parameters[key],
        });
      });
    });
  }
  return data;
};

const jsonEditorToJobJson = (editors) => {
    //
};


module.exports={
  yamlToJsonEditor,
  jsonEditorToJobJson,
};
