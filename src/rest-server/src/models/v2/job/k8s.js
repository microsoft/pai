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
const axios = require('axios');
const status = require('statuses');
const launcherConfig = require('@pai/config/launcher');
const createError = require('@pai/utils/error');


const convertName = (name) => {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
};

const convertFrameworkSummary = (framework) => {
  return {
    name: framework.metadata.name,
    username: framework.metadata.annotations.userName,
    state: framework.status.state,
    subState: framework.status.state,
    executionType: framework.spec.executionType,
    retries: framework.status.retryPolicyStatus.totalRetriedCount,
    retryDetails: {
      user: framework.status.retryPolicyStatus.accountableRetriedCount,
      platform: framework.status.retryPolicyStatus.totalRetriedCount - framework.status.retryPolicyStatus.accountableRetriedCount,
      resource: 0,
    },
    createdTime: new Date(framework.status.startTime).getTime(),
    completedTime: new Date(framework.status.completionTime).getTime(),
    appExitCode: framework.status.attemptStatus.completionStatus ? framework.status.attemptStatus.completionStatus : null,
    virtualCluster: framework.metadata.annotations.virtualCluster,
    totalGpuNumber: 0, // TODO
    totalTaskNumber: framework.status.attemptStatus.taskRoleStatuses.reduce(
      (num, statuses) => num + statuses.taskStatuses.length, 0),
    totalTaskRoleNumber: framework.status.attemptStatus.taskRoleStatuses.length,
  };
};

const convertTaskDetail = (taskStatus) => {
  const completionStatus = taskStatus.attemptStatus.completionStatus;
  return {
    taskIndex: taskStatus.index,
    taskState: taskStatus.state,
    containerId: taskStatus.attemptStatus.podName,
    containerIp: taskStatus.attemptStatus.podHostIP,
    containerPorts: {}, // TODO
    containerGpus: 0, // TODO
    containerLog: '',
    containerExitCode: completionStatus ? completionStatus.code : null,
  };
};

const convertFrameworkDetail = (framework) => {
  const completionStatus = framework.status.attemptStatus.completionStatus;
  const detail = {
    name: framework.metadata.name,
    jobStatus: {
      username: framework.metadata.annotations.userName,
      state: framework.status.state,
      subState: framework.status.state,
      executionType: framework.spec.executionType,
      retries: framework.status.retryPolicyStatus.totalRetriedCount,
      retryDetails: {
        user: framework.status.retryPolicyStatus.accountableRetriedCount,
        platform: framework.status.retryPolicyStatus.totalRetriedCount - framework.status.retryPolicyStatus.accountableRetriedCount,
        resource: 0,
      },
      createdTime: new Date(framework.status.startTime).getTime(),
      completedTime: new Date(framework.status.completionTime).getTime(),
      appId: framework.status.attemptStatus.instanceUID,
      appProgress: completionStatus ? 1 : 0,
      appTrackingUrl: '',
      appLaunchedTime: new Date(framework.status.startTime).getTime(),
      appCompletedTime: new Date(framework.status.completionTime).getTime(),
      appExitCode: completionStatus ? completionStatus.code : null,
      appExitSpec: {}, // TODO
      appExitDiagnostics: completionStatus ? completionStatus.diagnostics : null,
      appExitMessages: {
        container: null,
        runtime: null,
        launcher: null,
      },
      appExitTriggerMessage: completionStatus ? completionStatus.diagnostics : null,
      appExitTriggerTaskRoleName: null, // TODO
      appExitTriggerTaskIndex: null, // TODO
      appExitType: completionStatus ? completionStatus.type.name : null,
      virtualCluster: framework.metadata.annotations.virtualCluster,
    },
    taskRoles: {},
  };
  for (let taskRoleStatus of framework.status.attemptStatus.taskRoleStatuses) {
    detail.taskRoles[taskRoleStatus.name] = {
      taskRoleStatus: {
        name: taskRoleStatus.name,
      },
      taskStatuses: taskRoleStatus.taskStatuses.map(convertTaskDetail),
    };
  }
  return detail;
};

