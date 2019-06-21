import {isObject, isEmpty, isNil, isArrayLike} from 'lodash';
import {basename} from 'path';
import {JobBasicInfo} from '../models/job-basic-info';
import {JobTaskRole} from '../models/job-task-role';

const HIDE_SECRET = '******';

export const dispatchResizeEvent = () => {
  window.dispatchEvent(new Event('resize'));
};

export const keyValueArrayReducer = (acc, cur) => {
  acc = {...acc, ...cur};
  return acc;
};

export function removeEmptyProperties(obj) {
  if (!isObject(obj)) {
    return;
  }

  const newObj = {...obj};
  Object.keys(newObj).forEach((key) => {
    const onCheckingElement = newObj[key];
    if (!isEmpty(onCheckingElement)) {
      return;
    }

    // ignore non-array-like primitive type
    if (!isObject(onCheckingElement) && !isArrayLike(onCheckingElement) && !isNil(onCheckingElement)) {
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

export function pruneComponents(jobInformation, secrets, context) {
  const {vcNames} = context;
  const virtualCluster = jobInformation.virtualCluster;
  if (isEmpty(vcNames) || isNil(vcNames.find((vcName) => vcName === virtualCluster))) {
    jobInformation.virtualCluster = '';
  }

  const removeValueIndex = secrets.map((secret, index) => {
    if (secret.value === HIDE_SECRET) {
      return index;
    }
    return -1;
  }).filter((value) => value >= 0);

  for (let i = removeValueIndex.length -1; i >= 0; i--) {
    secrets.splice(removeValueIndex[i], 1);
  }
}

export function getJobComponentsFormConfig(jobConfig) {
  if (isNil(jobConfig)) {
    return;
  }

  const parameters = jobConfig.parameters || [];
  const taskRoles = jobConfig.taskRoles || [];
  const deployments = jobConfig.deployments || [];
  const prerequisites = jobConfig.prerequisites || [];
  const secrets = jobConfig.secrets || {};

  const updatedJobInformation = JobBasicInfo.fromProtocol(jobConfig);
  const updatedParameters = Object.keys(parameters).map((key) => {
    return {key: key, value: parameters[key]};
  });
  const updatedSecrets = Object.keys(secrets).map((key) => {
    return {key: key, value: secrets[key]};
  });
  const updatedTaskRoles = Object.keys(taskRoles).map((name) =>
    JobTaskRole.fromProtocol(
      name,
      taskRoles[name],
      deployments,
      prerequisites,
      secrets,
    ),
  );
  return [updatedJobInformation, updatedTaskRoles, updatedParameters, updatedSecrets];
}


// The help function to create unique name, the name will be namePrefix_index
export function createUniqueName(usedNames, namePrefix, startindex) {
  let index = startindex;
  let name = `${namePrefix}_${index++}`;
  while (usedNames.find((usedName) => usedName === name)) {
    name = `${namePrefix}_${index++}`;
  }
  return [name, index];
}
