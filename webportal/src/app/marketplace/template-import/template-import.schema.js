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

// the end of job: [task plate]
const taskSchema = {
  type: 'object',
  title: 'task',
  format: 'grid',
  options: {
    disable_edit_json: true,
  },
  properties: {
    role: {
      type: 'string',
    },
    instances: {

      type: 'number',
      minimum: 0,
      multipleOf: 1,
    },
    data: {
      type: 'string',
    },
    cpu: {
      type: 'string',
      minimum: 0,
      multipleOf: 1,
    },
    script: {
      type: 'string',
    },
    gpu: {
      type: 'string',
      multipleOf: 1,
    },
    dockerimage: {
      type: 'string',
    },
    memoryMB: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
    },
    env: {
      type: 'string',
      format: 'textarea',
      multipleOf: 1,
    },
    command: {
      type: 'string',
      format: 'textarea',
      multipleOf: 1,
    },
  },
  required: [
    'role',
    'instances',
    'data',
    'cpu',
    'script',
    'gpu',
    'dockerimage',
    'memoryMB',
    'env',
    'command'
  ],
};

// submit_job [data]
const dataSchema = {
  type: 'object',
  title: 'data',
  format: 'grid',
  options: {
    disable_edit_json: true,
  },
  properties: {
    name: {
      type: 'string'
    },
    version: {
      type: 'string',
      multipleOf: 1,
    },
    contributor: {
      type: 'string'
    },
    protocol_version: {
      type: 'string',
      multipleOf: 1,
    },
    uri: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
  required: [
    'name',
    'version',
    'contributor',
    'protocol_version',
    'uri',
    'description',
  ]
};
// submit_job [script]
const scriptSchema = {
  type: 'object',
  title: 'script',
  format: 'grid',
  // JSON can not edit
  options: {
    disable_edit_json: true,
  },
  properties: {
    name: {
      type: 'string'
    },
    version: {
      type: 'string',
      multipleOf: 1,
    },
    contributor: {
      type: 'string'
    },
    protocol_version: {
      type: 'string',
      multipleOf: 1
    },
    uri: {
      type: 'string',
      multipleOf: 1
    },
    description: {
      type: 'string',
    },
  },
  required: [
    'name',
    'version',
    'contributor',
    'protocol_version',
    'uri',
    'description',
  ]
};
// submit_job [job]
const jobBlockSchema = {
  type: 'object',
  title: 'job',
  format: 'grid',
  options: {
    disable_edit_json: true,
  },
  properties: {
    name: {
      type: 'string'
    },
    version: {
      type: 'string',
      multipleOf: 1,
    },
    contributor: {
      type: 'string'
    },
    protocol_version: {
      type: 'string',
      multipleOf: 1,
    },
    description: {
      type: 'string',
    },
    experiment: {
      type: 'string'
    },
    parameters: {
      type: 'string',
      format: 'textarea',
      options: {
        expand_height: true,
      },
    },
    tasks: {
      type: 'array',
      format: 'grid',
      items: taskSchema,
      propertyOrder: 1002,
      description: 'List of task',
    },
  },
  required: [
    'name',
    'version',
    'contributor',
    'protocol_version',
    'description',
    'experiment',
    'parameters',
    'tasks'
  ]
};
// submit_job [docker]
const dockerSchema = {
  type: 'object',
  title: 'docker',
  format: 'grid',
  options: {
    disable_edit_json: true,
  },
  properties: {
    name: {
      type: 'string'
    },
    version: {
      type: 'string',
      multipleOf: 1,
    },
    contributor: {
      type: 'string'
    },
    protocol_version: {
      type: 'string',
      multipleOf: 1,
    },
    uri: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
  required: [
    'name',
    'version',
    'contributor',
    'protocol_version',
    'uri',
    'description',
  ]
};
// submit_job child collection
const submit_child = {
  data: {
    type: 'array',
    minItems: 1,
    // as tabs render [form,tabs,table] 
    format: 'tabs',
    items: dataSchema,
    propertyOrder: 1002,
    description: 'List of data',
  },
  script: {
    type: 'array',
    minItems: 1,
    format: 'tabs',
    items: scriptSchema,
    propertyOrder: 1002,
    description: 'List of script',
  },
  docker: {
    type: 'array',
    minItems: 1,
    format: 'tabs',
    items: dockerSchema,
    propertyOrder: 1002,
    description: 'List of docker',
  },
  job: {
    type: 'array',
    minItems: 1,
    format: 'tabs',
    items: jobBlockSchema,
    propertyOrder: 1002,
    description: 'List of docker',
  }
}

// submit job complete json file
const jobSchema = {
  type: 'object',
  format: 'grid',
  title: 'Submit Form',
  // JSON button display
  // options: {
  //   disable_edit_json: true,
  // },
  properties: submit_child,
  required: [
    'data',
    'docker',
    'script',
    'job'
  ]
};

module.exports = jobSchema;
