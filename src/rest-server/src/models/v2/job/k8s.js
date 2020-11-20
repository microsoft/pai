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
const yaml = require('js-yaml');
const status = require('statuses');
const runtimeEnv = require('./runtime-env');
const launcherConfig = require('@pai/config/launcher');
const createError = require('@pai/utils/error');
const protocolSecret = require('@pai/utils/protocolSecret');
const userModel = require('@pai/models/v2/user');
const storageModel = require('@pai/models/v2/storage');
const logger = require('@pai/config/logger');
const { apiserver } = require('@pai/config/kubernetes');
const schedulePort = require('@pai/config/schedule-port');
const databaseModel = require('@pai/utils/dbUtils');
const {
  convertState,
  convertAttemptState,
  getContainerPorts,
  generateExitSpec,
  generateExitDiagnostics,
} = require('@pai/models/v2/utils/frameworkConverter');
const {
  convertName,
  checkName,
  encodeName,
  decodeName,
} = require('@pai/models/v2/utils/name');

const Sequelize = require('sequelize');

const convertFrameworkSummary = (framework) => {
  return {
    debugId: framework.name,
    name: framework.jobName,
    username: framework.userName,
    state: framework.state,
    subState: framework.subState,
    executionType: framework.executionType.toUpperCase(),
    tags: framework.tags.reduce((arr, curr) => [...arr, curr.name], []),
    retries: framework.retries,
    retryDetails: {
      user: framework.userRetries,
      platform: framework.platformRetries,
      resource: framework.resourceRetries,
    },
    retryDelayTime: framework.retryDelayTime,
    submissionTime: new Date(framework.submissionTime).getTime(),
    createdTime: new Date(framework.creationTime).getTime() || null,
    launchedTime:
      new Date(framework.runTime || framework.completionTime).getTime() || null,
    completedTime: new Date(framework.completionTime).getTime() || null,
    appExitCode: framework.appExitCode,
    virtualCluster: framework.virtualCluster
      ? framework.virtualCluster
      : 'unknown',
    totalGpuNumber: framework.totalGpuNumber,
    totalTaskNumber: framework.totalTaskNumber,
    totalTaskRoleNumber: framework.totalTaskRoleNumber,
  };
};

const convertTaskDetail = async (
  taskName,
  taskStatus,
  jobAttemptId,
  ports,
  frameworkName,
) => {
  // get containerPorts
  const containerPorts = getContainerPorts(
    ports,
    taskStatus.index,
    taskStatus.attemptStatus.podUID,
  );
  // get affinity group name
  const affinityGroupName = `default/${taskStatus.attemptStatus.podName}`;
  // get container gpus
  const containerGpus = null;

  const completionStatus = taskStatus.attemptStatus.completionStatus;
  const diagnostics = completionStatus ? completionStatus.diagnostics : null;
  const exitDiagnostics = generateExitDiagnostics(diagnostics);
  const taskAttemptId = taskStatus.attemptStatus.id;
  return {
    taskIndex: taskStatus.index,
    taskUid: taskStatus.instanceUID,
    taskState: convertState(
      taskStatus.state,
      completionStatus ? completionStatus.code : null,
    ),
    containerId: taskStatus.attemptStatus.podUID,
    containerIp: taskStatus.attemptStatus.podHostIP,
    containerNodeName: taskStatus.attemptStatus.podNodeName,
    containerPorts,
    containerGpus,
    containerLog: `/api/v2/jobs/${frameworkName}/attempts/${jobAttemptId}/taskRoles/${taskName}/taskIndex/${taskStatus.index}/attempts/${taskAttemptId}/logs`,
    containerExitCode: completionStatus ? completionStatus.code : null,
    containerExitSpec: completionStatus
      ? generateExitSpec(completionStatus.code)
      : generateExitSpec(null),
    containerExitDiagnostics: exitDiagnostics
      ? exitDiagnostics.diagnosticsSummary
      : null,
    retries: taskStatus.retryPolicyStatus.totalRetriedCount,
    accountableRetries: taskStatus.retryPolicyStatus.accountableRetriedCount,
    createdTime: new Date(taskStatus.startTime).getTime() || null,
    launchedTime:
      new Date(taskStatus.runTime || taskStatus.completionTime).getTime() ||
      null,
    completedTime: new Date(taskStatus.completionTime).getTime() || null,
    attemptId: taskAttemptId,
    attemptState: convertAttemptState(
      taskStatus.state || null,
      completionStatus ? completionStatus.code : null,
    ),
    currentAttemptCreatedTime:
      new Date(taskStatus.attemptStatus.startTime).getTime() || null,
    currentAttemptLaunchedTime:
      new Date(
        taskStatus.attemptStatus.runTime ||
          taskStatus.attemptStatus.completionTime,
      ).getTime() || null,
    currentAttemptCompletedTime:
      new Date(taskStatus.attemptStatus.completionTime).getTime() || null,
    ...(launcherConfig.enabledHived && {
      hived: {
        affinityGroupName,
        lazyPreempted: null,
        lazyPreemptionStatus: null,
      },
    }),
  };
};

