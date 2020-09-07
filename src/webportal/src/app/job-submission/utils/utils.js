import { isObject, isEmpty, isNil, isArrayLike, get } from 'lodash';
import { basename } from 'path';

import { JobBasicInfo } from '../models/job-basic-info';
import { JobTaskRole } from '../models/job-task-role';
import {
  CUSTOM_STORAGE_START,
  CUSTOM_STORAGE_END,
  TEAMWISE_DATA_CMD_START,
  TEAMWISE_DATA_CMD_END,
  PAI_PLUGIN,
} from './constants';
import config from '../../config/webportal.config';

const HIDE_SECRET = '******';

export const dispatchResizeEvent = () => {
  setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
};

export const keyValueArrayReducer = (acc, cur) => {
  acc = { ...acc, ...cur };
  return acc;
};

export function removeEmptyProperties(obj) {
  if (!isObject(obj)) {
    return;
  }

  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    const onCheckingElement = newObj[key];
    if (!isEmpty(onCheckingElement)) {
      return;
    }

    // ignore non-array-like primitive type
    if (
      !isObject(onCheckingElement) &&
      !isArrayLike(onCheckingElement) &&
      !isNil(onCheckingElement)
    ) {
      return;
    }

    delete newObj[key];
  });
  return newObj;
}

export function getFileNameFromHttp(url) {
  return basename(url, '.git');
}

export function getProjectNameFromGit(url) {
  return basename(url, '.git');
}

export function getFolderNameFromHDFS(path) {
  return basename(path);
}

export function removePathPrefix(path, prefix) {
  return path.replace(prefix, '');
}

export function addPathPrefix(path, prefix) {
  return prefix.concat(path);
}

function populateComponents(jobInformation, context) {
  const { vcNames } = context;
  const virtualCluster = jobInformation.virtualCluster;
  if (
    isEmpty(vcNames) ||
    isNil(vcNames.find(vcName => vcName === virtualCluster))
  ) {
    jobInformation.virtualCluster = 'default';
  }
}

export function getJobComponentsFromConfig(jobConfig, context) {
  if (isNil(jobConfig)) {
    return;
  }

  removeAutoGeneratedCodeFromProtocolTaskRoles(jobConfig);
  const parameters = jobConfig.parameters || [];
  const taskRoles = jobConfig.taskRoles || [];
  const deployments = jobConfig.deployments || [];
  const prerequisites = jobConfig.prerequisites || [];
  const secrets = jobConfig.secrets || {};
  const extras = jobConfig.extras || {};

  const updatedJobInformation = JobBasicInfo.fromProtocol(jobConfig);
  const updatedParameters = Object.keys(parameters).map(key => {
    return { key: key, value: parameters[key] };
  });

  const updatedSecrets = [];
  if (secrets === HIDE_SECRET) {
    alert(
      'WARNING: The secrets in the imported job config have been removed. You need to fill in the missing values manually or the job may not work as you expected.',
    );
  } else {
    updatedSecrets.push(
      ...Object.entries(secrets).map(([key, value]) => ({ key, value })),
    );
  }
  const updatedTaskRoles = Object.keys(taskRoles).map(name =>
    JobTaskRole.fromProtocol(
      name,
      taskRoles[name],
      deployments,
      prerequisites,
      secrets,
      extras,
    ),
  );
  const updatedExtras = extras;

  populateComponents(updatedJobInformation, context);
  return [
    updatedJobInformation,
    updatedTaskRoles,
    updatedParameters,
    updatedSecrets,
    updatedExtras,
  ];
}

export function getHostNameFromUrl(url) {
  const parser = new URL(url);
  return parser.hostname;
}

export function getPortFromUrl(url) {
  const parser = new URL(url);
  return parser.port;
}

function addPreCommandsToProtocolTaskRoles(protocol, preCommands) {
  Object.keys(protocol.taskRoles).forEach(taskRoleKey => {
    const taskRole = protocol.taskRoles[taskRoleKey];
    const commands = preCommands.concat(taskRole.commands || []);
    taskRole.commands = commands;
  });
}

export async function populateProtocolWithData(user, protocol, jobData) {
  // for k8s, we use runtime plugin and not inject code into the command
  if (config.launcherType === 'k8s') {
    return;
  }

  if (!jobData.containData) {
    return;
  }

  // add data commands
  const preCommands = await jobData.generateDataCommands(
    user,
    protocol.name || '',
  );
  addPreCommandsToProtocolTaskRoles(protocol, preCommands);
}

function removeTagSection(commands, beginTag, endTag) {
  const beginTagIndex = commands.indexOf(beginTag);
  const endTagIndex = commands.indexOf(endTag, beginTagIndex + 1);

  if (beginTagIndex !== -1 && endTagIndex !== -1) {
    return commands.filter(
      (_, index) => index < beginTagIndex || index > endTagIndex,
    );
  }

  return commands;
}

function removeAutoGeneratedCodeFromProtocolTaskRoles(protocol) {
  Object.keys(protocol.taskRoles).forEach(taskRoleKey => {
    const taskRole = protocol.taskRoles[taskRoleKey];
    let commands = taskRole.commands || [];
    if (isEmpty(commands)) {
      return;
    }
    // remove precommands
    commands = removeTagSection(
      commands,
      CUSTOM_STORAGE_START,
      CUSTOM_STORAGE_END,
    );
    commands = removeTagSection(
      commands,
      TEAMWISE_DATA_CMD_START,
      TEAMWISE_DATA_CMD_END,
    );
    taskRole.commands = commands;
  });
}

// The help function to create unique name, the name will be namePrefix_index
export function createUniqueName(usedNames, namePrefix, startindex) {
  let index = startindex;
  let name = `${namePrefix}_${index++}`;
  while (usedNames.find(usedName => usedName === name)) {
    name = `${namePrefix}_${index++}`;
  }
  return [name, index];
}

export function getStoragePlugin(extras) {
  const plugins = get(extras, [PAI_PLUGIN], []);
  if (isEmpty(plugins)) {
    return;
  }
  return plugins.find(plugin => plugin.plugin === 'teamwise_storage');
}
