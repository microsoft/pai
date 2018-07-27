<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->


# REST Server

## Goal

REST Server exposes a set of interface that allows you to manage jobs.

## Architecture

REST Server is a Node.js API service for PAI that deliver client requests to different upstream
services, including [FrameworkLauncher](../frameworklauncher), Apache Hadoop YARN, WebHDFS and
etcd, with some request transformation.

## Dependencies

To start a REST Server service, the following services should be ready and correctly configured.

* [FrameworkLauncher](../frameworklauncher)
* Apache Hadoop YARN
* HDFS
* etcd

## Build

Run `npm install` to install dependencies.

## Configuration

If REST Server is deployed by [pai management tool][pai-management], configuration is located in
`restserver` block of [service configuration][service-configuration] file, including:

* `server-port`: Integer. The network port to access the web portal. The default value is 9186.
* `jwt-secret`: A random secret token for user authorization, keep it secret to users.
* `default-pai-admin-username`: The username of default user. REST Server will auto generate it
  after the first start of service.
* `default-pai-admin-password`: The password of default user.

---

If REST Server is deployed manually, the following fields should be configured as environment
variables:

* `LAUNCHER_WEBSERVICE_URI`: URI endpoint of [Framework Launcher](../frameworklauncher)
* `HDFS_URI`: URI endpoint of HDFS
* `WEBHDFS_URI`: URI endpoint of WebHDFS
* `YARN_URI`: URI endpoint of Apache Hadoop YARN
* `ETCD_URI`: URI endpoints of ectd, could be multiple and separated by comma(`,`)
* `JWT_SECRET`: A random secret token for user authorization, keep it secret to users.
* `DEFAULT_PAI_ADMIN_USERNAME`: The username of default user. REST Server will auto generate it
  after the first start of service.
* `DEFAULT_PAI_ADMIN_PASSWORD`: The password of default user.

And the following field could be configured optionally:

* `LOG_LEVEL`: The log level of the service, default value is `debug`, could be
    * `error`
    * `warn`
    * `info`
    * `debug`
    * `silly`
* `SERVER_PORT`: The network port to access the web portal. The default value is 9186.

## Deployment

The deployment of REST Server goes with the bootstrapping process of the whole PAI cluster, which is described in detail in [Tutorial: Booting up the cluster](../pai-management/doc/cluster-bootup.md).

---

If REST Server is need to be deployed as a standalone service, follow these steps:

1. Go into `rest-server` directory
2. Run `npm start`

## Upgrading

REST Server is a stateless service, so it could be upgraded without any extra operation.

## Service Metrics

TBD

## Service Monitoring

TBD

## High Availability

REST Server is a stateless service, so it could be extends for high availability without any extra operation.

## Runtime Requirements

