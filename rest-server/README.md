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

REST Server exposes a set of interface that allows you to manage jobs.

## Quick Start

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

Configure the rest server ip and port in [service-deployment/clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml).

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
    {
      "token": "your access token",
      "user": "username"
    }
    ```

    *Response if an error occured*
    ```
    Status: 401

    {
      "error": "AuthenticationFailed",
      "message": "authentication failed"
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
    {
      "message": "update successfully"
    }
    ```

    *Response if an error occured*
    ```
    Status: 500

    {
      "error": "UpdateFailed",
      "message": "update failed"
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

    *Response if an error occured*
    ```
    Status: 500

    {
      "error": "RemoveFailed",
      "message": "remove failed"
    }
    ```
	
	*Response if not authorized*
    ```
    Status: 401

    {
      "error": "NotAuthorized",
      "message": "not authorized"
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

    *Response if a server error occured*
    ```
    Status: 500

    {
      "error": "UpdateVcFailed",
      "message": "update user virtual cluster failed"
    }
    ```

    *Response if not authorized*
    ```
    Status: 401

    {
      "error": "NotAuthorized",
      "message": "not authorized"
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
    {
      [ ... ]
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "error": "GetJobListError",
      "message": "get job list error"
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
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "error": "JobNotFound",
      "message": "could not find job $jobName"
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
    Status: 201

    {
      "message": "update job $jobName successfully"
    }
    ```

    *Response if there is a duplicated job submission*
    ```
    Status: 400
    
    {
      "error": "JobUpdateError",
      "message": "job update error"
    }
    ```
    
    *Response if a server error occured*
    ```
    Status: 500

    {
      "error": "JobUpdateError",
      "message": "job update error"
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
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "error": "InternalServerError",
      "message": "<depends on the error>"
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
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "error": "InternalServerError",
      "message": "<depends on the error>"
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

    *Response if a server error occured*
    ```
    Status: 500

    {
      "error": "JobExecuteError",
      "message": "job execute error"
    }

11. `GET virtual-clusters`

    Get the list of virtual clusters.

    *Request*
    ```
    GET /api/v1/virtual-clusters
    ```

    *Response if succeeded*
    ```
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
      "error": "GetVirtualClusterListError",
      "message": "get virtual cluster list error"
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
      "error": "VirtualClusterNotFound",
      "message": "could not find virtual cluster $vcName"
    }
    ```

    *Response if a server error occured*
    ```
    Status: 500

    {
      "error": "InternalServerError",
      "message": "internal server error"
    }
    ```