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
const yaml = require('js-yaml');
const HDFS = require('./hdfs');
const createError = require('./error');
const launcherConfig = require('@pai/config/launcher');

const prerequisiteMapping = {
  data: 'dataDir',
  output: 'outputDir',
  script: 'codeDir',
};

// hdfs operations
const hdfs = new HDFS(launcherConfig.webhdfsUri);
// async read file on hdfs
const readFile = async (path) => {
  return util.promisify(hdfs.readFile.bind(hdfs))(path, null);
};

const protocolConvert = async (jobConfig, submission=false) => {
  const protocolObj = {
    protocolVersion: '2',
    name: jobConfig.jobName,
    type: 'job',
    prerequisites: [
      {
        name: 'default',
        type: 'dockerimage',
        uri: jobConfig.image,
      },
    ],
    jobRetryCount: jobConfig.retryCount || 0,
    taskRoles: {},
    deployments: [
      {
        name: 'default',
        taskRoles: {},
      },
    ],
    defaults: {
      virtualCluster: jobConfig.virtualCluster || 'default',
      deployment: 'default',
    },
  };

  const preCommands = [
    'echo "[WARNING] Compatibility mode for v1 job, please use protocol config instead."',
  ];
  for (let [prerequisiteName, dirName] of Object.entries(prerequisiteMapping)) {
    if (jobConfig[dirName]) {
      protocolObj.prerequisites.push({
        name: 'default',
        type: prerequisiteName,
        uri: prerequisiteName === 'data' ? [jobConfig[dirName]]: jobConfig[dirName],
      });
      if (prerequisiteName === 'data') {
        preCommands.push('export PAI_DATA_DIR=<% $data.uri[0] %>');
      } else if (prerequisiteName === 'output') {
        preCommands.push('export PAI_OUTPUT_DIR=<% $output.uri %>');
      } else {
        preCommands.push('export PAI_CODE_DIR=<% $script.uri %>');
      }
    }
  }
  if (jobConfig.authFile) {
    if (submission === true) {
      let authStr;
      try {
        authStr = await readFile(jobConfig.authFile.replace(/(hdfs:\/\/)?([^/\s]+)(\/.*)/, '$3'));
      } catch (err) {
        throw createError(
          'Bad Request',
          'InvalidAuthFileError',
          `Cannot read Authentication file ${jobConfig.authFile}.`
        );
      }
      const authCreds = authStr.trim().split(/\r?\n/);
      if (authCreds.length !== 3) {
        throw createError(
          'Bad Request',
          'InvalidAuthFileError',
          `Authentication file ${jobConfig.authFile} has wrong format.`
        );
      }
      protocolObj.secrets = {
        registry: {
          username: authCreds[1],
          password: authCreds[2],
        },
      };
      protocolObj.prerequisites[0].auth = {
        username: '<% $secrets.registry.username %>',
        password: '<% $secrets.registry.password %>',
        registryuri: authCreds[0],
      };
    } else {
      protocolObj.secrets = '******';
    }
  }
  if (jobConfig.jobEnvs) {
    protocolObj.parameters = {};
    for (let key of Object.keys(jobConfig.jobEnvs)) {
      protocolObj.parameters[key] = jobConfig.jobEnvs[key];
      preCommands.push(`export ${key}=${jobConfig.jobEnvs[key]}`);
    }
  }
  if (jobConfig.extras) {
    protocolObj.extras = {};
    for (let key of Object.keys(jobConfig.extras)) {
      protocolObj.extras[key] = jobConfig.extras[key];
    }
  }

  for (let taskRole of jobConfig.taskRoles) {
    protocolObj.taskRoles[taskRole.name] = {
      instances: taskRole.taskNumber,
      completion: {
        minFailedInstances: taskRole.minFailedTaskCount !== undefined ? taskRole.minFailedTaskCount : 1,
        minSucceededInstances: taskRole.minSucceededTaskCount || null,
      },
      dockerImage: 'default',
      extraContainerOptions: {
        shmMB: taskRole.shmMB || 64,
      },
      resourcePerInstance: {
        cpu: taskRole.cpuNumber,
        memoryMB: taskRole.memoryMB,
        gpu: taskRole.gpuNumber,
      },
      commands: [taskRole.command],
    };
    for (let [prerequisiteName, dirName] of Object.entries(prerequisiteMapping)) {
      if (jobConfig[dirName]) {
        protocolObj.taskRoles[taskRole.name][prerequisiteName] = 'default';
      }
    }
    if (taskRole.portList) {
      protocolObj.taskRoles[taskRole.name].resourcePerInstance.ports = {};
      for (let port of taskRole.portList) {
        protocolObj.taskRoles[taskRole.name].resourcePerInstance.ports[port.label] = port.portNumber;
      }
    }
    protocolObj.deployments[0].taskRoles[taskRole.name] = {preCommands};
  }

  return yaml.safeDump(protocolObj, {
    skipInvalid: true,
    lineWidth: 200,
    noRefs: true,
  });
};

// module exports
module.exports = {
  protocolConvert,
};