const convertFrameworkDetail = async (
  frameworkWithLatestAttempt,
  frameworkWithSpecifiedAttempt,
  tags,
) => {
  // job level info
  const jobName = decodeName(
    frameworkWithLatestAttempt.metadata.name,
    frameworkWithLatestAttempt.metadata.annotations,
  );
  const userName = frameworkWithLatestAttempt.metadata.labels
    ? frameworkWithLatestAttempt.metadata.labels.userName
    : 'unknown';
  const virtualCluster = frameworkWithLatestAttempt.metadata.labels
    ? frameworkWithLatestAttempt.metadata.labels.virtualCluster
    : 'unknown';

  const latestAttemptStatus = frameworkWithLatestAttempt.status.attemptStatus;
  const latestAttemptCompletionStatus = latestAttemptStatus.completionStatus;
  const specifiedAttemptStatus =
    frameworkWithSpecifiedAttempt.status.attemptStatus;
  const specifiedAttemptCompletionStatus =
    specifiedAttemptStatus.completionStatus;

  const specifiedAttemptDiagnostics = specifiedAttemptCompletionStatus
    ? specifiedAttemptCompletionStatus.diagnostics
    : null;
  const specifiedAttemptExitDiagnostics = generateExitDiagnostics(
    specifiedAttemptDiagnostics,
  );

  const detail = {
    // job level detail
    debugId: frameworkWithLatestAttempt.metadata.name,
    name: jobName,
    tags: tags.reduce((arr, curr) => [...arr, curr.name], []),
    jobStatus: {
      username: userName,
      state: convertState(
        frameworkWithLatestAttempt.status.state,
        latestAttemptCompletionStatus
          ? latestAttemptCompletionStatus.code
          : null,
      ),
      subState: frameworkWithLatestAttempt.status.state,
      executionType: frameworkWithLatestAttempt.spec.executionType.toUpperCase(),
      retries:
        frameworkWithLatestAttempt.status.retryPolicyStatus.totalRetriedCount,
      retryDetails: {
        user:
          frameworkWithLatestAttempt.status.retryPolicyStatus
            .accountableRetriedCount,
        platform:
          frameworkWithLatestAttempt.status.retryPolicyStatus
            .totalRetriedCount -
          frameworkWithLatestAttempt.status.retryPolicyStatus
            .accountableRetriedCount,
        resource: 0,
      },
      retryDelayTime:
        frameworkWithLatestAttempt.status.retryPolicyStatus.retryDelaySec,
      createdTime:
        new Date(
          frameworkWithLatestAttempt.metadata.creationTimestamp,
        ).getTime() || null,
      launchedTime:
        new Date(
          frameworkWithLatestAttempt.status.runTime ||
            frameworkWithLatestAttempt.status.completionTime,
        ).getTime() || null,
      completedTime:
        new Date(frameworkWithLatestAttempt.status.completionTime).getTime() ||
        null,
      // attempt level detail
      attemptId: specifiedAttemptStatus.id,
      attemptState: convertAttemptState(
        frameworkWithSpecifiedAttempt.status.state || null,
        specifiedAttemptCompletionStatus
          ? specifiedAttemptCompletionStatus.code
          : null,
      ),
      appId: specifiedAttemptStatus.instanceUID,
      appProgress: specifiedAttemptCompletionStatus ? 1 : 0,
      appTrackingUrl: '',
      appCreatedTime:
        new Date(specifiedAttemptStatus.startTime).getTime() || null,
      appLaunchedTime:
        new Date(
          specifiedAttemptStatus.runTime ||
            specifiedAttemptStatus.completionTime,
        ).getTime() || null,
      appCompletedTime:
        new Date(specifiedAttemptStatus.completionTime).getTime() || null,
      appExitCode: specifiedAttemptCompletionStatus
        ? specifiedAttemptCompletionStatus.code
        : null,
      appExitSpec: specifiedAttemptCompletionStatus
        ? generateExitSpec(specifiedAttemptCompletionStatus.code)
        : generateExitSpec(null),
      appExitDiagnostics: specifiedAttemptExitDiagnostics
        ? specifiedAttemptExitDiagnostics.diagnosticsSummary
        : null,
      appExitMessages: specifiedAttemptExitDiagnostics
        ? {
            container: null,
            runtime: specifiedAttemptExitDiagnostics.runtime,
            launcher: specifiedAttemptExitDiagnostics.launcher,
          }
        : null,
      appExitTriggerMessage:
        specifiedAttemptCompletionStatus &&
        specifiedAttemptCompletionStatus.trigger
          ? specifiedAttemptCompletionStatus.trigger.message
          : null,
      appExitTriggerTaskRoleName:
        specifiedAttemptCompletionStatus &&
        specifiedAttemptCompletionStatus.trigger
          ? specifiedAttemptCompletionStatus.trigger.taskRoleName
          : null,
      appExitTriggerTaskIndex:
        specifiedAttemptCompletionStatus &&
        specifiedAttemptCompletionStatus.trigger
          ? specifiedAttemptCompletionStatus.trigger.taskIndex
          : null,
      appExitType: specifiedAttemptCompletionStatus
        ? specifiedAttemptCompletionStatus.type.name
        : null,
      virtualCluster,
    },
    taskRoles: {},
  };
  const ports = {};
  for (const taskRoleSpec of frameworkWithSpecifiedAttempt.spec.taskRoles) {
    ports[taskRoleSpec.name] =
      taskRoleSpec.task.pod.metadata.annotations[
        'rest-server/port-scheduling-spec'
      ];
  }

  for (const taskRoleStatus of specifiedAttemptStatus.taskRoleStatuses) {
    const taskStatuses = await Promise.all(
      taskRoleStatus.taskStatuses.map(
        async (status) =>
          await convertTaskDetail(
            taskRoleStatus.name,
            status,
            specifiedAttemptStatus.id,
            ports[taskRoleStatus.name],
            `${userName}~${jobName}`,
          ),
      ),
    );
    detail.taskRoles[taskRoleStatus.name] = {
      taskRoleStatus: {
        name: taskRoleStatus.name,
      },
      taskStatuses: taskStatuses,
    };
  }

  if (launcherConfig.enabledHived) {
    const affinityGroups = {};
    try {
      const res = await axios.get(
        `${launcherConfig.hivedWebserviceUri}/v1/inspect/affinitygroups/`,
      );
      if (res.data.items) {
        res.data.items.forEach((affinityGroup) => {
          affinityGroups[affinityGroup.metadata.name] = affinityGroup;
        });
      }
    } catch (err) {
      logger.warn('Fail to inspect affinity groups', err);
    }
    for (const taskRoleName of Object.keys(detail.taskRoles)) {
      detail.taskRoles[taskRoleName].taskStatuses.forEach((status, idx) => {
        const name = status.hived.affinityGroupName;
        if (name in affinityGroups) {
          detail.taskRoles[taskRoleName].taskStatuses[
            idx
          ].hived.lazyPreempted = Boolean(
            affinityGroups[name].status.lazyPreemptionStatus,
          );
          detail.taskRoles[taskRoleName].taskStatuses[
            idx
          ].hived.lazyPreemptionStatus =
            affinityGroups[name].status.lazyPreemptionStatus;
        }
      });
    }
  }

  return detail;
};

