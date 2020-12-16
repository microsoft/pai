# Rest Server


*Current this doc only contains rest-server private API for internal usage. This API no public compatibility support.*


### `GET /jobs/:jobName`

**Get launcher job detail.**

*Request*

```json
GET /api/v2/jobs/:jobName
```

*Response if succeeded*

```json
Status: 200

{
  jobStatus : {
    name: "jobName",
    username: "username",
    state: "job state",
    attemptState: "job attempt state",
    virtualCluster: "virtual cluster",
    subState: "framework state",
    executionType: "execution type",
    version: "framework version",
    attemptId: "framework attemptId",
    retries: job total retry count,
    retryDetails: {
      // Job failed due to user or unknown error. Refers to launcher return result nonTransientRetriedCount.
      user: userRetries,
      // Job failed due to platform error. Refers to launcher return result transientNormalRetriedCount.
      platform: platformRetries,
      // Job cannot get required resource to run within timeout. Refers to launcher return result transientConflictRetriedCount.
      resource: resourceRetries,
      // Count for unknown retries
      unknown: unKnownRetriedCount,
    },
    createdTime: "createdTimestamp",
    completedTime: "completedTimestamp",
    appLaunchedTime: "application launched time stamp",
    appId: "application_id",
    appProgress: "application progress",
    appTrackingUrl: "application tracking url",
    appExitCode: "application exit code",
    appExitDiagnostics: "application exit diagnostics info",
    appliedCpuNumber: "applied CPU number",
    appliedMemoryMB: "applied memory number",
    // To be compatible with PAI
    appExitSpec: "application exit specification",
    appExitMessages: {
      container: "container exit message",
      runtime: "runtime exit message",
      launcher: "launcher return exit message",
    }
    appExitTriggerMessage: "application exit trigger message",
    appExitTriggerTaskRoleName: "appplication exit trigger task role name",
    appExitTriggerTaskIndex: "application exit trigger task index"
  },
  taskRoles: {
    taskRole: {
      taskRoleStatus: {
        name: "task role name"
      },
      taskStatuses: [
        {
          taskIndex: "task index",
          taskState: "task state",
          containerId: "container id",
          containerIp: "container ip address",
          containerHostName: "container host name",
          containerPorts: "container applied ports",
          containerGpus: "container used gpu",
          containerLog: "container log address",
          containerExitCode: "container exit code",
          containerLaunchedTimestamp: "container launched time stamp",
          containerCompletedTimestamp: "container completed time stamp",
          containerExitDiagnostics: "container exit diagnostics",
          containerExitType: "container exit type",
          retryDetails: {
            // Refers to launcher return result: task.TaskRetryPolicyState.NonTransientRetriedCount
            user: userRetries,
            // Refers to launcher return result: task.TaskRetryPolicyState.TransientConflictRetriedCount + task.TaskRetryPolicyState.TransientNormalRetriedCount
            platform: platformRetries,
            // Refers to launcher return result: task.TaskRetryPolicyState.UnKnownRetriedCount
            unknown: unknownRetries
          }
        }
      ]
    }
  }
}
```

*Response if the job does not exist*

```json
Status: 404

{
  "code": "NoJobError",
  "message": "Job $jobname is not found."
}
```

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `GET /frameworks/:frameworkName/attempts/:frameworkAttemptId?version=:version`

**Get launcher job attempt detail.**

*Request*

```json
GET /api/v2/frameworks/:frameworkName/attempts/:frameworkAttemptId?version=:version
```

*Response if succeeded*

