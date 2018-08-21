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
const parametersSchema = {
  type: 'array',
  format: 'table',
  options: {
    disable_collapse: true,
    disable_array_delete_last_row: true,
    disable_array_delete_all_rows: true,
    disable_edit_json: false,
  },
  items: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      value: {
        type: 'string',
      }
    }
  },
};

const taskSchema = {
  type: 'object',
  format: 'grid',
  headerTemplate: "{{ self.role }}",
  options: {
    disable_edit_json: true,
    disable_collapse: true,
  },
  properties: {
    role: {
      type: 'string',
      propertyOrder: 1,
    },
    data: {
      type: 'string',
      propertyOrder: 2,
    },
    script: {
      type: 'string',
      propertyOrder: 3,
    },
    dockerimage:{
      type: 'string',
      propertyOrder: 4,
    },
    instances: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
      propertyOrder: 5,
    },
    cpu: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
      propertyOrder: 6,
    },
    memoryMB: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
      propertyOrder: 7,
    },
    gpu: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
      propertyOrder: 8,
    },
    parameters: parametersSchema,
    command: {
      type: 'array',
      format: 'table',
      options: {
        disable_collapse: true,
        disable_array_delete_last_row: true,
        disable_array_delete_all_rows: true,
        disable_edit_json: false,
      },
      items: {
        type: 'string',
      },
    },
  },
  required: [
    'role',
    'data',
    'script',
    'dockerimage',
    'instances',
    'cpu',
    'gpu',
    'memoryMB',
    'parameters',
    'command'
  ],
};

// submit_job [data]
const dataSchema = {
  type: 'object',
  // minItems: 1,
  format: 'grid',
  headerTemplate: "{{ self.name }}",
  options: {
    disable_edit_json: true,
    disable_collapse: true,
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
      type: 'string'
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
    'description'
  ]
};

// submit_job [script]
const scriptSchema = {
  type: 'object',
  format: 'grid',
  headerTemplate: "{{ self.name }}",
  options: {
    disable_edit_json: true,
    disable_collapse: true,
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
    parameters: parametersSchema,
    roles:{
      type: 'array',
      items:{
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          command: {
            type: 'textarea',
          }
        }
      }
    }
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

// submit_job [dockerimage]
const dockerimageSchema = {
  type: 'object',
  // as tabs render [form,tabs,table] 
  format: 'grid',
  headerTemplate: "{{ self.name }}",
  options: {
    disable_edit_json: true,
    disable_collapse: true,
  },
  properties: {
    name: {
      type: 'string',
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

// submit_job [job]
const jobSchema = {
  type: 'object',
  format: 'grid',
  headerTemplate: "{{ self.name }}",
  options: {
    disable_edit_json: true,
    disable_collapse: true,
  },
  properties: {
    name: {
      type: 'string',
      propertyOrder: 1,
    },
    version: {
      type: 'string',
      multipleOf: 1,
      propertyOrder: 2,
    },
    protocol_version: {
      type: 'string',
      multipleOf: 1,
      propertyOrder: 3,
    },
    contributor: {
      type: 'string',
      propertyOrder: 4,
    },
    description: {
      type: 'string',
      propertyOrder: 5,
    },
    killAllOnCompletedTaskNumber:{
      type: 'number',
      propertyOrder: 6,
    },
    retryCount:{
      type: 'number',
      propertyOrder: 7,
    },
    parameters: parametersSchema
  },
  required: [
    'name',
    'version',
    'contributor',
    'protocol_version',
    'description',
    'parameters',
    'tasks',
  ]
};

module.exports = {
  dataSchema,
  scriptSchema,
  dockerimageSchema,
  taskSchema,
  jobSchema,
};