const generateTaskRole = (
  frameworkName,
  taskRole,
  jobInfo,
  frameworkEnvList,
  config,
) => {
  const ports = config.taskRoles[taskRole].resourcePerInstance.ports || {};
  for (const port of ['ssh', 'http']) {
    if (!(port in ports)) {
      ports[port] = 1;
    }
  }

  const randomPorts = {
    schedulePortStart: schedulePort.start,
    schedulePortEnd: schedulePort.end,
    ports: {},
  };
  for (const port of Object.keys(ports)) {
    randomPorts.ports[port] = {
      count: ports[port],
    };
  }
  // get shared memory size
  let shmMB = 512;
  if ('extraContainerOptions' in config.taskRoles[taskRole]) {
    shmMB = config.taskRoles[taskRole].extraContainerOptions.shmMB || 512;
  }
  // check InfiniBand device
  const infinibandDevice = Boolean(
    'extraContainerOptions' in config.taskRoles[taskRole] &&
      config.taskRoles[taskRole].extraContainerOptions.infiniband,
  );
  // enable gang scheduling or not
  let gangAllocation = 'true';
  const retryPolicy = {
    fancyRetryPolicy: false,
    maxRetryCount: 0,
  };
  if ('extras' in config && config.extras.gangAllocation === false) {
    gangAllocation = 'false';
    retryPolicy.fancyRetryPolicy = true;
    retryPolicy.maxRetryCount = config.taskRoles[taskRole].taskRetryCount || 0;
  }

  const taskRoleEnvList = [
    {
      name: 'PAI_CURRENT_TASK_ROLE_NAME',
      value: taskRole,
    },
    {
      name: 'PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX',
      valueFrom: {
        fieldRef: {
          fieldPath: `metadata.annotations['FC_TASK_INDEX']`,
        },
      },
    },
  ];

  const frameworkTaskRole = {
    name: convertName(taskRole),
    taskNumber: config.taskRoles[taskRole].instances || 1,
    task: {
      retryPolicy,
      podGracefulDeletionTimeoutSec:
        launcherConfig.podGracefulDeletionTimeoutSec,
      pod: {
        metadata: {
          labels: {
            userName: jobInfo.userName,
            virtualCluster: jobInfo.virtualCluster,
            type: 'kube-launcher-task',
          },
          annotations: {
            'container.apparmor.security.beta.kubernetes.io/app': 'unconfined',
            'rest-server/port-scheduling-spec': JSON.stringify(randomPorts),
          },
        },
        spec: {
          privileged: false,
          restartPolicy: 'Never',
          serviceAccountName: 'runtime-account',
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
                  value: apiserver.uri,
                },
                {
                  name: 'GANG_ALLOCATION',
                  value: gangAllocation,
                },
                ...frameworkEnvList,
                ...taskRoleEnvList,
              ],
              volumeMounts: [
                {
                  name: 'pai-vol',
                  mountPath: '/usr/local/pai',
                },
                {
                  name: 'host-log',
                  subPath: `${jobInfo.userName}/${
                    jobInfo.logPathInfix
                  }/${convertName(taskRole)}`,
                  mountPath: '/usr/local/pai/logs',
                },
                {
                  name: 'job-exit-spec',
                  mountPath: '/usr/local/pai-config',
                },
              ],
            },
          ],
          containers: [
            {
              name: 'app',
              imagePullPolicy: 'Always',
              image:
                config.prerequisites.dockerimage[
                  config.taskRoles[taskRole].dockerImage
                ].uri,
              command: ['/usr/local/pai/runtime'],
              resources: {
                limits: {
                  cpu: config.taskRoles[taskRole].resourcePerInstance.cpu,
                  memory: `${config.taskRoles[taskRole].resourcePerInstance.memoryMB}Mi`,
                  'github.com/fuse': 1,
                  'nvidia.com/gpu':
                    config.taskRoles[taskRole].resourcePerInstance.gpu,
                  ...(infinibandDevice && { 'rdma/hca': 1 }),
                },
              },
              env: [
                ...frameworkEnvList,
                ...taskRoleEnvList,
                // backward compatibility
                {
                  name: 'PAI_TASK_INDEX',
                  valueFrom: {
                    fieldRef: {
                      fieldPath: `metadata.annotations['FC_TASK_INDEX']`,
                    },
                  },
                },
              ],
              securityContext: {
                capabilities: {
                  add: ['SYS_ADMIN', 'IPC_LOCK', 'DAC_READ_SEARCH'],
                  drop: ['MKNOD'],
                },
              },
              terminationMessagePath: '/tmp/pai-termination-log',
              volumeMounts: [
                {
                  name: 'dshm',
                  mountPath: '/dev/shm',
                },
                {
                  name: 'pai-vol',
                  mountPath: '/usr/local/pai',
                },
                {
                  name: 'host-log',
                  subPath: `${jobInfo.userName}/${
                    jobInfo.logPathInfix
                  }/${convertName(taskRole)}`,
                  mountPath: '/usr/local/pai/logs',
                },
                {
                  name: 'job-ssh-secret-volume',
                  readOnly: true,
                  mountPath: '/usr/local/pai/ssh-secret',
                },
              ],
            },
          ],
          volumes: [
            {
              name: 'dshm',
              emptyDir: {
                medium: 'Memory',
                sizeLimit: `${shmMB}Mi`,
              },
            },
            {
              name: 'pai-vol',
              emptyDir: {},
            },
            {
              name: 'host-log',
              hostPath: {
                path: `/var/log/pai`,
              },
            },
            {
              name: 'job-ssh-secret-volume',
              secret: {
                secretName: 'job-ssh-secret',
              },
            },
            {
              name: 'job-exit-spec',
              configMap: {
                name: 'runtime-exit-spec-configuration',
              },
            },
          ],
          affinity: {
            nodeAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: [
                  {
                    matchExpressions: [
                      {
                        key: 'pai-worker',
                        operator: 'In',
                        values: ['true'],
                      },
                    ],
                  },
                ],
              },
            },
          },
          imagePullSecrets: [
            {
              name: launcherConfig.runtimeImagePullSecrets,
            },
          ],
          hostNetwork: true,
        },
      },
    },
  };
  // add image pull secret
  if (
    config.prerequisites.dockerimage[config.taskRoles[taskRole].dockerImage]
      .auth
  ) {
    frameworkTaskRole.task.pod.spec.imagePullSecrets.push({
      name: `${encodeName(frameworkName)}-regcred`,
    });
  }
  // add storages
  if ('extras' in config && config.extras.storages) {
    for (const storage of config.extras.storages) {
      if (!storage.name) {
        continue;
      }
      frameworkTaskRole.task.pod.spec.containers[0].volumeMounts.push({
        name: `${storage.name}-volume`,
        mountPath: storage.mountPath || `/mnt/${storage.name}`,
        ...(storage.share === false && { subPath: jobInfo.userName }),
      });
      frameworkTaskRole.task.pod.spec.volumes.push({
        name: `${storage.name}-volume`,
        persistentVolumeClaim: {
          claimName: `${storage.name}`,
          ...(storage.readOnly === true && { readOnly: true }),
        },
      });
    }
  }
  // fill in completion policy
  const completion = config.taskRoles[taskRole].completion;
  frameworkTaskRole.frameworkAttemptCompletionPolicy = {
    minFailedTaskCount:
      completion &&
      'minFailedInstances' in completion &&
      completion.minFailedInstances
        ? completion.minFailedInstances
        : 1,
    minSucceededTaskCount:
      completion &&
      'minSucceededInstances' in completion &&
      completion.minSucceededInstances
        ? completion.minSucceededInstances
        : frameworkTaskRole.taskNumber,
  };
  // check cpu job
  if (config.taskRoles[taskRole].resourcePerInstance.gpu === 0) {
    frameworkTaskRole.task.pod.spec.containers[0].env.push({
      name: 'NVIDIA_VISIBLE_DEVICES',
      value: 'none',
    });
  }
  // hived spec
  if (launcherConfig.enabledHived) {
    frameworkTaskRole.task.pod.spec.schedulerName = `${launcherConfig.scheduler}-ds-${config.taskRoles[taskRole].hivedPodSpec.virtualCluster}`;
    delete frameworkTaskRole.task.pod.spec.containers[0].resources.limits[
      'nvidia.com/gpu'
    ];
    frameworkTaskRole.task.pod.spec.containers[0].resources.limits[
      'hivedscheduler.microsoft.com/pod-scheduling-enable'
    ] = 1;
    frameworkTaskRole.task.pod.metadata.annotations[
      'hivedscheduler.microsoft.com/pod-scheduling-spec'
    ] = yaml.safeDump(config.taskRoles[taskRole].hivedPodSpec);
    if (config.taskRoles[taskRole].resourcePerInstance.gpu > 0) {
      frameworkTaskRole.task.pod.spec.containers[0].env.push(
        {
          name: 'NVIDIA_VISIBLE_DEVICES',
          valueFrom: {
            fieldRef: {
              fieldPath: `metadata.annotations['hivedscheduler.microsoft.com/pod-leaf-cell-isolation']`,
            },
          },
        },
        {
          name: 'PAI_AMD_VISIBLE_DEVICES',
          valueFrom: {
            fieldRef: {
              fieldPath: `metadata.annotations['hivedscheduler.microsoft.com/pod-leaf-cell-isolation']`,
            },
          },
        },
      );
    }
  }

  return frameworkTaskRole;
};

