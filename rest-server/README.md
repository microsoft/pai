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

2. Submit the job

    HTTP PUT the config file as json to:
    ```
    http://restserver/api/job/exampleJob
    ```
    For example, with [curl](https://curl.haxx.se/), you can execute below command line:
    ```sh
    curl -H "Content-Type: application/json" \
         -X PUT http://restserver/api/job/exampleJob \
         -d @exampleJob.json
    ```

3. Monitor the job

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

1. `PUT` job

    Submit or update a job in the system.

    *Request*
    ```
    PUT /api/job/:jobName
    ```

    *Parameters*

    [job config json](../job-tutorial/README.md#json-config-file-for-job-submission)

    *Response if succeeded*
    ```
    {
      "message": "update job $jobName successfully"
    }
    ```

    *Response if an error occured*
    ```
    Status: 500

    {
      "error": "JobUpdateError",
      "message": "job updated error"
    }
    ```

2. `GET` job

    Get job status in the system.

    *Request*
    ```
    GET /api/job/:jobName
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

    *Response if an error occured*
    ```
    Status: 500

    {
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```

3. `DELETE` job

    Remove job from the system.

    *Request*
    ```
    DELETE /api/job/:jobName
    ```

    *Response if succeeded*
    ```
    {
      "message": "deleted job $jobName successfully"
    }
    ```

    *Response if an error occured*
    ```
    Status: 500

    {
      "error": "JobNotFound",
      "message": "could not find job $jobName"
    }
    ```
