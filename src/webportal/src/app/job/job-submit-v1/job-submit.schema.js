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

const portTypeSchema = {
  type: 'object',
  headerTemplate: '{{ self.label }}',
  title: 'port',
  options: {
    disable_edit_json: true,
  },
  properties: {
    label: {
      type: 'string',
      description: 'Label name for the port type',
    },
    beginAt: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      exclusiveMinimum: false,
      description:
        'The port to begin with in the port type, 0 for random selection',
    },
    portNumber: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      exclusiveMinimum: false,
      description: 'Number of ports for the specific type',
    },
  },
  required: ['label', 'beginAt', 'portNumber'],
};

const taskRoleSchema = {
  type: 'object',
  headerTemplate: '{{ self.name }}',
  title: 'taskRole',
  format: 'grid',
  options: {
    disable_edit_json: true,
  },
  properties: {
    name: {
      type: 'string',
      pattern: '^[A-Za-z0-9._~]+$',
      description: 'Name for the task role, need to be unique with other roles',
    },
    taskNumber: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      exclusiveMinimum: true,
      description: 'Number of tasks for the task role, no less than 1',
    },
    cpuNumber: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      exclusiveMinimum: true,
      description: 'CPU number for one task in the task role, no less than 1',
    },
    memoryMB: {
      type: 'number',
      multipleOf: 1,
      minimum: 100,
      exclusiveMinimum: false,
      description: 'Memory for one task in the task role, no less than 100',
    },
    shmMB: {
      type: 'number',
      multipleOf: 1,
      minimum: 64,
      exclusiveMinimum: false,
      description:
        'Shared memory for one task in the task role, no more than memory size',
      default: 64,
    },
    gpuNumber: {
      type: 'number',
      multipleOf: 1,
      minimum: 0,
      exclusiveMinimum: false,
      description: 'GPU number for one task in the task role, no less than 0',
    },
    minFailedTaskCount: {
      type: ['number', 'null'],
      minimum: 1,
      exclusiveMinimum: false,
      description:
        'Number of failed tasks to kill the entire job, null or no less than 1',
      default: 1,
    },
    minSucceededTaskCount: {
      type: ['number', 'null'],
      minimum: 1,
      exclusiveMinimum: false,
      description:
        'Number of succeeded tasks to kill the entire job, null or no less than 1',
      default: null,
    },
    command: {
      type: 'string',
      pattern: '\\S+',
      format: 'textarea',
      propertyOrder: 1001,
      options: {
        // expand_height: true,
      },
      description:
        'Executable command for tasks in the task role, can not be empty',
    },
    portList: {
      type: 'array',
      format: 'table',
      items: portTypeSchema,
      propertyOrder: 1002,
      description: 'List of portType to use',
    },
  },
  required: [
    'name',
    'taskNumber',
    'cpuNumber',
    'memoryMB',
    'gpuNumber',
    'command',
  ],
  defaultProperties: [
    'name',
    'taskNumber',
    'cpuNumber',
    'memoryMB',
    'gpuNumber',
    'command',
  ],
};

const jobSchema = {
  type: 'object',
  format: 'grid',
  title: 'Submit Form',
  properties: {
    jobName: {
      type: 'string',
      pattern: '^[A-Za-z0-9-._]+$',
      propertyOrder: 100,
      options: {
        grid_columns: 4,
      },
      description: 'Name for the job, need to be unique',
    },
    image: {
      type: 'string',
      pattern: '^\\S+$',
      propertyOrder: 110,
      options: {
        grid_columns: 4,
      },
      description: 'URL pointing to the Docker image for all tasks in the job',
    },
    authFile: {
      type: 'string',
      propertyOrder: 120,
      options: {
        grid_columns: 4,
      },
      description: 'Docker registry authentication file existing on HDFS',
      default: '',
    },
    dataDir: {
      type: 'string',
      propertyOrder: 130,
      options: {
        grid_columns: 4,
      },
      description: 'Data directory existing on HDFS',
      default: '',
    },
    outputDir: {
      type: 'string',
      propertyOrder: 140,
      options: {
        grid_columns: 4,
      },
      description:
        'Output directory on HDFS, $PAI_DEFAULT_FS_URI/Output/$jobName will be used if not specified',
      default: '',
    },
    codeDir: {
      type: 'string',
      propertyOrder: 150,
      options: {
        grid_columns: 4,
      },
      description: 'Code directory existing on HDFS',
      default: '',
    },
    virtualCluster: {
      type: 'string',
      propertyOrder: 125,
      options: {
        grid_columns: 4,
      },
      description:
        'The virtual cluster job runs on. If omitted, the job will run on default virtual cluster',
      default: 'default',
    },
    gpuType: {
      type: 'string',
      propertyOrder: 126,
      options: {
        grid_columns: 4,
      },
      description: 'If omitted, the job will run on any gpu type',
      default: '',
    },
    retryCount: {
      type: 'number',
      multipleOf: 1,
      minimum: -2,
      exclusiveMinimum: false,
      propertyOrder: 127,
      options: {
        grid_columns: 4,
      },
      description: 'Job retry count, no less than -2',
      default: 0,
    },
    taskRoles: {
      type: 'array',
      items: taskRoleSchema,
      minItems: 1,
      format: 'tabs',
      propertyOrder: 1000,
      description: 'List of taskRole, one task role at least',
    },
    jobEnvs: {
      type: 'object',
      format: 'grid',
      propertyOrder: 200,
      additionalProperties: true,
      description: 'Job env parameters, which are available in job containers',
    },
    extras: {
      type: 'object',
      format: 'grid',
      propertyOrder: 201,
      additionalProperties: true,
      description: 'Extra parameters, store any information that job may use',
    },
  },
  required: ['jobName', 'image', 'taskRoles'],
  defaultProperties: ['jobName', 'image', 'virtualCluster', 'taskRoles'],
};

module.exports = jobSchema;
