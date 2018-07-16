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
  type: 'array',
  format: 'table',
  propertyOrder: 1002,
  options: {
    disable_edit_json: true,
    disable_array_delete_last_row: true,
    disable_array_delete_all_rows: true,
  },
  items: {
    type: 'object',
    headerTemplate: "{{ self.name }}",
    format: 'grid',
    // default pack up form
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
        type: 'number',
        minimum: 0,
        multipleOf: 1,
      },
      script: {
        type: 'string',
      },
      gpu: {
        type: 'number',
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
      },
      command: {
        type: 'string',
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
  }
};

// submit_job [data]
const dataSchema = {
  type: 'array',
  // minItems: 1,
  format: 'grid',
  propertyOrder: 1002,
  options: {
    disable_array_delete_last_row: true,
    disable_array_delete_all_rows: true,
  },
  items: {
    headerTemplate: "{{ self.name }}",
    type: 'object',
    format: 'grid',
    options: {
      disable_edit_json: true,
      collapsed: true,
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
        format: 'textarea',
        options: {
          expand_height: true,
        },
      }
    },
    required: [
      'name',
      'version',
      'contributor',
      'protocol_version',
      'uri',
      'description'
    ]
  }
};
// submit_job [script]
const scriptSchema = {
  type: 'array',
  // minItems: 1,
  format: 'grid',
  propertyOrder: 1002,
  options: {
    disable_array_delete_last_row: true,
    disable_array_delete_all_rows: true,
  },
  items: {
    headerTemplate: "{{ self.name }}",
    type: 'object',
    format: 'grid',
    // JSON can not edit
    options: {
      disable_edit_json: true,
      collapsed: true,
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
      }
    },
    required: [
      'name',
      'version',
      'contributor',
      'protocol_version',
      'uri'
    ]
  }
};

// submit_job [docker]
const dockerSchema = {
  type: 'array',
  // minItems: 1,
  // as tabs render [form,tabs,table] 
  format: 'grid',
  propertyOrder: 1002,
  options: {
    disable_array_delete_last_row: true,
    disable_array_delete_all_rows: true,
  },
  items: {
    headerTemplate: "{{ self.name }}",
    type: 'object',
    format: 'grid',
    options: {
      disable_edit_json: true,
      collapsed: true,
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
        type: 'string'
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
  }
};

// submit_job [job]
const jobSchema = {
  type: 'array',
  // minItems: 1,
  format: 'grid',
  propertyOrder: 1002,
  options: {
    disable_array_delete_last_row: true,
    disable_array_delete_all_rows: true,
  },
  items: {
    headerTemplate: "{{ self.name }}",
    type: 'object',
    format: 'grid',
    options: {
      disable_edit_json: true,
      collapsed: true,
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
      experiment: {
        type: 'string'
      },
      description: {
        type: 'string'
      },
      parameters: {
        type: 'string',
        format: 'textarea',
        options: {
          expand_height: true,
        },
      },
      tasks: taskSchema
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

module.exports = {
  dataSchema,
  scriptSchema,
  dockerSchema,
  jobSchema,
};
