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

export const STORAGE_PREFIX = '/pai_data/';
export const SECRET_PATTERN = /^<% \$secrets.([a-zA-Z_][a-zA-Z0-9_]*) %>/;

export const ERROR_MARGIN = 22.15;
export const TENSORBOARD_LOG_PATH = '/mnt/tensorboard';
// Wrap comments with `` just a workaround, we may need to change rest-server or
// runtime to support comments in commands filed
export const CUSTOM_STORAGE_START = '`#CUSTOM_STORAGE_START`';
export const CUSTOM_STORAGE_END = '`#CUSTOM_STORAGE_END`';
export const TEAMWISE_DATA_CMD_START = '`#TEAMWISE_STORAGE_START`';
export const TEAMWISE_DATA_CMD_END = '`#TEAMWISE_STORAGE_END`';
export const TENSORBOARD_CMD_START = '`#TENSORBOARD_START`';
export const TENSORBOARD_CMD_END = '`#TENSORBOARD_END`';
export const AUTO_GENERATE_NOTIFY =
  '`#Auto generated code, please do not modify`';
export const PAI_ENV_VAR = [
  {
    key: 'PAI_JOB_NAME',
    desc: 'jobName in config file',
  },
  {
    key: 'PAI_USER_NAME',
    desc: 'User who submit the job',
  },
  {
    key: 'PAI_DEFAULT_FS_URI',
    desc: 'Default file system uri in PAI',
  },
  {
    key: 'PAI_TASK_ROLE_COUNT',
    desc: `Total task roles' number in config file`,
  },
  {
    key: 'PAI_TASK_ROLE_LIST',
    desc: 'Comma separated all task role names in config file',
  },
  {
    key: 'PAI_TASK_ROLE_TASK_COUNT_$taskRole',
    desc: 'Task count of the task role',
  },
  {
    key: 'PAI_HOST_IP_$taskRole_$taskIndex',
    desc: 'The host IP for taskIndex task in taskRole',
  },
  {
    key: 'PAI_PORT_LIST_$taskRole_$taskIndex_$portType',
    desc: 'The $portType port list for taskIndex task in taskRole',
  },
  {
    key: 'PAI_RESOURCE_$taskRole',
    desc:
      'Resource requirement for the task role in "gpuNumber,cpuNumber,memMB,shmMB" format',
  },
  {
    key: 'PAI_MIN_FAILED_TASK_COUNT_$taskRole',
    desc: 'taskRole.minFailedTaskCount of the task role',
  },
  {
    key: 'PAI_MIN_SUCCEEDED_TASK_COUNT_$taskRole',
    desc: 'taskRole.minSucceededTaskCount of the task role',
  },
  {
    key: 'PAI_CURRENT_TASK_ROLE_NAME',
    desc: 'taskRole.name of current task role',
  },
  {
    key: 'PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX',
    desc: 'Index of current task in current task role, starting from 0',
  },
];
export const PROTOCOL_TOOLTIPS = {
  jobName:
    'Name for the job, need to be unique, should be string in ^[A-Za-z0-9\\-._~]+$ format.',
  taskRoleName: 'Name of the taskRole, string in ^[A-Za-z0-9\\-._~]+$ format.',
  taskRoleContainerSize: [
    'Resource required per container instance',
    'CPU number and memory number will be auto scaled with GPU number by default.',
  ],
  taskRole: [
    'Task roles are different types of task in the protocol.',
    'One job may have one or more task roles, each task role has one or more instances, and each instance runs inside one container.',
  ],
  parameters:
    'Parameters are key-value pairs that you could save your frequently used values and reference them in command section by their keys.',
  secrets: `Secrets are used to store sensitive data. The value will be masked and won't be seen by other users.`,
  data:
    'Data section is used to generate pre-command that download/mount your data to specific path in container.',
  tools:
    'Tools section is used to configure the tools that are useful for jobs.',
  dockerImage:
    'Please contact admin to make sure which cuda versions in docker image is supported by gpu drivers.',
  teamStorage:
    "Team share storage is external storage defined by cluster admin. Select an element means the external storage will be mount to 'path' and user can treat it as local path.",
};

export const COMMAND_PLACEHOLDER = `'You could define your own Parameters, Secrets or Data mount point on the right sidebar.

All lines will be concatenated by "&&". So do not use characters like "#", "\\" in your command`;

export const DOCKER_OPTIONS = [
  {
    key: 'tensorflow-gpu-python3.6',
    text:
      'tensorflow1.12 + python3.6 with gpu, cuda 9.0 (image: openpai/tensorflow-py36-cu90)',
    image: 'openpai/tensorflow-py36-cu90',
  },
  {
    key: 'tensorflow-cpu-python3.6',
    text:
      'tensorflow2.0dev + python3.6 with cpu (image: openpai/tensorflow-py36-cpu)',
    image: 'openpai/tensorflow-py36-cpu',
  },
  {
    key: 'tensorflow-gpu-python2.7',
    text:
      'tensorflow1.12 + python2.7 with gpu, cuda 9.0 (image: openpai/tensorflow-py27-cu90)',
    image: 'openpai/tensorflow-py27-cu90',
  },
  {
    key: 'tensorflow-cpu-python2.7',
    text:
      'tensorflow1.12 + python2.7 with cpu (image: openpai/tensorflow-py27-cpu)',
    image: 'openpai/tensorflow-py27-cpu',
  },
  {
    key: 'pytorch-gpu',
    text:
      'pytorch1.0 + python3.6 with gpu, cuda 9.0 (image: openpai/pytorch-py36-cu90)',
    image: 'openpai/pytorch-py36-cu90',
  },
  {
    key: 'pytorch-cpu',
    text: 'pytorch1.2 + python3.6 with cpu (image: openpai/pytorch-py36-cpu)',
    image: 'openpai/pytorch-py36-cpu',
  },
];
export const DEFAULT_DOCKER_URI = 'openpai/tensorflow-py36-cu90';
// For PAI runtime only
export const PAI_PLUGIN = 'com.microsoft.pai.runtimeplugin';

export const PAI_STORAGE = 'pai.storage';

export const SSH_KEY_BITS = 1024;

export const USERSSH_TYPE_OPTIONS = [
  {
    key: 'custom',
    text: 'Custom',
  },
  // {
  //   key: 'system',
  //   text: 'System',
  // },
];
