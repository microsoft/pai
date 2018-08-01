# Quick Start

1. Job config file

    Prepare a job config file as described in [examples/README.md](../docs/job_tutorial.md#json-config-file-for-job-submission), for example, `exampleJob.json`.

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

# RestAPI

## Root URI

Configure the rest server port in [services-configuration.yaml](../cluster-configuration/services-configuration.yaml).

## API Details

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

    [job config json](../docs/job_tutorial.md#json-config-file-for-job-submission)

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
