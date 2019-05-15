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


// module dependencies
const util = require('util');
const axios = require('axios');
const status = require('statuses');
const keygen = require('ssh-keygen');
const mustache = require('mustache');
const yaml = require('js-yaml');
const userModel = require('../user');
const {protocolConvert} = require('../../util/converter');
const HDFS = require('../../util/hdfs');
const createError = require('../../util/error');
const logger = require('../../config/logger');
const azureEnv = require('../../config/azure');
const paiConfig = require('../../config/paiConfig');
const launcherConfig = require('../../config/launcher');
const yarnContainerScriptTemplate = require('../../templates/yarnContainerScript');
const dockerContainerScriptTemplate = require('../../templates/dockerContainerScript');


const generateFrameworkDescription = (frameworkName, userName, config) => {
  const frameworkDescription = {
    version: 10,
    user: {
      name: userName,
    },
    retryPolicy: {
      maxRetryCount: config.jobRetryCount || 0,
      fancyRetryPolicy: (config.jobRetryCount !== -2),
    },
    taskRoles: {},
    platformSpecificParameters: {
      queue: ('defaults' in config && config.defaults.virtualCluster != null) ?
        config.defaults.virtualCluster : 'default',
      taskNodeGpuType: null,
      gangAllocation: true,
      amResource: {
        cpuNumber: launcherConfig.amResource.cpuNumber,
        memoryMB: launcherConfig.amResource.memoryMB,
        diskType: launcherConfig.amResource.diskType,
        diskMB: launcherConfig.amResource.diskMB,
      },
    },
  };
  // fill in task roles
  for (let taskRole of Object.keys(config.taskRoles)) {
    const portList = {
      ssh: {start: 0, count: 1},
      http: {start: 0, count: 1},
    };
    if (config.taskRoles[taskRole].resourcePerInstance.ports != null) {
      for (let port of Object.keys(config.taskRoles[taskRole].resourcePerInstance.ports)) {
        portList[port] = {
          start: 0,
          count: config.taskRoles[taskRole].resourcePerInstance.ports[port],
        };
      }
    }
    // task role in framework description
    const frameworkTaskRole = {
      taskNumber: config.taskRoles[taskRole].instances || 1,
      taskService: {
        version: 0,
        entryPoint: `source YarnContainerScripts/${taskRole}.sh`,
        sourceLocations: [`/Container/${userName}/${frameworkName}/YarnContainerScripts`],
        resource: {
          cpuNumber: config.taskRoles[taskRole].resourcePerInstance.cpu,
          memoryMB: config.taskRoles[taskRole].resourcePerInstance.memoryMB,
          gpuNumber: config.taskRoles[taskRole].resourcePerInstance.gpu,
          portDefinitions: portList,
          diskType: 0,
          diskMB: 0,
        },
      },
    };
    // fill in completion policy
    if ('completion' in config.taskRoles[taskRole]) {
      frameworkTaskRole.applicationCompletionPolicy = {
        minFailedTaskCount: ('minFailedInstances' in config.taskRoles[taskRole].completion) ?
          config.taskRoles[taskRole].completion.minFailedInstances : 1,
        minSucceededTaskCount: ('minSucceededInstances' in config.taskRoles[taskRole].completion) ?
          config.taskRoles[taskRole].completion.minSucceededInstances : null,
      };
    } else {
      frameworkTaskRole.applicationCompletionPolicy = {
        minFailedTaskCount: 1,
        minSucceededTaskCount: null,
      };
    }
    frameworkDescription.taskRoles[taskRole] = frameworkTaskRole;
  }
  return frameworkDescription;
};

// backward compatible generation for yarn container script template in api v1
const generateYarnContainerScript = (frameworkName, userName, config, frameworkDescription, taskRole) => {
  let tasksNumber = 0;
  for (let i of Object.keys(frameworkDescription.taskRoles)) {
    tasksNumber += frameworkDescription.taskRoles[i].taskNumber;
  }
  const yarnContainerScript = mustache.render(yarnContainerScriptTemplate, {
    idx: taskRole,
    jobData: {
      jobName: frameworkName,
      userName: userName,
      image: config.prerequisites.dockerimage[config.taskRoles[taskRole].dockerImage].uri,
      authFile: null,
      virtualCluster: frameworkDescription.platformSpecificParameters.queue,
    },
    taskData: {
      name: taskRole,
      taskNumber: frameworkDescription.taskRoles[taskRole].taskNumber,
      cpuNumber: frameworkDescription.taskRoles[taskRole].taskService.resource.cpuNumber,
      memoryMB: frameworkDescription.taskRoles[taskRole].taskService.resource.memoryMB,
      gpuNumber: frameworkDescription.taskRoles[taskRole].taskService.resource.gpuNumber,
      shmMB: 512,
      minFailedTaskCount: frameworkDescription.taskRoles[taskRole].applicationCompletionPolicy.minFailedInstances,
      minSucceededTaskCount: frameworkDescription.taskRoles[taskRole].applicationCompletionPolicy.minSucceededInstances,
    },
    tasksNumber: tasksNumber,
    taskRoleList: Object.keys(frameworkDescription.taskRoles).join(','),
    taskRolesNumber: Object.keys(frameworkDescription.taskRoles).length,
    jobEnvs: null,
    hdfsUri: launcherConfig.hdfsUri,
    aggregatedStatusUri: launcherConfig.frameworkAggregatedStatusPath(frameworkName),
    frameworkInfoWebhdfsUri: launcherConfig.frameworkInfoWebhdfsPath(frameworkName),
    azRDMA: azureEnv.azRDMA === 'true' ? true : false,
    reqAzRDMA: false,
    inspectPidFormat: '{{.State.Pid}}',
    infoDefaultRuntimeFormat: '{{json .DefaultRuntime}}',
  });
  return yarnContainerScript;
};

