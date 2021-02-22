// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
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
  taskRoleContainerSize:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/quick-start.html',
  hivedSkuType:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/quick-start.html',
  taskRole:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-run-distributed-job.html#taskrole-and-instance',
  parameters:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-use-advanced-job-settings.html#parameters-and-secrets',
  secrets: `https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-use-advanced-job-settings.html#parameters-and-secrets`,
  data:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-manage-data.html',
  tools:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-debug-jobs.html#how-to-debug-jobs',
  dockerImage:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/docker-images-and-job-examples.html',
  teamStorage:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-manage-data.html#use-storage-in-jobs',
  tensorboard:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-debug-jobs.html#how-to-use-tensorboard-plugin',
  ssh:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-debug-jobs.html#how-to-use-ssh',
  policy:
    'https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-use-advanced-job-settings.html#job-exit-spec-retry-policy-and-completion-policy',
};

export const COMMAND_PLACEHOLDER = `'You could define your own Parameters, Secrets or Data mount point on the right sidebar.

All lines will be concatenated by "&&". So do not use characters like "#", "\\" in your command'`;

export const DOCKER_OPTIONS = [
  {
    key: 'python_3.6-pytorch_1.4.0-gpu',
    text: 'PyTorch 1.4.0 + Python 3.6 with GPU, CUDA 10.1',
    image: 'openpai/standard:python_3.6-pytorch_1.4.0-gpu',
  },
  {
    key: 'python_3.6-pytorch_1.2.0-gpu',
    text: 'PyTorch 1.2.0 + Python 3.6 with GPU, CUDA 10.0',
    image: 'openpai/standard:python_3.6-pytorch_1.2.0-gpu',
  },
  {
    key: 'python_3.6-tensorflow_2.1.0-gpu',
    text: 'TensorFlow 2.1.0 + Python 3.6 with GPU, CUDA 10.1',
    image: 'openpai/standard:python_3.6-tensorflow_2.1.0-gpu',
  },
  {
    key: 'python_3.6-tensorflow_1.15.0-gpu',
    text: 'TensorFlow 1.15.0 + Python 3.6 with GPU, CUDA 10.0',
    image: 'openpai/standard:python_3.6-tensorflow_1.15.0-gpu',
  },
  {
    key: 'python_3.6-mxnet_1.5.1-gpu',
    text: 'MXNet 1.5.1 + Python 3.6 with GPU, CUDA 10.1',
    image: 'openpai/standard:python_3.6-mxnet_1.5.1-gpu',
  },
  {
    key: 'python_3.6-cntk_2.7-gpu',
    text: 'CNTK 2.7 + Python 3.6 with GPU, CUDA 10.1',
    image: 'openpai/standard:python_3.6-cntk_2.7-gpu',
  },
  {
    key: 'python_3.6-pytorch_1.4.0-cpu',
    text: 'PyTorch 1.4.0 + Python 3.6 with CPU',
    image: 'openpai/standard:python_3.6-pytorch_1.4.0-cpu',
  },
  {
    key: 'python_3.6-pytorch_1.2.0-cpu',
    text: 'PyTorch 1.2.0 + Python 3.6 with CPU',
    image: 'openpai/standard:python_3.6-pytorch_1.2.0-cpu',
  },
  {
    key: 'python_3.6-tensorflow_2.1.0-cpu',
    text: 'TensorFlow 2.1.0 + Python 3.6 with CPU',
    image: 'openpai/standard:python_3.6-tensorflow_2.1.0-cpu',
  },
  {
    key: 'python_3.6-tensorflow_1.15.0-cpu',
    text: 'TensorFlow 1.15.0 + Python 3.6 with CPU',
    image: 'openpai/standard:python_3.6-tensorflow_1.15.0-cpu',
  },
];

export const DEFAULT_DOCKER_URI =
  'openpai/standard:python_3.6-pytorch_1.2.0-gpu';

// For PAI runtime only
export const PAI_PLUGIN = 'com.microsoft.pai.runtimeplugin';

export const STORAGE_PLUGIN = 'teamwise_storage';

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

// Sidebar key
export const SIDEBAR_PARAM = 'param';

export const SIDEBAR_SECRET = 'secret';

export const SIDEBAR_ENVVAR = 'envvar';

export const SIDEBAR_TOOL = 'tool';

// Sidebar config
export const SIDEBAR_CONFIG = [
  { key: SIDEBAR_PARAM, text: 'Parameters' },
  { key: SIDEBAR_TOOL, text: 'Tools' },
  { key: SIDEBAR_SECRET, text: 'Secrets' },
  { key: SIDEBAR_ENVVAR, text: 'PAI environment variables' },
];
