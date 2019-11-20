# Quick Start

## 1. Job config file

Prepare a job config file as described [here](../user/training.md), for example, `exampleJob.json`.

## 2. Authentication

### a. Basic Mode, user account and password

HTTP POST your username and password to get an access token from:

```bash
http://restserver/api/v1/token
```

For example, with [curl](https://curl.haxx.se/), you can execute below command line:

```sh
curl -H "Content-Type: application/x-www-form-urlencoded" \
      -X POST http://restserver/api/v1/token \
      -d "username=YOUR_USERNAME" -d "password=YOUR_PASSWORD"
```

### b. Azure AD - OIDC mode

#### I. Login - get AuthCode

HTTP GET the redirect URL of Azure AD for authentication:

```url
http://restserver/api/v1/authn/oidc/login
```

#### II. Login - get token with AuthCode

HTTP POST the token from AAD (AccessToken, IDToken, RefreshToken) to get OpenPAI's access token. Web-browser will call this API automatically after the step I.

```url
HTTP://restserver/api/v1/authn/oidc/return
```

#### III. Logout

HTTP GET the redirect URL of Azure AD to sign out the authentication:

```url
http://restserver/api/v1/authn/oidc/logout
```

## 3. Submit a job

HTTP POST the config file as json with access token in header to:

```bash
http://restserver/api/v1/user/:username/jobs
```

For example, you can execute below command line:

```sh
curl -H "Content-Type: application/json" \
      -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
      -X POST http://restserver/api/v1/user/:username/jobs \
      -d @exampleJob.json
```

## 4. Monitor the job

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

Configure the rest server port in [services-configuration.yaml](../../examples/cluster-configuration/services-configuration.yaml).

## API Details

### `GET cluster info`

Get OpenPAI cluster info.

*Request*

```json
GET /api/v1/
```

*Response if succeeded*

```json
Status: 200

{
  "name": "PAI RESTfulAPI",
  "version": "v0.X.0",
  "launcherType": "yarn" | "k8s",
  "authnMethod": "basic" | "OIDC"
}
```

### `POST token`  (basic authentication mode only)

Authenticated and get an access token in the system.

*Request*

```json
POST /api/v1/token
```

*Parameters*

```json
Status: 200

{
  "username": "your username",
  "password": "your password",
  "expiration": "expiration time in seconds",
  "hasGitHubPAT": true | false
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

### `POST application token`

Create an application access token in the system.<br />
Application access token can only be used for job related operations.<br />
Application access token has no expiration time and can be revoked manually.

*Request*

```json
POST /api/v1/token/application
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

{
  "token": "your access token",
  "application": true,
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

### `GET token`

Get your currently signed tokens.

*Request*

```json
GET /api/v1/token/
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

{
  "tokens": [
    "jwt string",
  ]
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

### `DELETE token/:token`

Revoke a token.

*Request*

```json
DELETE /api/v1/token/:token
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

{
  "message": "revoke successfully"
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
  "message": "User is not allow to do this operation."
}
```

### `POST user` (administrator only, basic authentication mode only)

Admin can create a user in system.

*Request*

```
POST /api/v2/user
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "username": "username in [\w.-]+ format",
  "password": "password at least 6 characters",
  "admin": true | false,
  "email": "email address or empty string",
  "virtualCluster": ["vcname1 in [A-Za-z0-9_]+ format", "vcname2 in [A-Za-z0-9_]+ format"],
  "extension": {
    "extension-key1": "extension-value1"
  }
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "User is created successfully"
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

### `PUT user password` (basic authentication mode only)

Administrator change other user's password; user can change his own password.

*Request*

```json
PUT /api/v2/user/:username/password
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "oldPassword": "password at least 6 characters, admin could ignore this params",
  "newPassword": "password at least 6 characters"
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "update user password successfully."
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

*Response if user input the wrong password*

```json
Status: 403

{
  "code": "ForbiddenUserError",
  "message": "Pls input the correct password."
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

### `PUT user virtualcluster` (administrator only, basic authentication mode only)

Administrator change other user's virtualCluster list.

*Request*

```json
PUT /api/v2/user/:username/virtualcluster
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "virtualCluster": ["vcname1 in [A-Za-z0-9_]+ format", "vcname2 in [A-Za-z0-9_]+ format"]
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Update user virtualCluster data successfully."
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
  "message": "User $username not found."
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

### `PUT user email` (basic authentication mode only)

Administrator change other user's email address, and user could update his own email address.

*Request*

```json
PUT /api/v2/user/:username/email
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "email": "The email address."
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Update user email data successfully."
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

*Response if user does not exist.*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username not found."
}
```

### `PUT user admin permission` (administrator only, basic authentication mode only)

Administrator change other user's email address, and user could update his own email address.

*Request*

```json
PUT /api/v2/user/:username/admin
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "admin": true | false
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Update user admin permission successfully."
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

*Response if user does not exist.*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username not found."
}
```

### `PUT user extension`

Administrator change other user's extension, and user could update his own extension.

*Request*

```json
PUT /api/v2/user/:username/extension
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "extension": {
    "key-you-wannat-add-or-update-1": "value1",
    "key-you-wannat-add-or-update-2": {...},
    "key-you-wannat-add-or-update-3": [...]
  }
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Update user extension data successfully."
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

*Response if user does not exist.*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username not found."
}
```

### `PUT user grouplist` (administrator only, basic authentication mode only)

Administrator change other user's grouplist.

*Request*

```json
PUT /api/v2/user/:username/grouplist
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "grouplist": ["group1 in [A-Za-z0-9_]+ format", "group2 in [A-Za-z0-9_]+ format", "group3 in [A-Za-z0-9_]+ format"]
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "update user grouplist successfully."
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