const generateFrameworkDescription = (
  frameworkName,
  virtualCluster,
  config,
  rawConfig,
) => {
  const [userName, jobName] = frameworkName.split(/~(.+)/);
  const jobInfo = {
    jobName,
    userName,
    virtualCluster,
    logPathInfix: `${encodeName(frameworkName)}`,
  };
  const frameworkDescription = {
    apiVersion: launcherConfig.apiVersion,
    kind: 'Framework',
    metadata: {
      name: encodeName(frameworkName),
      labels: {
        userName: jobInfo.userName,
        virtualCluster: jobInfo.virtualCluster,
      },
      annotations: {
        jobName: jobInfo.jobName,
        logPathInfix: jobInfo.logPathInfix,
        config: protocolSecret.mask(rawConfig),
      },
    },
    spec: {
      executionType: 'Start',
      retryPolicy: {
        fancyRetryPolicy: config.jobRetryCount !== -2,
        maxRetryCount: config.jobRetryCount || 0,
      },
      taskRoles: [],
    },
  };

  // generate framework env
  const frameworkEnv = runtimeEnv.generateFrameworkEnv(
    frameworkName,
    config,
    virtualCluster,
  );

  const frameworkEnvList = Object.keys(frameworkEnv).map((name) => {
    return { name, value: `${frameworkEnv[name]}` };
  });

  // fill in task roles
  let totalGpuNumber = 0;
  for (const taskRole of Object.keys(config.taskRoles)) {
    totalGpuNumber +=
      config.taskRoles[taskRole].resourcePerInstance.gpu *
      config.taskRoles[taskRole].instances;
    const taskRoleDescription = generateTaskRole(
      frameworkName,
      taskRole,
      jobInfo,
      frameworkEnvList,
      config,
    );
    if (launcherConfig.enabledPriorityClass) {
      taskRoleDescription.task.pod.spec.priorityClassName = `${encodeName(
        frameworkName,
      )}-priority`;
    } else {
      taskRoleDescription.task.pod.spec.priorityClassName =
        'pai-job-minimal-priority';
    }
    if (config.secrets) {
      taskRoleDescription.task.pod.spec.volumes.push({
        name: 'job-secrets',
        secret: {
          secretName: `${encodeName(frameworkName)}-configcred`,
        },
      });
      taskRoleDescription.task.pod.spec.initContainers[0].volumeMounts.push({
        name: 'job-secrets',
        mountPath: '/usr/local/pai/secrets',
      });
      taskRoleDescription.task.pod.spec.containers[0].volumeMounts.push({
        name: 'job-secrets',
        mountPath: '/usr/local/pai/secrets',
      });
    }
    frameworkDescription.spec.taskRoles.push(taskRoleDescription);
  }
  frameworkDescription.metadata.annotations.totalGpuNumber = `${totalGpuNumber}`;
  return frameworkDescription;
};

