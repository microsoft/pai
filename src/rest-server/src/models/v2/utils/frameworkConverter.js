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
const _ = require('lodash');
const yaml = require('js-yaml');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const launcherConfig = require('@pai/config/launcher');
const k8sModel = require('@pai/models/kubernetes/kubernetes');
const k8s = require('@pai/utils/k8sUtils');
const logger = require('@pai/config/logger');
const env = require('@pai/utils/env');
const { decodeName } = require('@pai/models/v2/utils/name');

const positiveFallbackExitCode = 256;
const negativeFallbackExitCode = -8000;

const extractRuntimeOutput = (podCompletionStatus) => {
  if (_.isEmpty(podCompletionStatus)) {
    return null;
  }

  let res = null;
  if (!_.isEmpty(podCompletionStatus.containers)) {
    for (const container of podCompletionStatus.containers) {
      if (container.code <= 0) {
        continue;
      }
      const message = container.message;
      if (message == null) {
        continue;
      }
      const anchor1 = /\[PAI_RUNTIME_ERROR_START\]/;
      const anchor2 = /\[PAI_RUNTIME_ERROR_END\]/;
      const match1 = message.match(anchor1);
      const match2 = message.match(anchor2);
      if (match1 !== null && match2 !== null) {
        const start = match1.index + match1[0].length;
        const end = match2.index;
        const output = message.substring(start, end).trim();
        try {
          res = {
            ...yaml.safeLoad(output),
            name: container.name,
          };
        } catch (error) {
          logger.warn('failed to format runtime output:', output, error);
        }
        break;
      }
    }
  }
  return res;
};

const generateExitDiagnostics = (diag) => {
  if (_.isEmpty(diag)) {
    return null;
  }

  const exitDiagnostics = {
    diagnosticsSummary: diag,
    runtime: null,
    launcher: diag,
  };
  const regex = /matched: (.*)/;
  const matches = diag.match(regex);

  // No container info here
  if (matches === null || matches.length < 2) {
    return exitDiagnostics;
  }

  let podCompletionStatus = null;
  try {
    podCompletionStatus = JSON.parse(matches[1]);
  } catch (error) {
    logger.warn('Get diagnostics info failed', error);
    return exitDiagnostics;
  }

  const summmaryInfo = diag.substring(0, matches.index + 'matched:'.length);
  exitDiagnostics.diagnosticsSummary =
    summmaryInfo + '\n' + yaml.safeDump(podCompletionStatus);
  exitDiagnostics.launcher = exitDiagnostics.diagnosticsSummary;

  // Get runtime output, set launcher output to null. Otherwise, treat all message as launcher output
  exitDiagnostics.runtime = extractRuntimeOutput(podCompletionStatus);
  if (exitDiagnostics.runtime !== null) {
    exitDiagnostics.launcher = null;
    return exitDiagnostics;
  }

  return exitDiagnostics;
};

const generateExitSpecMap = () => {
  let exitSpecPath;
  if (process.env[env.exitSpecPath]) {
    exitSpecPath = process.env[env.exitSpecPath];
    if (!path.isAbsolute(exitSpecPath)) {
      exitSpecPath = path.resolve(__dirname, '../../../../', exitSpecPath);
    }
  } else {
    exitSpecPath = '/k8s-job-exit-spec-configuration/k8s-job-exit-spec.yaml';
  }
  const exitSpecList = yaml.safeLoad(fs.readFileSync(exitSpecPath));
  const exitSpecMap = {};
  exitSpecList.forEach((val) => {
    exitSpecMap[val.code] = val;
  });

  return exitSpecMap;
};

const exitSpecMap = generateExitSpecMap();
const generateExitSpec = (code) => {
  if (!_.isNil(code)) {
    if (!_.isNil(exitSpecMap[code])) {
      return exitSpecMap[code];
    } else {
      if (code > 0) {
        return {
          ...exitSpecMap[positiveFallbackExitCode],
          code,
        };
      } else {
        return {
          ...exitSpecMap[negativeFallbackExitCode],
          code,
        };
      }
    }
  } else {
    return null;
  }
};

const convertState = (state, exitCode) => {
  switch (state) {
    case 'AttemptCreationPending':
    case 'AttemptCreationRequested':
    case 'AttemptPreparing':
      return 'WAITING';
    case 'AttemptRunning':
      return 'RUNNING';
    case 'AttemptDeletionPending':
    case 'AttemptDeletionRequested':
    case 'AttemptDeleting':
    case 'AttemptCompleted':
      if (exitCode === -210 || exitCode === -220) {
        return 'STOPPING';
      } else {
        return 'RUNNING';
      }
    case 'Completed':
      if (exitCode === 0) {
        return 'SUCCEEDED';
      } else if (exitCode === -210 || exitCode === -220) {
        return 'STOPPED';
      } else {
        return 'FAILED';
      }
    default:
      return 'UNKNOWN';
  }
};