*Response if user does not exist.*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username not found."
}
```

### `PUT user group` (administrator only, basic authentication mode only)

Administrator add a group to other user's grouplist.

*Request*

```json
PUT /api/v2/user/:username/group
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "groupname": "groupname in [A-Za-z0-9_]+ format"
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "User ${username} is added into group ${groupname}"
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

*Response if user does not exist.*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username not found."
}
```

### `DELETE user` (administrator only, basic authentication mode only)

Remove a user in the system.

*Request*

```json
DELETE /api/v2/user/:username
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

{
  "message": "user is removed successfully"
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

### `DELETE user group` (administrator only, basic authentication mode only)

Administrator remove a group from other user's grouplist.

*Request*

```json
DELETE /api/v2/user/:username/group
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "groupname": "groupname in [A-Za-z0-9_]+ format"
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "User ${username} is removed from group ${groupname}"
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

*Response if user does not exist.*

```json
Status: 404

{
  "code": "NoUserError",
  "message": "User $username not found."
}
```

### `POST group` (administrator only)

Admin can create a group in system.

*Request*

```
POST /api/v2/group
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "groupname": "username in [A-Za-z0-9_]++ format",
  "description": "description for the group",
  "externalName": "the external group name binding with the group in OpenPAI",
  "extension": {
    "extension-key1": "extension-value1"
  }
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "group is created successfully"
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

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `PUT group extension` (administrator only)

Admin can change a group's extension.

*Request*

```
PUT /api/v2/group/:groupname/extension
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "extension": {
    "key-create-or-update-1": "extension-value1",
    "key-create-or-update-2": [ ... ],
    "key-create-or-update-3": { ... }
  }
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "update group extension data successfully."
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

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `PUT group extension attribute` (administrator only)

Admin can change a specific attribute in a nested group extension. Admin could change group acl by this api.

*Request*

```
PUT /api/v2/group/:groupname/extension/path/to/attr
Authorization: Bearer <ACCESS_TOKEN>
```

*Body*

```json
{
  "data": [...] | {...} | boolean etc.
}
```

*Example*
```
Update group available virtualClusters
PUT /api/v2/group/:groupname/extension/acls/virtualClusters
Authorization: Bearer <ACCESS_TOKEN>
Body {"data": ["vc1", "vc2"]}

Update group admin privilege
PUT /api/v2/group/:groupname/extension/acls/admin
Authorization: Bearer <ACCESS_TOKEN>
Body {"data": true/false}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Update group extension data successfully"
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

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `PUT group description` (administrator only)

Admin can change a group's description.

*Request*

```
PUT /api/v2/group/:groupname/description
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "description": "description for the group"
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "update group description data successfully."
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

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `PUT group externalname` (administrator only)

Admin can change a group's externalname, and bind it with another external group.

*Request*

```
PUT /api/v2/group/:groupname/externalname
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "externalName": "the external group name binding with the group in OpenPAI"
}
```

*Response if succeeded*

```json
Status: 201