```json
Status: 200

{
  frameworkFullDetail: {
    jobStatus : {
      name: "jobName",
      username: "username",
      state: "job state",
      attemptState: "job attempt state",
      virtualCluster: "virtual cluster",
      subState: "framework state",
      executionType: "execution type",
      version: "framework version",
      attemptId: "framework attemptId",
      retries: job total retry count,
      retryDetails: {
        // Job failed due to user or unknown error. Refers to launcher return result nonTransientRetriedCount.
        user: userRetries,
        // Job failed due to platform error. Refers to launcher return result transientNormalRetriedCount.
        platform: platformRetries,
        // Job cannot get required resource to run within timeout. Refers to launcher return result transientConflictRetriedCount.
        resource: resourceRetries,
        // Count for unknown retries
        unknown: unKnownRetriedCount,
      },
      createdTime: "createdTimestamp",
      completedTime: "completedTimestamp",
      appLaunchedTime: "application launched time stamp",
      appId: "application_id",
      appProgress: "application progress",
      appTrackingUrl: "application tracking url",
      appExitCode: "application exit code",
      appExitDiagnostics: "application exit diagnostics info",
      appliedCpuNumber: "applied CPU number",
      appliedMemoryMB: "applied memory number",
      // To be compatible with PAI
      appExitSpec: "application exit specification",
      appExitMessages: {
        container: "container exit message",
        runtime: "runtime exit message",
        launcher: "launcher return exit message",
      }
      appExitTriggerMessage: "application exit trigger message",
      appExitTriggerTaskRoleName: "appplication exit trigger task role name",
      appExitTriggerTaskIndex: "application exit trigger task index"
    },
    taskRoles: {
      taskRole: {
        taskRoleStatus: {
          name: "task role name"
        },
        taskStatuses: [
          {
            taskIndex: "task index",
            taskState: "task state",
            containerId: "container id",
            containerIp: "container ip address",
            containerHostName: "container host name",
            containerPorts: "container applied ports",
            containerGpus: "container used gpu",
            containerLog: "container log address",
            containerExitCode: "container exit code",
            containerLaunchedTimestamp: "container launched time stamp",
            containerCompletedTimestamp: "container completed time stamp",
            containerExitDiagnostics: "container exit diagnostics",
            containerExitType: "container exit type",
            retryDetails: {
              // Refers to launcher return result: task.TaskRetryPolicyState.NonTransientRetriedCount
              user: userRetries,
              // Refers to launcher return result: task.TaskRetryPolicyState.TransientConflictRetriedCount + task.TaskRetryPolicyState.TransientNormalRetriedCount
              platform: platformRetries,
              // Refers to launcher return result: task.TaskRetryPolicyState.UnKnownRetriedCount
              unknown: unknownRetries
            }
          }
        ]
      }
    }
  },
  frameworkInfo: {
    jobStatus : {
      name: "jobName",
      appId: "application_id",
      username: "username",
      state: "job state",
      attemptState: "job attempt state",
      executionType: "execution type",
      version: "framework version",
      attemptId: "framework attemptId",
      retries: job total retry count,
      retryDetails: {
        // Job failed due to user or unknown error
        user: userRetries,
        // Job failed due to platform error
        platform: platformRetries,
        // Job cannot get required resource to run within timeout
        resource: resourceRetries,
      },
      createdTime: "createdTimestamp",
      completedTime: "completedTimestamp",
      appExitCode: applicationExitCode,
      virtualCluster: "virtual cluster",
      // For compatible with PAI
      totalGpuNumber: total GPU number,
      totalTaskNumber: total task number,
      totalTaskRoleNumber: total task role number,
      jobType: "job type",
      jobDetailLink: "job detail page link. It's a relevant link",
      runningDataCenter: "running data center",
      appTrackingUrl: "application tracking url",
      appExitDiagnostics: "application exit diagnostic info",
      appTag: "application tag",
      allocatedMB: current allocated memory,
      allocatedVCores: current allocated VCore number,
      priority: job priority,
      applicationProgress: "current application progress",
      queuePercentageUseage: "current job queue usage percentage",
      reservcedMB: "job reserved memory",
      utilizedMB: "job utilized memory",
      reservcedVCores: "job reserved vcore",
      utilizedVCores: "job utilized vcore",
      reservedContainers: "job reserved container count",
      runningContianers: "current running container count",
      pendingContaines: "current pending container count",
      preemptedResourceMB: "preempt memory number",
      preemptedResourceVCores: "preempt vcore number",
      numNonAMContainerPreempted: "preempt contianer number exclude AM",
      numAMContainerPreempted: "preempt AM number",
      latestAttemptId: "the latest attempt id",
      jobFullDetailUrl: "job detail page link. It's a obsolute link",
      amContainerLogs: "check if AM container started",
      webportalLink: "Full URL for job detail page on webportal",
      groupId: "the id for job group",
    }
  },
}
```

*Response if the job does not exist*

```json
Status: 404

{
  "code": "NoJobAttemptError",
  "message": "[Version: $frameworkVersion][AttemptId: $frameworkAttemptId] attempt of job $frameworkName is not found."
}
```

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `GET /frameworks/:frameworkName/attempts`

**Get launcher framework- attemptId list.**

*Request*

```json
GET /api/v2/frameworks/:frameworkName/attempts
```

*Response if succeeded*

```json
Status: 200

{
  FrameworkAttempts: [ ... ]
}
```

*Response if the job does not exist*

```json
Status: 404

{
  "code": "NoJobAttemptsError",
  "message": "No list of versions found for framework $frameworkName."
}
```

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```
### `GET /frameworks/:frameworkName/versions`

**Get launcher framework version list.**

*Request*

```json
GET /api/v2/frameworks/:frameworkName/attempts
```

*Response if succeeded*

```json
Status: 200

{
  FrameworkVersions: [ ... ]
}
```

*Response if the job does not exist*

```json
Status: 404

{
  "code": "NoJobVersionsError",
  "message": "[Version: $frameworkVersion] the atempt list of job $frameworkName is not found."
}
```

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```