# Quick Start

1. Job config file
    
    Prepare a job config file as described [here](../user/training.md), for example, `exampleJob.json`.

2. Authentication
    
    HTTP POST your username and password to get an access token from:

        http://restserver/api/v1/token
        ```
        For example, with [curl](https://curl.haxx.se/), you can execute below command line:
        ```sh
        curl -H "Content-Type: application/x-www-form-urlencoded" \
             -X POST http://restserver/api/v1/token \
             -d "username=YOUR_USERNAME" -d "password=YOUR_PASSWORD"
        ```
    
    3. Submit a job
    
        HTTP POST the config file as json with access token in header to:
        ```
        http://restserver/api/v1/user/:username/jobs
        ```
        For example, you can execute below command line:
        ```sh
        curl -H "Content-Type: application/json" \
             -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
             -X POST http://restserver/api/v1/user/:username/jobs \
             -d @exampleJob.json
        ```
    
    4. Monitor the job
    
        Check the list of jobs at:
        ```
        http://restserver/api/v1/jobs
        ```
        or
        ```
        http://restserver/api/v1/user/:username/jobs
        ```
        Check your exampleJob status at:
        ```
        http://restserver/api/v1/user/:username/jobs/exampleJob
        ```
        Get the job config JSON content:
        ```
        http://restserver/api/v1/user/:username/jobs/exampleJob/config
        ```
        Get the job's SSH info:
        ```
        http://restserver/api/v1/user/:username/jobs/exampleJob/ssh
        ```
    
    # RestAPI
    
    ## Root URI
    
    Configure the rest server port in [services-configuration.yaml](../../../examples/cluster-configuration/services-configuration.yaml).
    
    ## API Details
    
    ### `POST token`
    
    Authenticated and get an access token in the system.
    
    *Request*
    
    ```json
    POST /api/v1/token
    

*Parameters*

```json
{
  "username": "your username",
  "password": "your password",
  "expiration": "expiration time in seconds"
}
```

*Response if succeeded*

```json
Status: 200

{
  "token": "your access token",
  "user": "username",
  "admin": true if user is admin
}
```

*Response if user does not exist*

```json
Status: 400

{
  "code": "NoUserError",
  "message": "User $username is not found."
}
```

*Response if password is incorrect*

```json
Status: 400

{
  "code": "IncorrectPassworkError",
  "message": "Password is incorrect."
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

### `PUT user`

Update a user in the system. Administrator can add user or change other user's password; user can change his own password.

*Request*

```json
PUT /api/v1/user
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "username": "username in [_A-Za-z0-9]+ format",
  "password": "password at least 6 characters",
  "admin": true | false,
  "modify": true | false
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "update successfully"
}
```

*Response if not authorized*

```json
Status: 401

{
  "code": "UnauthorizedUserError",
  "message": "Guest is not allowed to do this operation."
}
```

*Response if current user has no permission*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Non-admin is not allow to do this operation."
}
```

*Response if updated user does not exist*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username is not found."
}
```

*Response if created user has a duplicate name*

```json
Status: 409

{
  "code": "ConflictUserError",
  "message": "User name $username already exists."
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

### `DELETE user` (administrator only)

Remove a user in the system.

*Request*

```json
DELETE /api/v1/user
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "username": "username to be removed"
}
```

*Response if succeeded*

```json
Status: 200

{
  "message": "remove successfully"
}
```

*Response if not authorized*

```json
Status: 401

{
  "code": "UnauthorizedUserError",
  "message": "Guest is not allowed to do this operation."
}
```

*Response if user has no permission*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Non-admin is not allow to do this operation."
}
```

*Response if an admin will be removed*

```json
Status: 403

{
  "code": "RemoveAdminError",
  "message": "Admin $username is not allowed to remove."
}
```

*Response if updated user does not exist*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username is not found."
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

### `PUT user/:username/virtualClusters` (administrator only)

Administrators can update user's virtual cluster. Administrators can access all virtual clusters, all users can access default virtual cluster.

*Request*

```json
PUT /api/v1/user/:username/virtualClusters
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "virtualClusters": "virtual cluster list separated by commas (e.g. vc1,vc2)"
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "update user virtual clusters successfully"
}
```

*Response if the virtual cluster does not exist.*

```json
Status: 400

{
  "code": "NoVirtualClusterError",
  "message": "Virtual cluster $vcname is not found."
}
```

*Response if not authorized*

```json
Status: 401

{
  "code": "UnauthorizedUserError",
  "message": "Guest is not allowed to do this operation."
}
```

*Response if user has no permission*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Non-admin is not allow to do this operation."
}
```

*Response if user does not exist.*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username is not found."
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

### `GET jobs`

Get the list of jobs.

*Request*

```json
GET /api/v1/jobs
```

*Parameters*

```json
{
  "username": "filter jobs with username"
}
```

*Response if succeeded*

```json
Status: 200

{
  [ ... ]
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

### `GET user/:username/jobs`

Get the list of jobs of user.

*Request*

```json
GET /api/v1/user/:username/jobs
```

*Response if succeeded*

```json
Status: 200

