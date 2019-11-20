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
const userModelV2 = require('@pai/models/v2/user');
const {protocolConvert} = require('@pai/utils/converter');
const HDFS = require('@pai/utils/hdfs');
const createError = require('@pai/utils/error');
const protocolSecret = require('@pai/utils/protocolSecret');
const logger = require('@pai/config/logger');
const azureEnv = require('@pai/config/azure');
const paiConfig = require('@pai/config/paiConfig');
const launcherConfig = require('@pai/config/launcher');
const yarnContainerScriptTemplate = require('@pai/templates/yarnContainerScript');
const dockerContainerScriptTemplate = require('@pai/templates/dockerContainerScript');

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
      gangAllocation: ('extras' in config && config.extras.gangAllocation === false) ?
        false : true,
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
      // forward compatibility for -1 and null
      if (frameworkTaskRole.applicationCompletionPolicy.minFailedTaskCount === -1) {
        frameworkTaskRole.applicationCompletionPolicy.minFailedTaskCount = null;
      }
      if (frameworkTaskRole.applicationCompletionPolicy.minSucceededTaskCount === -1) {
        frameworkTaskRole.applicationCompletionPolicy.minSucceededTaskCount = null;
      }
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
  // get shared memory size
  let shmMB = 512;
  if ('extraContainerOptions' in config.taskRoles[taskRole]) {
    shmMB = config.taskRoles[taskRole].extraContainerOptions.shmMB || 512;
  }
  const yarnContainerScript = mustache.render(yarnContainerScriptTemplate, {
    idx: taskRole,
    jobData: {
      jobName: frameworkName,
      userName: userName,
      image: config.prerequisites.dockerimage[config.taskRoles[taskRole].dockerImage].uri,
      auth: config.prerequisites.dockerimage[config.taskRoles[taskRole].dockerImage].auth,
      authFile: null,
      virtualCluster: frameworkDescription.platformSpecificParameters.queue,
    },
    taskData: {
      name: taskRole,
      taskNumber: frameworkDescription.taskRoles[taskRole].taskNumber,
      cpuNumber: frameworkDescription.taskRoles[taskRole].taskService.resource.cpuNumber,
      memoryMB: frameworkDescription.taskRoles[taskRole].taskService.resource.memoryMB,
      gpuNumber: frameworkDescription.taskRoles[taskRole].taskService.resource.gpuNumber,
      shmMB,
      minFailedTaskCount: frameworkDescription.taskRoles[taskRole].applicationCompletionPolicy.minFailedTaskCount,
      minSucceededTaskCount: frameworkDescription.taskRoles[taskRole].applicationCompletionPolicy.minSucceededTaskCount,
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
    infoDefaultRuntimeFormat: '"{{json .DefaultRuntime}}"',
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
  await mkdir('/Container', 'root', '777');
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
  // mask secrets field before uploading
  hdfsPromises.push(
    upload(`${pathPrefix}/${launcherConfig.jobConfigFileName}`.replace(/json$/, 'yaml'),
    protocolSecret.mask(rawConfig), userName, '644')
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


async function get(frameworkName) {
  const [userName] = frameworkName.split('~');

  // send request to framework launcher
  let response;
  try {
    response = await axios({
      method: 'get',
      url: launcherConfig.frameworkPath(frameworkName),
      headers: launcherConfig.webserviceRequestHeaders(userName),
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }

  if (response.status === status('OK')) {
    return response.data;
  }
  if (response.status === status('Not Found')) {
    throw createError('Not Found', 'NoJobError', `Job ${frameworkName} is not found.`);
  } else {
    throw createError(response.status, 'UnknownError', response.data.raw_body);
  }
}

async function put(frameworkName, config, rawConfig) {
  const [userName] = frameworkName.split('~');
  // check user vc
  const virtualCluster = ('defaults' in config && config.defaults.virtualCluster != null) ?
    config.defaults.virtualCluster : 'default';
  const flag = await userModelV2.checkUserVC(userName, virtualCluster);
  if (flag === false) {
    throw createError('Forbidden', 'ForbiddenUserError', `User ${userName} is not allowed to do operation in ${virtualCluster}`);
  }

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

async function getConfig(frameworkName) {
  const [userName] = frameworkName.split('~');
  const hdfs = new HDFS(launcherConfig.webhdfsUri);
  const readFile = async (path) => {
    return util.promisify(hdfs.readFile.bind(hdfs))(path, null);
  };

  // try to get v2
  try {
    const res = await readFile(`/Container/${userName}/${frameworkName}/JobConfig.yaml`);
    return res.content;
  } catch (e) {
    // pass
  }

  // fallback to v1
  try {
    const res = await readFile(`/Container/${userName}/${frameworkName}/JobConfig.json`);
    return protocolConvert(yaml.safeLoad(res.content));
  } catch (e) {
    throw e;
  }
}

// module exports
module.exports = {
  get,
  put,
  getConfig,
};