const getPriorityClassDef = (frameworkName, priority) => {
  const priorityClass = {
    apiVersion: 'scheduling.k8s.io/v1',
    kind: 'PriorityClass',
    metadata: {
      name: `${encodeName(frameworkName)}-priority`,
    },
    value: priority,
    preemptionPolicy: 'PreemptLowerPriority',
    globalDefault: false,
  };

  return priorityClass;
};

const getDockerSecretDef = (frameworkName, auths) => {
  const cred = {
    auths: {},
  };
  for (const auth of auths) {
    const {
      username = '',
      password = '',
      registryuri = 'https://index.docker.io/v1/',
    } = auth;
    cred.auths[registryuri] = {
      auth: Buffer.from(`${username}:${password}`).toString('base64'),
    };
  }
  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: `${encodeName(frameworkName)}-regcred`,
      namespace: 'default',
    },
    data: {
      '.dockerconfigjson': Buffer.from(JSON.stringify(cred)).toString('base64'),
    },
    type: 'kubernetes.io/dockerconfigjson',
  };
};

const getConfigSecretDef = (frameworkName, secrets) => {
  const data = {
    'secrets.yaml': Buffer.from(yaml.safeDump(secrets)).toString('base64'),
  };
  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name: `${encodeName(frameworkName)}-configcred`,
      namespace: 'default',
    },
    data: data,
    type: 'Opaque',
  };
};