{
  "message": "update group externalNameData data successfully."
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

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `DELETE group` (administrator only)

Admin can delete a group from system.

*Request*

```
DELETE /api/v2/group/:groupname
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 201

{
  "message": "group is removed successfully"
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

Get job config content.
This API returns the original format (text/plain) of submitted job config.

*Request*

```json
GET /api/v1/user/:username/jobs/:jobName/config
```

*Response if succeeded*

```text
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
Status: 202

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
  // capacity percentage this virtual cluster can use of entire cluster
  "capacity":50,
  // max capacity percentage this virtual cluster can use of entire cluster
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
  "resourcesTotal":{
   "memory":0,
   "vCores":0,
   "GPUs":0
  },
  "dedicated": true/false,
  // available node list for this virtual cluster
  "nodeList": [node1, node2, ...],
  // RUNNING: vc is enabled
  // STOPPED: vc is disabled, without either new job or running job.
  // DRAINING: intermedia state from RUNNING to STOPPED, in waiting on existing job.
  "status":"RUNNING"/"STOPPED"/"DRAINING"
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
    "message": "active vc $vcName successfully"
}

or

{
    "message": "stop vc $vcName successfully"
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

```
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

### `GET jobs/:frameworkName/config`

Get job config content.
This API always returns job config in v2 format (text/yaml). Old job config in v1 format will be converted automatically.

*Request*

```json
GET /api/v2/jobs/:frameworkName/config
```

*Response if succeeded*

```yaml
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

### `GET storage/server/:name`

Get storage server data in the system.

*Request*

```json
GET /api/v2/storage/server/:name
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

{
  "spn": "spn",
  "type": "nas_type",
  "data": {
    "spn": "spn",
    "type": "nas_type",
    "address": "address",
    "rootPath": "server/root/path"
    },
  "extension": {}
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

### `GET storage/server`

Given storage server names, find server data. If no parameter provided, return all server data.

*Request*

```json
GET storage/server
Authorization: Bearer <ACCESS_TOKEN>
```

*URL Parameters*

*Optional:*
```
  names=[string]
```
User can query multiple servers by using multiple names parameter, default name 'empty' will be ignored:
```
GET storage/server?names=name1&names=name2
```

*Response if succeeded*

```json
Status: 200

[
  {
    "spn": "spn",
    "type": "nas_type",
    "data": {
      "spn": "spn",
      "type": "nas_type",
      "address": "address",
      "rootPath": "server/root/path",
      "extension": {}
    },
    "extension": {}
  }
]
```

*Response if no match storage server.*

```json
Status: 200

[]
```

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `POST storage/server` (administrator only)

Create storage server in system.

*Request*

```json
POST /api/v2/storage/server
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "spn": "spn",
  "type": "nas_type",
  "data": {}
}
```

For data, please refer to [storage plugin](../../contrib/storage_plugin/README.MD#Server_data)

*Response if succeeded*

```json
Status: 201

{
  "message": "Storage Server is created successfully"
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

*Response if schema is not valid*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "Storage Server schema error *validation error messages*" 
}
```

*Response if try to modify system reserved key 'empty'*

```json
Status: 403

