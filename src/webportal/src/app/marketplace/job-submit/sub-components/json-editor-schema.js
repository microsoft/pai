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
    grid_columns: 12,
  },
  items: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      value: {
        type: 'string',
      },
    },
  },
};

const portTypeSchema = {
  type: 'object',
  headerTemplate: '{{ self.label }}',
  options: {
    disable_edit_json: true,
  },
  properties: {
    label: {
      type: 'string',
    },
    beginAt: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      exclusiveMinimum: false,
    },
    portNumber: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      exclusiveMinimum: false,
    },
  },
  required: ['label', 'beginAt', 'portNumber'],
};

const taskSchema = {
  type: 'object',
  format: 'grid',
  options: {
    disable_edit_json: true,
    disable_collapse: true,
  },
  properties: {
    role: {
      type: 'string',
      pattern: '^[A-Za-z0-9._~]+$',
      propertyOrder: 1,
      options: {
        grid_columns: 12,
      },
    },
    data: {
      type: 'string',
      propertyOrder: 2,
      enum: [],
      options: {
        grid_columns: 4,
      },
    },
    script: {
      type: 'string',
      propertyOrder: 3,
      enum: [],
      options: {
        grid_columns: 4,
      },
    },
    dockerimage: {
      type: 'string',
      propertyOrder: 4,
      enum: [],
      options: {
        grid_columns: 4,
      },
    },
    instances: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
      propertyOrder: 5,
      options: {
        grid_columns: 3,
      },
    },
    cpu: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
      propertyOrder: 6,
      options: {
        grid_columns: 3,
      },
    },
    memoryMB: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
      propertyOrder: 7,
      options: {
        grid_columns: 3,
      },
    },
    gpu: {
      type: 'number',
      minimum: 0,
      multipleOf: 1,
      propertyOrder: 8,
      options: {
        grid_columns: 3,
      },
    },
    minFailedTaskCount: {
      type: 'number',
      minimum: 1,
      multipleOf: 1,
      propertyOrder: 9,
    },
    minSucceededTaskCount: {
      type: 'number',
      minimum: 1,
      multipleOf: 1,
      propertyOrder: 10,
    },
    parameters: parametersSchema,
    command: {
      type: 'array',
      format: 'tabs',
      options: {
        disable_collapse: true,
        disable_array_delete_last_row: true,
        disable_array_delete_all_rows: true,
        grid_columns: 12,
      },
      items: {
        type: 'string',
        format: 'textarea',
        headerTemplate: `command {{i}}`,
      },
    },
    portList: {
      type: 'array',
      format: 'table',
      options: {
        disable_collapse: true,
        disable_array_delete_last_row: true,
        disable_array_delete_all_rows: true,
        grid_columns: 12,
      },
      items: portTypeSchema,
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
    'command',
    'portList',
  ],
};

// submit_job [data]
const dataSchema = {
  type: 'object',
  // minItems: 1,
  format: 'grid',
  headerTemplate: '{{ self.name }}',
  options: {
    disable_edit_json: true,
    disable_collapse: true,
  },
  properties: {
    name: {
      type: 'string',
      pattern: '^[A-Za-z0-9._~]+$',
    },
    version: {
      type: 'string',
      multipleOf: 1,
    },
    contributor: {
      type: 'string',
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
      format: 'textarea',
    },
  },
  required: [
    'name',
    'version',
    'contributor',
    'protocol_version',
    'uri',
    'description',
  ],
};

// submit_job [script]
const scriptSchema = {
  type: 'object',
  format: 'grid',
  headerTemplate: '{{ self.name }}',
  options: {
    disable_edit_json: true,
    disable_collapse: true,
  },
  properties: {
    name: {
      type: 'string',
      pattern: '^[A-Za-z0-9._~]+$',
    },
    version: {
      type: 'string',
      multipleOf: 1,
    },
    contributor: {
      type: 'string',
    },
    protocol_version: {
      type: 'string',
      multipleOf: 1,
    },
    uri: {
      type: 'string',
      multipleOf: 1,
    },
    description: {
      type: 'string',
      format: 'textarea',
    },
  },
  required: [
    'name',
    'version',
    'contributor',
    'protocol_version',
    'uri',
    'description',
  ],
};

// submit_job [dockerimage]
const dockerimageSchema = {
  type: 'object',
  // as tabs render [form,tabs,table]
  format: 'grid',
  headerTemplate: '{{ self.name }}',
  options: {
    disable_edit_json: true,
    disable_collapse: true,
  },
  properties: {
    name: {
      type: 'string',
      pattern: '^[A-Za-z0-9._~]+$',
    },
    version: {
      type: 'string',
      multipleOf: 1,
    },
    contributor: {
      type: 'string',
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
      format: 'textarea',
    },
  },
  required: [
    'name',
    'version',
    'contributor',
    'protocol_version',
    'uri',
    'description',
  ],
};

// submit_job [job]
const jobSchema = {
  type: 'object',
  format: 'grid',
  headerTemplate: '{{ self.name }}',
  options: {
    disable_edit_json: true,
    disable_collapse: true,
  },
  properties: {
    name: {
      type: 'string',
      pattern: '^[A-Za-z0-9._~]+$',
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
    retryCount: {
      type: 'number',
      propertyOrder: 6,
    },
    gpuType: {
      type: 'string',
      propertyOrder: 7,
    },
    experiment: {
      type: 'string',
      propertyOrder: 8,
    },
    virtualCluster: {
      type: 'string',
      propertyOrder: 9,
    },
    parameters: parametersSchema,
    description: {
      type: 'string',
      format: 'textarea',
      propertyOrder: 1008,
      options: {
        grid_columns: 12,
      },
    },
  },
  required: [
    'name',
    'version',
    'protocol_version',
    'contributor',
    'description',
    'parameters',
  ],
};

module.exports = {
  dataSchema,
  scriptSchema,
  dockerimageSchema,
  taskSchema,
  jobSchema,
};