// backward compatible generation for docker container script template in api v1
const generateDockerContainerScript = (frameworkName, userName, config, taskRole) => {
  const dockerContainerScript = mustache.render(dockerContainerScriptTemplate, {
    idx: taskRole,
    jobData: {
      jobName: frameworkName,
      userName: userName,
    },
    taskData: {
      command: config.taskRoles[taskRole].entrypoint,
    },
    hdfsUri: launcherConfig.hdfsUri,
    webHdfsUri: launcherConfig.webhdfsUri,
    paiMachineList: paiConfig.machineList,
    azRDMA: azureEnv.azRDMA === 'true' ? true : false,
    reqAzRDMA: false,
  });
  return dockerContainerScript;
};

const generateSSHKeys = async (frameworkName) => {
  try {
    const out = await util.promisify(keygen)({
      location: frameworkName,
      comment: `ssh key for ${frameworkName}`,
      read: true,
      destroy: true,
    });
    const keys = {};
    // private key
    keys[frameworkName] = out.key;
    // public key
    keys[`${frameworkName}.pub`] = out.pubKey;
    return keys;
  } catch (err) {
    logger.warn('Generating ssh key files failed! Will skip generating ssh info.');
    return null;
  }
};

const prepareContainerScripts = async (frameworkName, userName, config, rawConfig) => {
  // hdfs operations
  const hdfs = new HDFS(launcherConfig.webhdfsUri);
  // async mkdir on hdfs
  const mkdir = async (path, user, mode) => {
    const options = {'user.name': user, 'permission': mode};
    return util.promisify(hdfs.createFolder.bind(hdfs))(path, options);
  };

  // async upload file on hdfs
  const upload = async (path, data, user, mode) => {
    const options = {'user.name': user, 'permission': mode, 'overwrite': 'true'};
    return util.promisify(hdfs.createFile.bind(hdfs))(path, data, options);
  };

  // generate framework description
  const frameworkDescription = generateFrameworkDescription(frameworkName, userName, config);

  // prepare scripts on hdfs
  const hdfsPromises = [];
  const pathPrefix = `/Container/${userName}/${frameworkName}`;
  hdfsPromises.push(
    mkdir('/Container', 'root', '777')
  );
  for (let path of ['log', 'tmp']) {
    hdfsPromises.push(
      mkdir(`${pathPrefix}/${path}`, userName, '755')
    );
  }
  for (let taskRole of Object.keys(config.taskRoles)) {
    hdfsPromises.push(
      upload(`${pathPrefix}/YarnContainerScripts/${taskRole}.sh`,
      generateYarnContainerScript(frameworkName, userName, config, frameworkDescription, taskRole), userName, '644')
    );
    hdfsPromises.push(
      upload(`${pathPrefix}/DockerContainerScripts/${taskRole}.sh`,
      generateDockerContainerScript(frameworkName, userName, config, taskRole), userName, '644')
    );
  }
  // upload framework description file to hdfs
  hdfsPromises.push(
    upload(`${pathPrefix}/${launcherConfig.frameworkDescriptionFilename}`,
    JSON.stringify(frameworkDescription, null, 2), userName, '644')
  );
  // upload original config file to hdfs
  hdfsPromises.push(
    upload(`${pathPrefix}/${launcherConfig.jobConfigFileName}`.replace(/json$/, 'yaml'),
    rawConfig, userName, '644')
  );

  // generate ssh key
  if (process.platform === 'linux') {
    const keys = await generateSSHKeys(frameworkName);
    if (keys) {
      for (let keyname of Object.keys(keys)) {
        hdfsPromises.push(
          upload(`${pathPrefix}/ssh/keyFiles/${keyname}`, keys[keyname], userName, '755')
        );
      }
    }
  }

  // wait all hdfs promises
  await Promise.all(hdfsPromises);

  // return framework description
  return frameworkDescription;
};

async function put(frameworkName, config, rawConfig) {
  const [userName] = frameworkName.split('~');
  // check user vc
  const virtualCluster = ('defaults' in config && config.defaults.virtualCluster != null) ?
    config.defaults.virtualCluster : 'default';
  await util.promisify(userModel.checkUserVc)(userName, virtualCluster);

  // generate framework description and prepare container scripts on hdfs
  const frameworkDescription = await prepareContainerScripts(frameworkName, userName, config, rawConfig);

  // send request to framework launcher
  const response = await axios({
    method: 'put',
    url: launcherConfig.frameworkPath(frameworkName),
    headers: launcherConfig.webserviceRequestHeaders(userName),
    data: frameworkDescription,
  });
  if (response.status !== status('Accepted')) {
    throw createError(response.status, 'UnknownError', response.data.raw_body);
  }
}

async function getJobConfig(frameworkName) {
  const [userName, jobName] = frameworkName.split('~');
  const hdfs = new HDFS(launcherConfig.webhdfsUri);
  const readFile = async (path) => {
    return util.promisify(hdfs.readFile.bind(hdfs))(path, null);
  };

  // try to get v2
  try {
    const res = await readFile(`/Container/${userName}/${jobName}/JobConfig.yaml`);
    return yaml.safeLoad(res.content);
  } catch (e) {
    // pass
  }

  // fallback to v1
  try {
    const res = await readFile(`/Container/${userName}/${jobName}/JobConfig.json`);
    return protocolConvert(yaml.safeLoad(res.content));
  } catch (e) {
    throw e;
  }
}

// module exports
module.exports = {
  getJobConfig,
  put,
};
