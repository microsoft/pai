import {debounce, isObject, isEmpty, isNil, isArrayLike} from 'lodash';
import {basename} from 'path';
import {JobBasicInfo} from '../models/job-basic-info';
import {JobTaskRole} from '../models/job-task-role';

export const dispatchResizeEvent = debounce(() => {
  window.dispatchEvent(new Event('resize'));
}, 200);

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
