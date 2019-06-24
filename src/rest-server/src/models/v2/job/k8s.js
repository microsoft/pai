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

const generateTaskRole = (taskRole, config) => {
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
            type: 'kube-launcher-task',
          },
          annotations: {
            'container.apparmor.security.beta.kubernetes.io/main': 'unconfined',
          },
        },
        spec: {
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
                  add: ['SYS_ADMIN', 'DAC_READ_SEARCH', 'DAC_OVERRIDE'],
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

const generateFrameworkDescription = (frameworkName, config) => {
  const frameworkDescription = {
    apiVersion: launcherConfig.apiVersion,
    kind: 'Framework',
    metadata: {
      name: frameworkName,
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
    frameworkDescription.spec.taskRoles.push(generateTaskRole(taskRole, config));
  }
  return frameworkDescription;
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
    return response.data;
  }
  if (response.status === status('Not Found')) {
    throw createError('Not Found', 'NoJobError', `Job ${frameworkName} is not found.`);
  } else {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const put = async (frameworkName, config, rawConfig) => {
  const name = convertName(frameworkName);
  const frameworkDescription = generateFrameworkDescription(name, config);

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

const getConfig = (frameworkName) => {
  return null;
};

// module exports
module.exports = {
  get,
  put,
  getConfig,
};
