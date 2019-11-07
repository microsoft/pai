const zlib = require('zlib');
const axios = require('axios');
const {Agent} = require('https');

const launcherConfig = require('@pai/config/launcher');
const {apiserver} = require('@pai/config/kubernetes');
const k8s = require('@pai/utils/k8sUtils');

const decodeName = (name, labels) => {
  if (labels && labels.jobName) {
    return labels.jobName;
  } else {
    // framework name has not been encoded
    return name;
  }
};

const decompressField = (val) => {
  if (val == null) {
    return null;
  } else {
    return JSON.parse(zlib.gunzipSync(Buffer.from(val, 'base64')).toString());
  }
};

const convertState = (state, exitCode) => {
  switch (state) {
    case 'AttemptCreationPending':
    case 'AttemptCreationRequested':
    case 'AttemptPreparing':
      return 'WAITING';
    case 'AttemptRunning':
    case 'AttemptDeletionPending':
    case 'AttemptDeletionRequested':
    case 'AttemptDeleting':
      return 'RUNNING';
    case 'AttemptCompleted':
      if (exitCode === 0) {
        return 'SUCCEEDED';
      } else if (exitCode === -210 || exitCode === -220) {
        return 'STOPPED';
      } else {
        return 'FAILED';
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

const convertToJobAttempt = (framework) => {
  const completionStatus = framework.status.attemptStatus.completionStatus;
  const name = decodeName(framework.metadata.name, framework.metadata.labels);
  const frameworkName = framework.metadata.name;
  const username = framework.metadata.labels
    ? framework.metadata.labels.userName
    : 'unknown';
  const state = convertState(
    framework.status.state,
    completionStatus ? completionStatus.code : null,
    framework.status.retryPolicyStatus.retryDelaySec,
  );
  const originState = framework.status.state;
  const maxAttemptCount = framework.spec.retryPolicy.maxRetryCount + 1;
  const attemptIndex = framework.status.attemptStatus.id;
  const jobStartedTime = new Date(
    framework.metadata.creationTimestamp,
  ).getTime();
  const attemptStartedTime = new Date(
    framework.status.attemptStatus.startTime,
  ).getTime();
  const attemptCompletedTime = new Date(
    framework.status.attemptStatus.completionTime,
  ).getTime();
  const totalGpuNumber = framework.metadata.annotations
    ? framework.metadata.annotations.totalGpuNumber
    : 0;
  const totalTaskNumber = framework.spec.taskRoles.reduce(
    (num, spec) => num + spec.taskNumber,
    0,
  );
  const totalTaskRoleNumber = framework.spec.taskRoles.length;
  return {
    name,
    frameworkName,
    username,
    state,
    originState,
    maxAttemptCount,
    attemptIndex,
    jobStartedTime,
    attemptStartedTime,
    attemptCompletedTime,
    totalGpuNumber,
    totalTaskNumber,
    totalTaskRoleNumber,
  };
};

const convertToJobAttemptDetail = async (framework) => {
  // check fields which may be compressed
  if (framework.status.attemptStatus.taskRoleStatuses == null) {
    framework.status.attemptStatus.taskRoleStatuses = decompressField(
      framework.status.attemptStatus.taskRoleStatusesCompressed,
    );
  }

  const completionStatus = framework.status.attemptStatus.completionStatus;
  const attemptSummary = convertToJobAttempt(framework);
  const detail = {
    ...attemptSummary,
    appExitCode: completionStatus ? completionStatus.code : null,
    appExitType: completionStatus ? completionStatus.type.name : null,
    taskRoles: {},
  };

  const userName = framework.metadata.labels
    ? framework.metadata.labels.userName
    : 'unknown';
  const jobName = decodeName(
    framework.metadata.name,
    framework.metadata.labels,
  );

  for (let taskRoleStatus of framework.status.attemptStatus.taskRoleStatuses) {
    detail.taskRoles[taskRoleStatus.name] = {
      taskRoleStatus: {
        name: taskRoleStatus.name,
      },
      taskStatuses: await Promise.all(
        taskRoleStatus.taskStatuses.map(
          async (status) =>
            await convertTaskDetail(
              status,
              userName,
              jobName,
              taskRoleStatus.name,
            ),
        ),
      ),
    };
  }
  return detail;
};

const convertTaskDetail = async (
  taskStatus,
  userName,
  jobName,
  taskRoleName,
) => {
  // get container gpus
  let containerGpus = null;
  try {
    const pod = (await axios({
      method: 'get',
      url: launcherConfig.podPath(taskStatus.attemptStatus.podName),
      headers: launcherConfig.requestHeaders,
      httpsAgent: apiserver.ca && new Agent({ca: apiserver.ca}),
    })).data;
    if (launcherConfig.enabledHived) {
      const isolation =
        pod.metadata.annotations[
          'hivedscheduler.microsoft.com/pod-gpu-isolation'
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
  } catch (err) {
    containerGpus = null;
  }
  const completionStatus = taskStatus.attemptStatus.completionStatus;
  return {
    taskIndex: taskStatus.index,
    taskState: convertState(
      taskStatus.state,
      completionStatus ? completionStatus.code : null,
      taskStatus.retryPolicyStatus.retryDelaySec,
    ),
    containerId: taskStatus.attemptStatus.podUID,
    containerIp: taskStatus.attemptStatus.podHostIP,
    containerGpus,
    containerLog: `http://${taskStatus.attemptStatus.podHostIP}:${process.env.LOG_MANAGER_PORT}/log-manager/${userName}/${jobName}/${taskRoleName}/${taskStatus.attemptStatus.podUID}/`,
    containerExitCode: completionStatus ? completionStatus.code : null,
  };
};

// module exports
module.exports = {
  convertToJobAttempt,
  convertToJobAttemptDetail,
};
