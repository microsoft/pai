const mockFrameworkStatus = () => {
  return {
    state: 'AttemptCreationPending',
    attemptStatus: {
      completionStatus: null,
      taskRoleStatuses: []
    },
    retryPolicyStatus: {
      retryDelaySec: null,
      totalRetriedCount: 0,
      accountableRetriedCount: 0
    }
  }
}

const convertState = (state, exitCode, retryDelaySec) => {
  switch (state) {
    case 'AttemptCreationPending':
    case 'AttemptCreationRequested':
    case 'AttemptPreparing':
      return 'WAITING'
    case 'AttemptRunning':
      return 'RUNNING'
    case 'AttemptDeletionPending':
    case 'AttemptDeletionRequested':
    case 'AttemptDeleting':
      if (exitCode === -210 || exitCode === -220) {
        return 'STOPPING'
      } else {
        return 'RUNNING'
      }
    case 'AttemptCompleted':
      if (retryDelaySec == null) {
        return 'RUNNING'
      } else {
        return 'WAITING'
      }
    case 'Completed':
      if (exitCode === 0) {
        return 'SUCCEEDED'
      } else if (exitCode === -210 || exitCode === -220) {
        return 'STOPPED'
      } else {
        return 'FAILED'
      }
    default:
      return 'UNKNOWN'
  }
}

function convertFrameworkRequest (framework) {
  return {
    name: framework.metadata.name,
    namespace: framework.metadata.namespace,
    jobName: framework.metadata.annotations.jobName,
    userName: framework.metadata.labels.userName,
    jobConfig: framework.metadata.annotations.config,
    executionType: framework.spec.executionType,
    virtualCluster: framework.metadata.labels.virtualCluster,
    // TO DO: jobPriority ?
    totalGpuNumber: framework.metadata.annotations.totalGpuNumber,
    totalTaskNumber: framework.spec.taskRoles.reduce((num, spec) => num + spec.taskNumber, 0),
    totalTaskRoleNumber: framework.spec.taskRoles.length,
    logPathInfix: framework.metadata.annotations.logPathInfix,
    snapshot: JSON.stringify(framework)
  }
}

function convertFrameworkStatus (framework) {
  if (!framework.status) {
    framework.status = mockFrameworkStatus()
  }
  const completionStatus = framework.status.attemptStatus.completionStatus
  return {
    retries: framework.status.retryPolicyStatus.totalRetriedCount,
    retryDelayTime: framework.status.retryPolicyStatus.retryDelaySec,
    platformRetries: framework.status.retryPolicyStatus.totalRetriedCount - framework.status.retryPolicyStatus.accountableRetriedCount,
    resourceRetries: 0,
    userRetries: framework.status.retryPolicyStatus.accountableRetriedCount,
    creationTime: framework.metadata.creationTimestamp ? new Date(framework.metadata.creationTimestamp) : null,
    completionTime: framework.status.completionTime ? new Date(framework.status.completionTime) : null,
    appExitCode: completionStatus ? completionStatus.code : null,
    subState: framework.status.state,
    state: convertState(
      framework.status.state,
      completionStatus ? completionStatus.code : null,
      framework.status.retryPolicyStatus.retryDelaySec
    ),
    snapshot: JSON.stringify(framework)
  }
}


module.exports = {
  convertFrameworkRequest: convertFrameworkRequest,
  convertFrameworkStatus: convertFrameworkStatus
}