{
  "code": "ForbiddenKeyError",
  "message": "Key 'empty' is system reserved and should not be modified!"
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

### `PUT storage/server` (administrator only)

Update storage server in system. Storage server 'empty' is system reserved and cannot be updated.

*Request*

```json
PUT /api/v2/storage/server
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "spn": "spn",
  "type": "nas_type",
  "data": {}
}
```

For data, please refer to [storage plugin](../../contrib/storage_plugin/README.MD#Server_data)

*Response if succeeded*

```json
Status: 201

{
  "message": "Storage Server is updated successfully"
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

*Response if schema is not valid*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "Storage Server schema error *validation error messages*" 
}
```

*Response if try to modify system reserved key 'empty'*

```json
Status: 403

{
  "code": "ForbiddenKeyError",
  "message": "Key 'empty' is system reserved and should not be modified!"
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

### `DELETE storage/server/:name` (administrator only)

remove storage server in the system. Storage server 'empty' is system reserved and cannot be removed.

*Request*

```json
DELETE /api/v2/storage/server/:name
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Storage Server is deleted successfully"
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

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `GET storage/config/:name`

Get storage config data in the system.

*Request*

```json
GET /api/v2/storage/config/:name
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 200

{
  "name": "name",
  "default": true,
  "servers": [
    "server"
  ],
  "mountInfos": [
    {
      "mountPoint": "mountpoint",
      "path": "sub/path/of/server/path",
      "server": "server",
      "permission": "rw"
    }
  ]
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

### `GET storage/config`

Given storage config names, find config data. If no parameter provided, return all config data.

*Request*

```json
GET storage/config
Authorization: Bearer <ACCESS_TOKEN>
```

*URL Parameters*

*Optional:*
```
  names=[string]
```
User can query multiple configs by using multiple names parameter, default name 'empty' will be ignored:
```
GET storage/config?names=name1&names=name2
```

*Response if succeeded*

```json
Status: 200

[
  {
    "name": "name",
    "default": true,
    "servers": [
      "server"
    ],
    "mountInfos": [
      {
        "mountPoint": "mountpoint",
        "path": "sub/path/of/server/path",
        "server": "server",
        "permission": "rw"
      }
    ]
  }
]
```

*Response if no match storage config.*

```json
Status: 200

[]
```

*Response if a server error occurred*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "*Upstream error messages*"
}
```

### `POST storage/config` (administrator only)

Create storage config in system.

*Request*

```json
POST /api/v2/storage/config
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "name": "name",
  "default": true,
  "servers": [
    "server"
  ],
  "mountInfos": [
    {
      "mountPoint": "mountpoint",
      "path": "sub/path/of/server/path",
      "server": "server",
      "permission": "rw"
    }
  ]
}
```

For data, please refer to [storage plugin](../../contrib/storage_plugin/README.MD#Config_data)

*Response if succeeded*

```json
Status: 201

{
  "message": "Storage Config is created successfully"
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

*Response if schema is not valid*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "Storage Config schema error *validation error messages*" 
}
```

*Response if try to modify system reserved key 'empty'*

```json
Status: 403

{
  "code": "ForbiddenKeyError",
  "message": "Key 'empty' is system reserved and should not be modified!"
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

### `PUT storage/config` (administrator only)

Update storage config in system. Storage config 'empty' is system reserved and cannot be updated.

*Request*

```json
PUT /api/v2/storage/config
Authorization: Bearer <ACCESS_TOKEN>
```

*Parameters*

```json
{
  "name": "name",
  "default": true,
  "servers": [
    "server"
  ],
  "mountInfos": [
    {
      "mountPoint": "mountpoint",
      "path": "sub/path/of/server/path",
      "server": "server",
      "permission": "rw"
    }
  ]
}
```

For data, please refer to [storage plugin](../../contrib/storage_plugin/README.MD#Config_data)

*Response if succeeded*

```json
Status: 201

{
  "message": "Storage Config is updated successfully"
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

*Response if schema is not valid*

```json
Status: 500

{
  "code": "UnknownError",
  "message": "Storage Config schema error *validation error messages*" 
}
```

*Response if try to modify system reserved key 'empty'*

```json
Status: 403

{
  "code": "ForbiddenKeyError",
  "message": "Key 'empty' is system reserved and should not be modified!"
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

### `DELETE storage/config/:name` (administrator only)

remove storage config in the system. Storage config 'empty' is system reserved and cannot be removed.

*Request*

```json
DELETE /api/v2/storage/config/:name
Authorization: Bearer <ACCESS_TOKEN>
```

*Response if succeeded*

```json
Status: 201

{
  "message": "Storage Config is deleted successfully"
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

*Response if try to modify system reserved key 'empty'*

```json
Status: 403

{
  "code": "ForbiddenKeyError",
  "message": "Key 'empty' is system reserved and should not be modified!"
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

### `GET /api/v2/jobs/:frameworkName/jobAttempts/healthz`

Check if jobAttempts is healthy

*Request*

```json
GET /api/v2/jobs/:frameworkName/jobAttempts/healthz
```

*Response if succeeded*

```json
Status: 200
OK
```

*Response if job attempts API not work*

```json
Status: 501
Not healthy
```

### `GET /api/v2/jobs/:frameworkName/jobAttempts`

Get all attempts of a certain job.

*Request*

```json
GET /api/v2/jobs/:frameworkName/jobAttempts
```

*Response if succeeded*

```json
Status: 200

[
    {
        "jobName": string,
        "frameworkName": string,
        "userName": string,
        "state": "FAILED",
        "originState": "Completed",
        "maxAttemptCount": 4,
        "attemptIndex": 3,
        "jobStartedTime": 1572592684000,
        "attemptStartedTime": 1572592813000,
        "attemptCompletedTime": 1572592840000,
        "exitCode": 255,
        "exitPhrase": "PAIRuntimeUnknownFailed",
        "exitType": "Failed",
        "diagnosticsSummary": string,
        "totalGpuNumber": 1,
        "totalTaskNumber": 1,
        "totalTaskRoleNumber": 1,
        "taskRoles": {
            "taskrole": {
                "taskRoleStatus": {
                    "name": "taskrole"
                },
                "taskStatuses": [
                    {
                        "taskIndex": 0,
                        "taskState": "FAILED",
                        "containerId": uuid string,
                        "containerIp": ip string,
                        "containerGpus": null,
                        "containerLog": url string,
                        "containerExitCode": 255
                    }
                ]
            }
        },
        "isLatest": true
    },
]
```

*Response if attempts not found*

```json
Status: 404

Not Found
```

*Response if a server error occurred*

```json
Status: 501

Internal Error
```
### `GET /api/v2/jobs/:frameworkName/jobAttempts/:attemptIndex`

Get a specific attempt by attempt index.

*Request*

```json
GET /api/v2/jobs/:frameworkName/jobAttempts/:attemptIndex
```

*Response if succeeded*

```json
Status: 200

{
    "jobName": string,
    "frameworkName": string,
    "userName": string,
    "state": "FAILED",
    "originState": "Completed",
    "maxAttemptCount": 4,
    "attemptIndex": 3,
    "jobStartedTime": 1572592684000,
    "attemptStartedTime": 1572592813000,
    "attemptCompletedTime": 1572592840000,
    "exitCode": 255,
    "exitPhrase": "PAIRuntimeUnknownFailed",
    "exitType": "Failed",
    "diagnosticsSummary": string,
    "totalGpuNumber": 1,
    "totalTaskNumber": 1,
    "totalTaskRoleNumber": 1,
    "taskRoles": {
        "taskrole": {
            "taskRoleStatus": {
                "name": "taskrole"
            },
            "taskStatuses": [
                {
                    "taskIndex": 0,
                    "taskState": "FAILED",
                    "containerId": uuid string,
                    "containerIp": ip string,
                    "containerGpus": null,
                    "containerLog": url string,
                    "containerExitCode": 255
                }
            ]
        }
    },
    "isLatest": true
},
```

*Response if attempts not found*

```json
Status: 404

Not Found
```

*Response if a server error occurred*

```json
Status: 501

Internal Error
```
## About legacy jobs

Since [Framework ACL](../../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#Framework_ACL) is enabled since this version,
jobs will have a namespace with job-creater's username. However there were still some jobs created before
the version upgrade, which has no namespaces. They are called "legacy jobs", which can be retrieved, stopped,
but cannot be created. To figure out them, there is a "legacy: true" field of them in list apis.

In the next versions, all operations of legacy jobs may be disabled, so please re-create them as namespaced
job as soon as possible.