To run REST Server on system, a [Node.js](https://nodejs.org) 6+ runtime is required, with [npm](https://www.npmjs.com/) installed.

## API Quick Start

1. Job config file

    Prepare a job config file as described in [examples/README.md](../job-tutorial/README.md#json-config-file-for-job-submission), for example, `exampleJob.json`.

2. Authentication

    HTTP POST your username and password to get an access token from:
    ```
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
    http://restserver/api/v1/jobs
    ```
    For example, you can execute below command line:
    ```sh
    curl -H "Content-Type: application/json" \
         -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
         -X POST http://restserver/api/v1/jobs \
         -d @exampleJob.json
    ```

4. Monitor the job

    Check the list of jobs at:
    ```
    http://restserver/api/v1/jobs
    ```
    Check your exampleJob status at:
    ```
    http://restserver/api/v1/jobs/exampleJob
    ```
    Get the job config JSON content:
    ```
    http://restserver/api/v1/jobs/exampleJob/config
    ```
    Get the job's SSH info:
    ```
    http://restserver/api/v1/jobs/exampleJob/ssh
    ```

## RestAPI

### Root URI

Configure the rest server port in [services-configuration.yaml](../cluster-configuration/services-configuration.yaml).

### API Details

1. `POST token`

    Authenticated and get an access token in the system.

    *Request*
    ```
    POST /api/v1/token
    ```

    *Parameters*
    ```
    {
      "username": "your username",
      "password": "your password",
      "expiration": "expiration time in seconds"
    }
    ```

    *Response if succeeded*
    ```
    Status: 200

    {
      "token": "your access token",
      "user": "username",
      "admin": true if user is admin
    }
    ```

    *Response if user does not exist*
    ```
    Status: 400

    {
      "code": "NoUserError",
      "message": "User $username is not found."
    }
    ```

    *Response if password is incorrect*
    ```
    Status: 400

    {
      "code": "IncorrectPassworkError",
      "message": "Password is incorrect."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

2. `PUT user`

    Update a user in the system.
    Administrator can add user or change other user's password; user can change his own password.

    *Request*
    ```
    PUT /api/v1/user
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *Parameters*
    ```
    {
      "username": "username in [_A-Za-z0-9]+ format",
      "password": "password at least 6 characters",
      "admin": true | false,
      "modify": true | false
    }
    ```

    *Response if succeeded*
    ```
    Status: 201

    {
      "message": "update successfully"
    }
    ```

    *Response if not authorized*
    ```
    Status: 401

    {
      "code": "UnauthorizedUserError",
      "message": "Guest is not allowed to do this operation."
    }
    ```

    *Response if current user has no permission*
    ```
    Status: 403

    {
      "code": "ForbiddenUserError",
      "message": "Non-admin is not allow to do this operation."
    }
    ```

    *Response if updated user does not exist*
    ```
    Status: 404

    {
      "code": "NoUserError",
      "message": "User $username is not found."
    }
    ```

    *Response if created user has a duplicate name*
    ```
    Status: 409

    {
      "code": "ConflictUserError",
      "message": "User name $username already exists."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

3. `DELETE user` (administrator only)

    Remove a user in the system.

    *Request*
    ```
    DELETE /api/v1/user
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *Parameters*
    ```
    {
      "username": "username to be removed"
    }
    ```

    *Response if succeeded*
    ```
    Status: 200

    {
      "message": "remove successfully"
    }
    ```

    *Response if not authorized*
    ```
    Status: 401

    {
      "code": "UnauthorizedUserError",
      "message": "Guest is not allowed to do this operation."
    }
    ```

    *Response if user has no permission*
    ```
    Status: 403

    {
      "code": "ForbiddenUserError",
      "message": "Non-admin is not allow to do this operation."
    }
    ```

    *Response if an admin will be removed*
    ```
    Status: 403

    {
      "code": "RemoveAdminError",
      "message": "Admin $username is not allowed to remove."
    }
    ```

    *Response if updated user does not exist*
    ```
    Status: 404

    {
      "code": "NoUserError",
      "message": "User $username is not found."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

4. `PUT user/:username/virtualClusters` (administrator only)

    Administrators can update user's virtual cluster. Administrators can access all virtual clusters, all users can access default virtual cluster.

    *Request*
    ```
    PUT /api/v1/user/:username/virtualClusters
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *Parameters*
    ```
    {
      "virtualClusters": "virtual cluster list separated by commas (e.g. vc1,vc2)"
    }
    ```

    *Response if succeeded*
    ```
    Status: 201

    {
      "message": "update user virtual clusters successfully"
    }
    ```

    *Response if the virtual cluster does not exist.*
    ```
    Status: 400

    {
      "code": "NoVirtualClusterError",
      "message": "Virtual cluster $vcname is not found."
    }
    ```

    *Response if not authorized*
    ```
    Status: 401

    {
      "code": "UnauthorizedUserError",
      "message": "Guest is not allowed to do this operation."
    }
    ```

    *Response if user has no permission*
    ```
    Status: 403

    {
      "code": "ForbiddenUserError",
      "message": "Non-admin is not allow to do this operation."
    }
    ```

    *Response if user does not exist.*
    ```
    Status: 404

    {
      "code": "NoUserError",
      "message": "User $username is not found."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

5. `GET jobs`

    Get the list of jobs.

    *Request*
    ```
    GET /api/v1/jobs
    ```

    *Parameters*
    ```
    {
      "username": "filter jobs with username"
    }
    ```

    *Response if succeeded*
    ```
    Status: 200

    {
      [ ... ]
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

6. `GET jobs/:jobName`

    Get job status in the system.

    *Request*
    ```
    GET /api/v1/jobs/:jobName
    ```

    *Response if succeeded*
    ```
    Status: 200

    {
      name: "jobName",
      state: "jobState",
      createdTime: "createdTimestamp",
      completedTime: "completedTimestamp",
      appId: "applicationId",
      appProgress: "applicationProgress",
      appTrackingUrl: "applicationTrackingUrl",
      appLaunchedTime: "applicationLaunchedTimestamp",
      appCompletedTime: "applicationCompletedTimestamp",
      appExitCode: applicationExitCode,
      appExitDiagnostics: "applicationExitDiagnostics"
    }
    ```

    *Response if the job does not exist*
    ```
    Status: 404

    {
      "code": "NoJobError",
      "message": "Job $jobname is not found."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

7. `POST jobs`

    Submit a job in the system.

    *Request*
    ```
    POST /api/v1/jobs
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *Parameters*

    [job config json](../job-tutorial/README.md#json-config-file-for-job-submission)

    *Response if succeeded*
    ```
    Status: 202

    {
      "message": "update job $jobName successfully"
    }
    ```

    *Response if the virtual cluster does not exist.*
    ```
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
    ```
    Status: 409

    {
      "code": "ConflictJobError",
      "message": "Job name $jobname already exists."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

8. `GET jobs/:jobName/config`

    Get job config JSON content.

    *Request*
    ```
    GET /api/v1/jobs/:jobName/config
    ```

    *Response if succeeded*
    ```
    Status: 200

    {
      "jobName": "test",
      "image": "pai.run.tensorflow",
      ...
    }
    ```

    *Response if the job does not exist*
    ```
    Status: 404

    {
      "code": "NoJobError",
      "message": "Job $jobname is not found."
    }
    ```

    *Response if the job config does not exist*
    ```
    Status: 404

    {
      "code": "NoJobConfigError",
      "message": "Config of job $jobname is not found."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

9. `GET jobs/:jobName/ssh`

    Get job SSH info.

    *Request*
    ```
    GET /api/v1/jobs/:jobName/ssh
    ```

    *Response if succeeded*
    ```
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
    ```
    Status: 404

    {
      "code": "NoJobError",
      "message": "Job $jobname is not found."
    }
    ```

    *Response if the job SSH info does not exist*
    ```
    Status: 404

    {
      "code": "NoJobSshInfoError",
      "message": "SSH info of job $jobname is not found."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

10. `PUT jobs/:jobName/executionType`

    Start or stop a job.

    *Request*
    ```
    PUT /api/v1/jobs/:jobName/executionType
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *Parameters*
    ```
    {
      "value": "START" | "STOP"
    }
    ```

    *Response if succeeded*
    ```
    Status: 200

    {
      "message": "execute job $jobName successfully"
    }
    ```

    *Response if the job does not exist*
    ```
    Status: 404

    {
      "code": "NoJobError",
      "message": "Job $jobname is not found."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

11. `GET virtual-clusters`

    Get the list of virtual clusters.

    *Request*
    ```
    GET /api/v1/virtual-clusters
    ```

    *Response if succeeded*
    ```
    Status: 200

    {
      "vc1":
      {
      }
      ...
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

12. `GET virtual-clusters/:vcName`

    Get virtual cluster status in the system.

    *Request*
    ```
    GET /api/v1/virtual-clusters/:vcName
    ```

    *Response if succeeded*
    ```
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
    }
    ```

    *Response if the virtual cluster does not exist*
    ```
    Status: 404

    {
      "code": "NoVirtualClusterError",
      "message": "Virtual cluster $vcname is not found."
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "code": "UnknownError",
      "message": "*Upstream error messages*"
    }
    ```

## FAQ

> Q: What is the default username and password?
>
> A: Default username and password is configured in
>  - `DEFAULT_PAI_ADMIN_USERNAME` and `DEFAULT_PAI_ADMIN_PASSWORD` environment variables
>    if service is deployed manually.
>  - `restserver.default-pai-admin-username` and `restserver.default-pai-admin-password` field
>    in [service configuration file][service-configuration]
>    if service is deployed by [pai management tool][pai-management].

> Q: Why can't I login with default username and password?
>
> A: If there is already a `/users` directory in etcd, REST Server will not auto generate
>    the default user, even it is empty and without any users. To regenerate default user,
>    try [delete the whole `/users` directory](https://coreos.com/etcd/docs/latest/v2/api.html#deleting-a-directory)
>    and restart REST Server, a new default user will be generated.


[pai-management]: ../pai-management
[service-configuration]: ../cluster-configuration/services-configuration.yaml