{
  [ ... ]
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

### `GET user/:username/jobs/:jobName`

Get job status in the system.

*Request*

```json
GET /api/v1/user/:username/jobs/:jobName
```

*Response if succeeded*

```json
Status: 200

{
  name: "jobName",
  jobStatus: {
    username: "username",
    virtualCluster: "virtualCluster",
    state: "jobState",
    // raw frameworkState from frameworklauncher
    subState: "frameworkState",
    createdTime: "createdTimestamp",
    completedTime: "completedTimestamp",
    executionType: "executionType",
    // sum of retries
    retries: retries,
    retryDetails: {
      // Job failed due to user or unknown error
      user: userRetries,
      // Job failed due to platform error
      platform: platformRetries,
      // Job cannot get required resource to run within timeout
      resource: resourceRetries,
    },
    appId: "applicationId",
    appProgress: "applicationProgress",
    appTrackingUrl: "applicationTrackingUrl",
    appLaunchedTime: "applicationLaunchedTimestamp",
    appCompletedTime: "applicationCompletedTimestamp",
    appExitCode: applicationExitCode,
    // please check https://github.com/Microsoft/pai/blob/master/src/job-exit-spec/config/job-exit-spec.md for more information
    appExitSpec: exitSpecObject,
    appExitTriggerMessage: "applicationExitTriggerMessage",
    appExitTriggerTaskRoleName: "applicationExitTriggerTaskRoleName",
    appExitTriggerTaskIndex: "applicationExitTriggerTaskIndex",
    appExitDiagnostics: "applicationExitDiagnostics",
    // exit messages extracted from exitDiagnostics
    appExitMessages: {
      contaier: "containerStderr",
      // please check https://github.com/Microsoft/pai/blob/master/docs/rest-server/runtime-exit-spec.md for more information
      runtime: runtimeScriptErrorObject,
      launcher: "launcherExitMessage"
    },
    // appExitType is deprecated, please use appExitSpec instead.
    appExitType: "applicationExitType",
  },
  taskRoles: {
    // Name-details map
    "taskRoleName": {
      taskRoleStatus: {
        name: "taskRoleName"
      },
      taskStatuses: {
        taskIndex: taskIndex,
        taskState: taskState,
        containerId: "containerId",
        containerIp: "containerIp",
        containerPorts: {
          // Protocol-port map
          "protocol": "portNumber"
        },
        containerGpus: containerGpus,
        containerLog: containerLogHttpAddress,
      }
    },
    ...
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

### `POST user/:username/jobs`

Submit a job in the system.

*Request*

```json
POST /api/v1/user/:username/jobs
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

[job config json](../job_tutorial.md)

*Response if succeeded*

```json
Status: 202

{
  "message": "update job $jobName successfully"
}
```

*Response if the virtual cluster does not exist.*

```json
Status: 400

{
  "code": "NoVirtualClusterError",
  "message": "Virtual cluster $vcname is not found."
}
```

*Response if user has no permission*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "User $username is not allowed to add job to $vcname
}
```

*Response if there is a duplicated job submission*

```json
Status: 409