const convertAttemptState = (state, exitCode) => {
  switch (state) {
    case 'AttemptCreationPending':
    case 'AttemptCreationRequested':
    case 'AttemptPreparing':
      return 'WAITING';
    case 'AttemptRunning':
      return 'RUNNING';
    case 'AttemptDeletionPending':
    case 'AttemptDeletionRequested':
    case 'AttemptDeleting':
      if (exitCode === -210 || exitCode === -220) {
        return 'STOPPING';
      } else {
        return 'RUNNING';
      }
    case 'AttemptCompleted':
    case 'Completed':
      if (exitCode === 0) {
        return 'SUCCEEDED';
      } else if (exitCode === -210 || exitCode === -220) {
        return 'STOPPED';
      } else {
        return 'FAILED';
      }
    default:
      return 'UNKNOWN';
  }
};

const getContainerPorts = (ports, taskIndex, podUID) => {
  // get container ports
  // The algorithm is:
  // (int(md5(podUid + portName + portIndex)[0:12] ,16) +
  //  int(md5(podUid + portName + portIndex)[12:24] ,16) +
  //  int(md5(podUid + portName + portIndex)[24:32] ,16)) % (schedulePortEnd - schedulePortStart) + schedulePortStart
  const containerPorts = {};
  const hashFunc = (str) => {
    const hexStr = crypto.createHash('md5').update(str).digest('hex');
    return (
      parseInt(hexStr.substring(0, 12), 16) +
      parseInt(hexStr.substring(12, 24), 16) +
      parseInt(hexStr.substring(24), 16)
    );
  };
  if (ports && podUID) {
    const randomPorts = JSON.parse(ports);
    if (randomPorts.ports) {
      for (const port of Object.keys(randomPorts.ports)) {
        const portNums = [...Array(randomPorts.ports[port].count).keys()].map(
          (index) => {
            const rawString = `[${podUID}][${port}][${index}]`;
            return (
              (hashFunc(rawString) %
                (randomPorts.schedulePortEnd - randomPorts.schedulePortStart)) +
              randomPorts.schedulePortStart
            );
          },
        );
        containerPorts[port] = portNums.join();
      }
    } else {
      // for backward compatibility
      for (const port of Object.keys(randomPorts)) {
        containerPorts[port] =
          randomPorts[port].start + taskIndex * randomPorts[port].count;
      }
    }
  }
  return containerPorts;
};

const getContainerGpus = async (withoutGetPod, podName) => {
  let containerGpus = null;
  try {
    if (withoutGetPod !== true) {
      const response = await k8sModel
        .getClient()
        .get(launcherConfig.podPath(podName), {
          headers: launcherConfig.requestHeaders,
        });
      const pod = response.data;
      if (launcherConfig.enabledHived) {
        const isolation =
          pod.metadata.annotations[
            'hivedscheduler.microsoft.com/pod-leaf-cell-isolation'
          ];
        containerGpus = isolation
          .split(',')
          .reduce((attr, id) => attr + Math.pow(2, id), 0);
      } else {
        const gpuNumber = k8s.atoi(
          pod.spec.containers[0].resources.limits['nvidia.com/gpu'],
        );
        // mock GPU ids from 0 to (gpuNumber - 1)
        containerGpus = Math.pow(2, gpuNumber) - 1;
      }
    }
  } catch (err) {
    containerGpus = null;
  }
  return containerGpus;
};

