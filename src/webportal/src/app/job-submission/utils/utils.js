import {isObject, isEmpty, isNil, isArrayLike} from 'lodash';
import {basename} from 'path';

import {JobBasicInfo} from '../models/job-basic-info';
import {JobTaskRole} from '../models/job-task-role';
import {CUSTOM_STORAGE_TAG} from '../utils/constants';

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

export async function generateCustomStorageCommands(hdfsClient, dataList) {
  const preCommand = [];
  preCommand.push(CUSTOM_STORAGE_TAG);
  const hdfsConfigFile = '~/.hdfscli.cfg';
  const hdfsUrl = 'http://10.151.40.234:50070';
  const jobDir = `/ametest`;
  preCommand.push(
    `pip install hdfs &>> storage_plugin.log && touch ${hdfsConfigFile} && echo '[dev.alias]' >> ${hdfsConfigFile} && echo 'url = ${hdfsUrl}' >> ${hdfsConfigFile}`,
  );

  // eslint-disable-next-line no-restricted-syntax
  for (const dataItem of dataList) {
    preCommand.push(
      `if [ ! -d ${dataItem.mountPath} ]; then mkdir --parents ${
        dataItem.mountPath
      }; fi &>> storage_plugin.log`,
    );
    if (dataItem.sourceType === 'http') {
      preCommand.push(
        `wget ${dataItem.dataSource} -P ${
          dataItem.mountPath
        } &>> storage_plugin.log`,
      );
    } else if (dataItem.sourceType === 'git') {
      const projectName = getProjectNameFromGit(dataItem.dataSource);
      preCommand.push(
        `git clone ${dataItem.dataSource} ${
          dataItem.mountPath
        }/${projectName} &>> storage_plugin.log`,
      );
    } else if (dataItem.sourceType === 'hdfs') {
      preCommand.push(
        `hdfscli download --alias=dev ${dataItem.dataSource} ${
          dataItem.mountPath
        }`,
      );
    } else if (dataItem.sourceType === 'local') {
      const mountHdfsDir = `${jobDir}${dataItem.mountPath}`;
      if (dataItem.uploadFiles) {
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(
          // eslint-disable-next-line no-loop-func
          dataItem.uploadFiles.map((file) => {
            return hdfsClient.uploadFile(mountHdfsDir, file);
          }),
        );
        dataItem.uploadFiles.forEach((file) => {
          preCommand.push(
            `hdfscli download --alias=dev ${mountHdfsDir}/${file.name} ${
              dataItem.mountPath
            }`,
          );
        });
      }
    }
  }

  preCommand.push(CUSTOM_STORAGE_TAG);
  return preCommand;
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
  return [
    updatedJobInformation,
    updatedTaskRoles,
    updatedParameters,
    updatedSecrets,
  ];
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