const generateTaskRole = (taskRole, userName, virtualCluster, config) => {
  const frameworkTaskRole = {
    name: convertName(taskRole),
    taskNumber: config.taskRoles[taskRole].instances || 1,
    task: {
      retryPolicy: {
        fancyRetryPolicy: true,
        maxRetryCount: 0,
      },
      pod: {
        metadata: {
          labels: {
            userName,
            virtualCluster,
            type: 'kube-launcher-task',
          },
          annotations: {
            'container.apparmor.security.beta.kubernetes.io/main': 'unconfined',
          },
        },
        spec: {
          privileged: false,
          restartPolicy: 'Never',
          serviceAccountName: 'frameworkbarrier',
          initContainers: [
            {
              name: 'init',
              imagePullPolicy: 'Always',
              image: launcherConfig.runtimeImage,
              env: [
                {
                  name: 'USER_CMD',
                  value: config.taskRoles[taskRole].entrypoint,
                },
                {
                  name: 'KUBE_APISERVER_ADDRESS',
                  value: launcherConfig.apiServerUri,
                },
              ],
              volumeMounts: [
                {
                  name: 'pai-vol',
                  mountPath: '/usr/local/pai',
                },
                {
                  name: 'host-log',
                  mountPath: '/usr/local/pai/logs',
                },
              ],
            },
          ],
          containers: [
            {
              name: 'main',
              image: config.prerequisites.dockerimage[config.taskRoles[taskRole].dockerImage].uri,
              command: ['/usr/local/pai/run'],
              resources: {
                limits: {
                  'cpu': config.taskRoles[taskRole].resourcePerInstance.cpu,
                  'memory': `${config.taskRoles[taskRole].resourcePerInstance.memoryMB}Mi`,
                  'nvidia.com/gpu': config.taskRoles[taskRole].resourcePerInstance.gpu,
                },
              },
              securityContext: {
                capabilities: {
                  add: ['SYS_ADMIN', 'IPC_LOCK', 'DAC_READ_SEARCH'],
                  drop: ['MKNOD'],
                },
              },
              volumeMounts: [
                {
                  name: 'pai-vol',
                  mountPath: '/usr/local/pai',
                },
                {
                  name: 'host-log',
                  mountPath: '/usr/local/pai/logs',
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'pai-vol',
              emptyDir: {},
            },
            {
              name: 'host-log',
              hostPath: {
                path: `/var/log/pai/job/${taskRole}`,
              },
            },
          ],
          hostNetwork: true,
        },
      },
    },
  };
  // fill in completion policy
  if ('completion' in config.taskRoles[taskRole]) {
    frameworkTaskRole.frameworkAttemptCompletionPolicy = {
      minFailedTaskCount: ('minFailedInstances' in config.taskRoles[taskRole].completion) ?
        config.taskRoles[taskRole].completion.minFailedInstances : 1,
      minSucceededTaskCount: ('minSucceededInstances' in config.taskRoles[taskRole].completion) ?
        config.taskRoles[taskRole].completion.minSucceededInstances : -1,
    };
  } else {
    frameworkTaskRole.frameworkAttemptCompletionPolicy = {
      minFailedTaskCount: 1,
      minSucceededTaskCount: -1,
    };
  }
  return frameworkTaskRole;
};

const generateFrameworkDescription = (frameworkName, userName, virtualCluster, config, rawConfig) => {
  const frameworkDescription = {
    apiVersion: launcherConfig.apiVersion,
    kind: 'Framework',
    metadata: {
      name: frameworkName,
      annotations: {
        userName,
        virtualCluster,
        config: rawConfig,
      },
    },
    spec: {
      executionType: 'Start',
      retryPolicy: {
        fancyRetryPolicy: (config.jobRetryCount !== -2),
        maxRetryCount: config.jobRetryCount || 0,
      },
      taskRoles: [],
    },
  };
  // fill in task roles
  for (let taskRole of Object.keys(config.taskRoles)) {
    frameworkDescription.spec.taskRoles.push(
      generateTaskRole(taskRole, userName, virtualCluster, config));
  }
  return frameworkDescription;
};


const list = async () => {
  // send request to framework controller
  let response;
  try {
    response = await axios({
      method: 'get',
      url: launcherConfig.frameworksPath(),
      headers: launcherConfig.requestHeaders,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }

  if (response.status === status('OK')) {
    return response.data.items.map(convertFrameworkSummary);
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const get = async (frameworkName) => {
  const name = convertName(frameworkName);
  // send request to framework controller
  let response;
  try {
    response = await axios({
      method: 'get',
      url: launcherConfig.frameworkPath(name),
      headers: launcherConfig.requestHeaders,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }

  if (response.status === status('OK')) {
    return convertFrameworkDetail(response.data);
  }
  if (response.status === status('Not Found')) {
    throw createError('Not Found', 'NoJobError', `Job ${frameworkName} is not found.`);
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const put = async (frameworkName, config, rawConfig) => {
  const [userName] = frameworkName.split('~');
  const virtualCluster = ('defaults' in config && config.defaults.virtualCluster != null) ?
    config.defaults.virtualCluster : 'default';

  const name = convertName(frameworkName);
  const frameworkDescription = generateFrameworkDescription(name, userName, virtualCluster, config, rawConfig);

  // send request to framework controller
  let response;
  try {
    response = await axios({
      method: 'post',
      url: launcherConfig.frameworksPath(),
      headers: launcherConfig.requestHeaders,
      data: frameworkDescription,
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }
  if (response.status !== status('Created')) {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const getConfig = async (frameworkName) => {
  const framework = await get(frameworkName);
  return framework.annotations.config;
};

// module exports
module.exports = {
  list,
  get,
  put,
  getConfig,
};