const convertToJobAttempt = async (framework) => {
  if (framework.status === undefined) {
    framework.status = {
      attemptStatus: {
        completionStatus: null,
        id: null,
        startTime: null,
        completionTime: null,
        taskRoleStatuses: [],
      },
      state: null,
      retryPolicyStatus: {
        retryDelaySec: null,
      },
    };
  }

  const completionStatus = framework.status.attemptStatus.completionStatus;
  const jobName = decodeName(
    framework.metadata.name,
    framework.metadata.annotations,
  );
  const frameworkName = framework.metadata.name;
  const logPathInfix = framework.metadata.annotations.logPathInfix
    ? framework.metadata.annotations.logPathInfix
    : jobName;
  const uid = framework.metadata.uid;
  const userName = framework.metadata.labels
    ? framework.metadata.labels.userName
    : 'unknown';
  const state = convertState(
    framework.status.state,
    completionStatus ? completionStatus.code : null,
  );
  const originState = framework.status.state;
  const attemptIndex = framework.status.attemptStatus.id;
  const jobStartedTime = new Date(
    framework.metadata.creationTimestamp,
  ).getTime();
  const attemptStartedTime =
    new Date(framework.status.attemptStatus.startTime).getTime() || null;
  const attemptCompletedTime =
    new Date(framework.status.attemptStatus.completionTime).getTime() || null;
  const totalGpuNumber = framework.metadata.annotations
    ? parseInt(framework.metadata.annotations.totalGpuNumber)
    : 0;
  const totalTaskNumber = framework.spec.taskRoles.reduce(
    (num, spec) => num + spec.taskNumber,
    0,
  );
  const totalTaskRoleNumber = framework.spec.taskRoles.length;
  const diagnostics = completionStatus ? completionStatus.diagnostics : null;
  const exitDiagnostics = generateExitDiagnostics(diagnostics);
  const appExitTriggerMessage =
    completionStatus && completionStatus.trigger
      ? completionStatus.trigger.message
      : null;
  const appExitTriggerTaskRoleName =
    completionStatus && completionStatus.trigger
      ? completionStatus.trigger.taskRoleName
      : null;
  const appExitTriggerTaskIndex =
    completionStatus && completionStatus.trigger
      ? completionStatus.trigger.taskIndex
      : null;
  const appExitSpec = completionStatus
    ? generateExitSpec(completionStatus.code)
    : generateExitSpec(null);
  const appExitDiagnostics = exitDiagnostics
    ? exitDiagnostics.diagnosticsSummary
    : null;

  const appExitMessages = exitDiagnostics
    ? {
        container: null,
        runtime: exitDiagnostics.runtime,
        launcher: exitDiagnostics.launcher,
      }
    : null;

  const taskRoles = {};
  const exitCode = completionStatus ? completionStatus.code : null;
  const exitPhrase = completionStatus ? completionStatus.phrase : null;
  const exitType = completionStatus ? completionStatus.type.name : null;

  for (const taskRoleStatus of framework.status.attemptStatus
    .taskRoleStatuses) {
    taskRoles[taskRoleStatus.name] = {
      taskRoleStatus: {
        name: taskRoleStatus.name,
      },
      taskStatuses: await Promise.all(
        taskRoleStatus.taskStatuses.map(
          async (status) =>
            await convertTaskDetail(
              status,
              userName,
              logPathInfix,
              taskRoleStatus.name,
              true,
            ),
        ),
      ),
    };
  }

  return {
    jobName,
    frameworkName,
    uid,
    userName,
    state,
    originState,
    attemptIndex,
    jobStartedTime,
    attemptStartedTime,
    attemptCompletedTime,
    exitCode,
    exitPhrase,
    exitType,
    exitDiagnostics,
    appExitTriggerMessage,
    appExitTriggerTaskRoleName,
    appExitTriggerTaskIndex,
    appExitSpec,
    appExitDiagnostics,
    appExitMessages,
    totalGpuNumber,
    totalTaskNumber,
    totalTaskRoleNumber,
    taskRoles,
  };
};

const convertTaskDetail = async (
  taskStatus,
  userName,
  logPathInfix,
  taskRoleName,
  withoutGetPod,
) => {
  // get container gpus
  const containerGpus = await getContainerGpus(
    withoutGetPod,
    taskStatus.attemptStatus.podName,
  );
  const completionStatus = taskStatus.attemptStatus.completionStatus;
  return {
    taskIndex: taskStatus.index,
    taskState: convertState(
      taskStatus.state,
      completionStatus ? completionStatus.code : null,
    ),
    containerId: taskStatus.attemptStatus.podUID,
    containerIp: taskStatus.attemptStatus.podHostIP,
    containerGpus,
    containerLog: `http://${taskStatus.attemptStatus.podHostIP}:${process.env.LOG_MANAGER_PORT}/log-manager/tail/${userName}/${logPathInfix}/${taskRoleName}/${taskStatus.attemptStatus.podUID}/`,
    containerExitCode: completionStatus ? completionStatus.code : null,
  };
};