const list = async (
  attributes,
  filters,
  tagsContainFilter,
  tagsNotContainFilter,
  order,
  offset,
  limit,
  withTotalCount,
) => {
  let frameworks;
  let totalCount;

  if (
    Object.keys(tagsContainFilter).length !== 0 ||
    Object.keys(tagsNotContainFilter).length !== 0
  ) {
    filters.name = {};
    // tagsContain
    if (Object.keys(tagsContainFilter).length !== 0) {
      const queryContainFrameworkName = databaseModel.sequelize.dialect.QueryGenerator.selectQuery(
        'tags',
        {
          attributes: ['frameworkName'],
          where: tagsContainFilter,
        },
      );
      filters.name[Sequelize.Op.in] = Sequelize.literal(`
          (${queryContainFrameworkName.slice(0, -1)})
      `);
    }
    // tagsNotContain
    if (Object.keys(tagsNotContainFilter).length !== 0) {
      const queryNotContainFrameworkName = databaseModel.sequelize.dialect.QueryGenerator.selectQuery(
        'tags',
        {
          attributes: ['frameworkName'],
          where: tagsNotContainFilter,
        },
      );
      filters.name[Sequelize.Op.notIn] = Sequelize.literal(`
          (${queryNotContainFrameworkName.slice(0, -1)})
      `);
    }
  }

  frameworks = await databaseModel.Framework.findAll({
    attributes: attributes,
    where: filters,
    offset: offset,
    limit: limit,
    order: order,
    include: [
      {
        attributes: ['name'],
        required: Object.keys(tagsContainFilter).length !== 0,
        model: databaseModel.Tag,
      },
    ],
  });
  if (withTotalCount) {
    totalCount = await databaseModel.Framework.count({ where: filters });
  }
  frameworks = frameworks
    .filter((item) => checkName(item.name))
    .map(convertFrameworkSummary);
  if (withTotalCount) {
    return {
      totalCount: totalCount,
      data: frameworks,
    };
  } else {
    return frameworks;
  }
};

