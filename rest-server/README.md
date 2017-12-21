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
    http://restserver/api/auth
    ```
    For example, with [curl](https://curl.haxx.se/), you can execute below command line:
    ```sh
    curl -H "Content-Type: application/json" \
         -X POST http://restserver/api/auth \
         -d "username=YOUR_USERNAME" -d "password=YOUR_PASSWORD"
    ```

3. Submit the job

    HTTP PUT the config file as json with access token in header to:
    ```
    http://restserver/api/job/exampleJob
    ```
    For example, you can execute below command line:
    ```sh
    curl -H "Content-Type: application/json" \
         -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
         -X PUT http://restserver/api/job/exampleJob \
         -d @exampleJob.json
    ```

4. Monitor the job

    Check the list of jobs at:
    ```
    http://restserver/api/job
    ```
    Check your exampleJob status at:
    ```
    http://restserver/api/job/exampleJob
    ```


## RestAPI

### Root URI

Configure the rest server ip and port in [service-deployment/clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml).

### API Details

1. `PUT` auth

    Update a user in the system, allowed by administrator only.

    *Request*
    ```
    PUT /api/auth
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

2. `POST` auth

    Authenticated and get an access token in the system.

    *Request*
    ```
    POST /api/auth
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

3. `DELETE` auth

    Remove a user in the system, allowed by administrator only.

    *Request*
    ```
    DELETE /api/auth
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

4. `GET jobs`
    Get the list of jobs.

    *Request*
    ```
    GET /api/:version/jobs
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

5. `GET jobs/:jobName`

    Get job status in the system.

    *Request*
    ```
    GET /api/jobs/:jobName
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

6. `PUT` jobs

    Submit or update a job in the system.

    *Request*
    ```
    PUT /api/:version/jobs/:jobName
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

7. `DELETE jobs/:jobName`

    Remove job from the system.

    *Request*
    ```
    DELETE /api/:version/jobs/:jobName
    Authorization: Bearer <ACCESS_TOKEN>
    ```

    *Response if succeeded*
    ```
    {
      "message": "deleted job $jobName successfully"
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