const convertTaskAttempt = async (
  logPathInfix, // job level info
  userName,
  ports,
  taskRoleName, // task role level info
  attemptState, // attempt level info
  attemptStatus,
) => {
  // get containerPorts
  const containerPorts = getContainerPorts(
    ports,
    attemptStatus.id,
    attemptStatus.podUID,
  );
  // get affinity group name
  const affinityGroupName = `default/${attemptStatus.podName}`;
  // get container gpus
  const containerGpus = await getContainerGpus(true, attemptStatus.podName);

  const completionStatus = attemptStatus.completionStatus;
  const diagnostics = completionStatus ? completionStatus.diagnostics : null;
  const exitDiagnostics = generateExitDiagnostics(diagnostics);

  return {
    attemptId: attemptStatus.id,
    attemptState: convertAttemptState(
      attemptState || null,
      completionStatus ? completionStatus.code : null,
    ),
    currentAttemptCreatedTime:
      new Date(attemptStatus.startTime).getTime() || null,
    currentAttemptLaunchedTime:
      new Date(
        attemptStatus.runTime || attemptStatus.completionTime,
      ).getTime() || null,
    currentAttemptCompletedTime:
      new Date(attemptStatus.completionTime).getTime() || null,
    containerId: attemptStatus.podUID,
    containerIp: attemptStatus.podHostIP,
    containerNodeName: attemptStatus.podNodeName,
    // Job level info
    containerPorts,
    containerGpus,
    containerLog: `http://${attemptStatus.podHostIP}:${process.env.LOG_MANAGER_PORT}/log-manager/tail/${userName}/${logPathInfix}/${taskRoleName}/${attemptStatus.podUID}/`,
    containerExitCode: completionStatus ? completionStatus.code : null,
    containerExitSpec: completionStatus
      ? generateExitSpec(completionStatus.code)
      : generateExitSpec(null),
    containerExitDiagnostics: exitDiagnostics
      ? exitDiagnostics.diagnosticsSummary
      : null,
    ...(launcherConfig.enabledHived && {
      hived: {
        affinityGroupName,
        lazyPreempted: null,
        lazyPreemptionStatus: null,
      },
    }),
  };
};

const convertToTaskDetail = async (
  attemptFramework,
  taskRoleName,
  taskStatus,
  taskHistories,
) => {
  const lastTaskAttemptStatus = taskStatus.attemptStatus;
  const lastTaskAttemptState = taskStatus.state;
  const completionStatus = lastTaskAttemptStatus.completionStatus;
  const userName = attemptFramework.metadata.labels.userName;
  const jobName = attemptFramework.metadata.annotations.jobName;

  const taskDetail = {
    // job level information
    username: userName,
    jobName: jobName,
    jobAttemptId: attemptFramework.status.attemptStatus.id,
    // task role level information
    taskRoleName: taskRoleName,
    // task level information
    taskIndex: taskStatus.index,
    taskUid: taskStatus.instanceUID,
    taskState: convertState(
      taskStatus.state,
      completionStatus ? completionStatus.code : null,
    ),
    retries: taskStatus.retryPolicyStatus.totalRetriedCount,
    accountableRetries: taskStatus.retryPolicyStatus.accountableRetriedCount,
    createdTime: new Date(taskStatus.startTime).getTime() || null,
    launchedTime:
      new Date(taskStatus.runTime || taskStatus.completionTime).getTime() ||
      null,
    completedTime: new Date(taskStatus.completionTime).getTime() || null,
    // task attempt level information
    attempts: [],
  };

  const logPathInfix = attemptFramework.metadata.annotations.logPathInfix
    ? attemptFramework.metadata.annotations.logPathInfix
    : jobName;

  const ports = attemptFramework.spec.taskRoles.find(
    (taskRoleSpec) => taskRoleSpec.name === taskRoleName,
  ).task.pod.metadata.annotations['rest-server/port-scheduling-spec'];

  // fill task attempt level information
  // last task attempt
  taskDetail.attempts.push(
    await convertTaskAttempt(
      logPathInfix,
      userName,
      ports,
      taskRoleName,
      lastTaskAttemptState,
      lastTaskAttemptStatus,
    ),
  );

  // history task attempts
  for (const taskHistory of taskHistories) {
    taskDetail.attempts.push(
      await convertTaskAttempt(
        logPathInfix,
        userName,
        ports,
        taskRoleName,
        taskHistory.status.state,
        taskHistory.status.attemptStatus,
      ),
    );
  }

  return taskDetail;
};

// module exports
module.exports = {
  convertToJobAttempt,
  convertToTaskDetail,
  convertState,
  convertAttemptState,
  getContainerPorts,
  generateExitSpec,
  generateExitDiagnostics,
};