const get = async (frameworkName, jobAttemptId) => {
  // get framework from db
  const framework = await databaseModel.Framework.findOne({
    attributes: ['submissionTime', 'snapshot'],
    where: { name: encodeName(frameworkName) },
    include: [
      {
        attributes: ['name'],
        model: databaseModel.Tag,
        as: 'tags',
      },
    ],
  });

  if (!framework) {
    throw createError(
      'Not Found',
      'NoJobError',
      `Job ${frameworkName} is not found.`,
    );
  }
  const frameworkWithLatestAttempt = JSON.parse(framework.snapshot);

  // find the framework with corresponding job attempt when specified
  // use the latest attempt when not specified
  let frameworkWithSpecifiedAttempt = frameworkWithLatestAttempt;
  if (jobAttemptId !== undefined) {
    if (jobAttemptId < frameworkWithLatestAttempt.status.attemptStatus.id) {
      const frameworkHistory = await databaseModel.FrameworkHistory.findOne({
        attributes: ['snapshot'],
        where: {
          frameworkName: encodeName(frameworkName),
          attemptIndex: jobAttemptId,
        },
      });
      if (!frameworkHistory) {
        throw createError(
          'Not Found',
          'NoJobError',
          `JobAttemptId ${jobAttemptId} is not found in ${frameworkName}.`,
        );
      }
      frameworkWithSpecifiedAttempt = JSON.parse(frameworkHistory.snapshot);
    } else if (
      jobAttemptId > frameworkWithLatestAttempt.status.attemptStatus.id
    ) {
      throw createError(
        'Not Found',
        'NoJobError',
        `JobAttemptId ${jobAttemptId} is not found in ${frameworkName}.`,
      );
    }
  }
  // convert to response schema
  const frameworkDetail = await convertFrameworkDetail(
    frameworkWithLatestAttempt,
    frameworkWithSpecifiedAttempt,
    framework.tags,
  );
  frameworkDetail.jobStatus.submissionTime = new Date(
    framework.submissionTime,
  ).getTime();
  return frameworkDetail;
};