{
  "code": "ConflictJobError",
  "message": "Job name $jobname already exists."
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

### `GET user/:username/jobs/:jobName/config`

Get job config JSON content.

*Request*

```json
GET /api/v1/user/:username/jobs/:jobName/config
```

*Response if succeeded*

```json
Status: 200

{
  "jobName": "test",
  "image": "pai.run.tensorflow",
  ...
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

*Response if the job config does not exist*

```json
Status: 404

{
  "code": "NoJobConfigError",
  "message": "Config of job $jobname is not found."
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

### `GET user/:username/jobs/:jobName/ssh`

Get job SSH info.

*Request*

```json
GET /api/v1/user/:username/jobs/:jobName/ssh
```

*Response if succeeded*

```json
Status: 200

{
  "containers": [
    {
      "id": "<container id>",
      "sshIp": "<ip to access the container's ssh service>",
      "sshPort": "<port to access the container's ssh service>"
    },
    ...
  ],
  "keyPair": {
    "folderPath": "HDFS path to the job's ssh folder",
    "publicKeyFileName": "file name of the public key file",
    "privateKeyFileName": "file name of the private key file",
    "privateKeyDirectDownloadLink": "HTTP URL to download the private key file"
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

*Response if the job SSH info does not exist*

```json
Status: 404

{
  "code": "NoJobSshInfoError",
  "message": "SSH info of job $jobname is not found."
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

### `PUT user/:username/jobs/:jobName/executionType`

Start or stop a job.

*Request*

```json
PUT /api/v1/user/:username/jobs/:jobName/executionType
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "value": "START" | "STOP"
}
```

*Response if succeeded*

```json
Status: 200

{
  "message": "execute job $jobName successfully"
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

### `GET virtual-clusters`

Get the list of virtual clusters.

*Request*

```json
GET /api/v1/virtual-clusters
```

*Response if succeeded*

```json
Status: 200

{
  "vc1":
  {
  }
  ...
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

### `GET virtual-clusters/:vcName`

Get virtual cluster status in the system.

*Request*

```json
GET /api/v1/virtual-clusters/:vcName
```

*Response if succeeded*

```json
Status: 200

{
  //capacity percentage this virtual cluster can use of entire cluster
  "capacity":50,
  //max capacity percentage this virtual cluster can use of entire cluster
  "maxCapacity":100,
  // used capacity percentage this virtual cluster can use of entire cluster
  "usedCapacity":0,
  "numActiveJobs":0,
  "numJobs":0,
  "numPendingJobs":0,
  "resourcesUsed":{
   "memory":0,
   "vCores":0,
   "GPUs":0
  },
  "state":"running"
}
```

*Response if the virtual cluster does not exist*

```json
Status: 404

{
  "code": "NoVirtualClusterError",
  "message": "Virtual cluster $vcname is not found."
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

### `PUT virtual-clusters/:vcName` (administrator only)

Add or update virtual cluster quota in the system, don't allow to operate "default" vc.

*Request*

```json
PUT /api/v1/virtual-clusters/:vcName
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "vcCapacity": new capacity,
  "vcMaxCapacity": new max capacity, range of [vcCapacity, 100]
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Update vc: $vcName to capacity: $vcCapacity successfully."
}
```

*Response if try to update "default" vc*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Don't allow to update default vc"
}
```

*Response if current user has no permission*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Non-admin is not allow to do this operation."
}
```

*Response if no enough quota*

```json
Status: 403

{
  "code": "NoEnoughQuotaError",
  "message": "No enough quota in default vc."
}
```

*Response if "default" virtual cluster does not exist*

```json
Status: 404

{
  "code": "NoVirtualClusterError",
  "message": "Default virtual cluster is not found, can't allocate or free resource."
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

### `DELETE virtual-clusters/:vcName` (administrator only)

remove virtual cluster in the system, don't allow to operate "default" vc.

*Request*

```json
DELETE /api/v1/virtual-clusters/:vcName
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Remove vc: $vcName successfully."
}
```

*Response if current user has no permission*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Non-admin is not allow to do this operation."
}
```

*Response if try to update "default" vc*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Don't allow to remove default vc."
}
```

*Response if the virtual cluster does not exist*

```json
Status: 404

{
  "code": "NoVirtualClusterError",
  "message": "Virtual cluster $vcname is not found."
}
```

*Response if "default" virtual cluster does not exist*

```json
Status: 404

{
  "code": "NoVirtualClusterError",
  "message": "Default virtual cluster is not found, can't allocate or free resource."
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

### `PUT virtual-clusters/:vcName/status` (administrator only)

Change virtual cluster status, don't allow to operate "default" vc.

*Request*

```json
PUT /api/v1/virtual-clusters/:vcName/status
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "vcStatus": "running" | "stopped"
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Update vc: $vcName to status: $vcStatus successfully."
}
```

*Response if try to update "default" vc*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Don't allow to update default vc"
}
```

*Response if current user has no permission*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Non-admin is not allow to do this operation."
}
```

*Response if the virtual cluster does not exist*

```json
Status: 404

{
  "code": "NoVirtualClusterError",
  "message": "Virtual cluster $vcname is not found."
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

## API v2

### `POST jobs`

Submit a job v2 in the system.

*Request*

```json
POST /api/v2/jobs
Content-Type: text/yaml
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

[job protocol yaml](../pai-job-protocol.yaml)

*Response if succeeded*

```json
Status: 202

{
  "message": "update job $jobName successfully"
}
```

*Response if the virtual cluster does not exist.*

```json
Status: 400

{
  "code": "NoVirtualClusterError",
  "message": "Virtual cluster $vcname is not found."
}
```

*Response if user has no permission*

    Status: 403
    
    {
      "code": "ForbiddenUserError",
      "message": "User $username is not allowed to add job to $vcname
    }
    

*Response if there is a duplicated job submission*

```json
Status: 409

{
  "code": "ConflictJobError",
  "message": "Job name $jobname already exists."
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

### `GET jobs/:frameworkName/config`

Get job config JSON or YAML content.

*Request*

```json
GET /api/v2/jobs/:frameworkName/config
Accept: json (for v1 jobs)
Accept: yaml (for v2 jobs)
```

*Response if succeeded*

```json
Status: 200

{
  "jobName": "test",
  "image": "pai.run.tensorflow",
  ...
}

or

jobName: test
protocolVersion: 2
...
```

*Response if the job does not exist*

```json
Status: 404

{
  "code": "NoJobError",
  "message": "Job $jobname is not found."
}
```

*Response if the job config does not exist*

```json
Status: 404

{
  "code": "NoJobConfigError",
  "message": "Config of job $jobname is not found."
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

## About legacy jobs

从此版本开始，会启用 [Framework ACL](../../../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#Framework_ACL) ，Job 的命名空间会包含创建者的用户名。 However there were still some jobs created before the version upgrade, which has no namespaces. They are called "legacy jobs", which can be retrieved, stopped, but cannot be created. To figure out them, there is a "legacy: true" field of them in list apis.

In the next versions, all operations of legacy jobs may be disabled, so please re-create them as namespaced job as soon as possible.