const put = async (frameworkName, config, rawConfig) => {
  const [userName] = frameworkName.split(/~(.+)/);

  const virtualCluster =
    'defaults' in config && config.defaults.virtualCluster != null
      ? config.defaults.virtualCluster
      : 'default';
  const flag = await userModel.checkUserVC(userName, virtualCluster);
  if (flag === false) {
    throw createError(
      'Forbidden',
      'ForbiddenUserError',
      `User ${userName} is not allowed to do operation in ${virtualCluster}`,
    );
  }

  // check deprecated storages config
  if (
    'extras' in config &&
    !config.extras.storages &&
    'com.microsoft.pai.runtimeplugin' in config.extras
  ) {
    for (const plugin of config.extras['com.microsoft.pai.runtimeplugin']) {
      if (plugin.plugin === 'teamwise_storage') {
        if ('parameters' in plugin && plugin.parameters.storageConfigNames) {
          config.extras.storages = plugin.parameters.storageConfigNames.map(
            (name) => {
              return { name };
            },
          );
        } else {
          config.extras.storages = [];
        }
      }
    }
  }
  // check storages for current user
  if ('extras' in config && config.extras.storages) {
    // add default storages if config is empty
    if (config.extras.storages.length === 0) {
      (await storageModel.list(userName, true)).storages.forEach(
        (userStorage) => {
          config.extras.storages.push({
            name: userStorage.name,
            share: userStorage.share,
          });
        },
      );
    } else {
      const userStorages = {};
      (await storageModel.list(userName)).storages.forEach(
        (userStorage) => (userStorages[userStorage.name] = userStorage),
      );
      for (const storage of config.extras.storages) {
        if (!storage.name) {
          continue;
        }
        if (!(storage.name in userStorages)) {
          throw createError(
            'Not Found',
            'NoStorageError',
            `Storage ${storage.name} is not found.`,
          );
        } else {
          storage.share = userStorages[storage.name].share;
        }
      }
    }
    for (const storage of config.extras.storages) {
      if (!storage.name) {
        continue;
      }
      storage.readOnly = (await storageModel.get(storage.name)).readOnly;
    }
  }

  const frameworkDescription = generateFrameworkDescription(
    frameworkName,
    virtualCluster,
    config,
    rawConfig,
  );
  // generate image pull secret
  const auths = Object.values(config.prerequisites.dockerimage)
    .filter((dockerimage) => dockerimage.auth != null)
    .map((dockerimage) => dockerimage.auth);
  const dockerSecretDef = auths.length
    ? getDockerSecretDef(frameworkName, auths)
    : null;

  // generate job config secret
  const configSecretDef = config.secrets
    ? getConfigSecretDef(frameworkName, config.secrets)
    : null;

  // calculate pod priority
  // reference: https://github.com/microsoft/pai/issues/3704
  // Truncate submissionTime to multiple of 1000.
  // Since kubernetes only provide second-level timestamp,
  // We don't want the submission time to be larger than Kubernetes creation time.
  const submissionTime = new Date(parseInt(new Date() / 1000) * 1000);
  let priorityClassDef = null;
  if (launcherConfig.enabledPriorityClass) {
    let jobPriority = 0;
    if (launcherConfig.enabledHived) {
      jobPriority = parseInt(
        Object.values(config.taskRoles)[0].hivedPodSpec.priority,
      );
      jobPriority = Math.min(Math.max(jobPriority, -1), 126);
    }
    const jobCreationTime =
      Math.floor(submissionTime / 16000) & (Math.pow(2, 24) - 1);
    const podPriority = -(((126 - jobPriority) << 24) + jobCreationTime);
    // create priority class
    priorityClassDef = getPriorityClassDef(frameworkName, podPriority);
  }

  // send request to framework controller
  let response;
  try {
    response = await axios({
      method: 'put',
      url:
        launcherConfig.writeMergerUrl +
        '/api/v1/frameworkRequest/' +
        encodeName(frameworkName),
      data: {
        frameworkRequest: frameworkDescription,
        submissionTime: submissionTime,
        configSecretDef: configSecretDef,
        priorityClassDef: priorityClassDef,
        dockerSecretDef: dockerSecretDef,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }
  if (response.status !== status('OK')) {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const execute = async (frameworkName, executionType) => {
  let response;
  try {
    const patchData = {
      spec: {
        executionType: `${executionType.charAt(0)}${executionType
          .slice(1)
          .toLowerCase()}`,
      },
    };
    response = await axios({
      method: 'PATCH',
      url:
        launcherConfig.writeMergerUrl +
        '/api/v1/frameworkRequest/' +
        encodeName(frameworkName),
      data: patchData,
      headers: {
        'Content-Type': 'application/merge-patch+json',
      },
    });
  } catch (error) {
    if (error.response != null) {
      response = error.response;
    } else {
      throw error;
    }
  }
  if (response.status !== status('OK')) {
    throw createError(response.status, 'UnknownError', response.data.message);
  }
};

const getConfig = async (frameworkName) => {
  const framework = await databaseModel.Framework.findOne({
    attributes: ['jobConfig'],
    where: { name: encodeName(frameworkName) },
  });

  if (framework) {
    if (framework.jobConfig) {
      return yaml.safeLoad(framework.jobConfig);
    } else {
      throw createError(
        'Not Found',
        'NoJobConfigError',
        `Config of job ${frameworkName} is not found.`,
      );
    }
  } else {
    throw createError(
      'Not Found',
      'NoJobError',
      `Job ${frameworkName} is not found.`,
    );
  }
};

const getSshInfo = async (frameworkName) => {
  throw createError(
    'Not Found',
    'NoJobSshInfoError',
    `SSH info of job ${frameworkName} is not found.`,
  );
};

const addTag = async (frameworkName, tag) => {
  // check if frameworkName exist
  const framework = await databaseModel.Framework.findOne({
    where: { name: encodeName(frameworkName) },
  });

  if (framework) {
    // add tag
    const data = await databaseModel.Tag.findOrCreate({
      where: {
        frameworkName: encodeName(frameworkName),
        name: tag,
        uid: encodeName(`${frameworkName}+${tag}`),
      },
    });
    return data;
  } else {
    throw createError(
      'Not Found',
      'NoJobError',
      `Job ${frameworkName} is not found.`,
    );
  }
};

const deleteTag = async (frameworkName, tag) => {
  // check if frameworkName exist
  const framework = await databaseModel.Framework.findOne({
    where: { name: encodeName(frameworkName) },
  });

  if (framework) {
    // remove tag
    const numDestroyedRows = await databaseModel.Tag.destroy({
      where: {
        frameworkName: encodeName(frameworkName),
        name: tag,
      },
    });
    if (numDestroyedRows === 0) {
      throw createError(
        'Not Found',
        'NoTagError',
        `Tag ${tag} is not found for job ${frameworkName}.`,
      );
    } else {
      return numDestroyedRows;
    }
  } else {
    throw createError(
      'Not Found',
      'NoJobError',
      `Job ${frameworkName} is not found.`,
    );
  }
};

const getEvents = async (frameworkName, attributes, filters) => {
  const name = encodeName(frameworkName);
  const framework = await databaseModel.Framework.findOne({
    attributes: ['name'],
    where: { name: name },
  });

  if (framework) {
    filters.frameworkName = name;
    const events = await databaseModel.FrameworkEvent.findAll({
      attributes: attributes,
      where: filters,
      order: [['lastTimestamp', 'DESC']],
    });
    return {
      // we use events.length as totolCount because paging is not supported
      // if paging is enabled in the future, we should fire another SQL request to get the real total count
      totalCount: events.length,
      data: events,
    };
  } else {
    throw createError(
      'Not Found',
      'NoJobError',
      `Job ${frameworkName} is not found.`,
    );
  }
};

// module exports
module.exports = {
  list,
  get,
  put,
  execute,
  getConfig,
  getSshInfo,
  addTag,
  deleteTag,
  getEvents,
};
