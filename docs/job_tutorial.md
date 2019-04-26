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

# Job reference

OpenPAI supports major deep learning frameworks, including CNTK and TensorFlow, etc.
It also supports other type of job through a customized docker image.
Users need to prepare a config file and submit it for a job submission.
This guide introduces the details of job submission.

- [Job reference](#job-reference)
  - [Quick start: submit a hello-world job](#quick-start-submit-a-hello-world-job)
  - [Job configuration](#job-configuration)
    - [Specification](#specification)
    - [Environment variables](#environment-variables)
    - [A complete example](#a-complete-example)
  - [Learn more job examples](#learn-more-job-examples)
  - [Job exit spec](#job-exit-spec)

## Quick start: submit a hello-world job

Refer to [submit a hello-world job](user/training.md#submit-a-hello-world-job) firstly. It's a good start for beginners.

## Job configuration

### Specification

A json file describe detailed configuration required for a job submission. The detailed format is shown as below:

```js
{
  "jobName":   String,
  "image":     String,
  "authFile":  String,
  "dataDir":   String,
  "outputDir": String,
  "codeDir":   String,
  "virtualCluster": String,
  "taskRoles": [
    {
      "name":       String,
      "taskNumber": Integer,
      "cpuNumber":  Integer,
      "memoryMB":   Integer,
      "shmMB":      Integer,
      "gpuNumber":  Integer,
      "portList": [
        {
          "label": String,
          "beginAt": Integer,
          "portNumber": Integer
        }
      ],
      "command":    String,
      "minFailedTaskCount": Integer,
      "minSucceededTaskCount": Integer
    }
  ],
  "gpuType": String,
  "retryCount": Integer,
  "jobEnvs": {
    "foo", Integer,
    "key", String,
    ...
  },
  "extras": {
    "foo", Integer,
    "key", String,
    ...
  }
}
```

Below please find the detailed explanation for each of the parameters in the config file:

| Field Name                       | Schema                     | Description                              |
| :------------------------------- | :------------------------- | :--------------------------------------- |
| `jobName`                        | String in `^[A-Za-z0-9\-._~]+$` format, required | Name for the job, need to be unique |
| `image`                          | String, required           | URL pointing to the Docker image for all tasks in the job |
| `authFile`                       | String, optional, HDFS URI | Docker registry authentication file existing on HDFS |
| `dataDir`                        | String, optional, HDFS URI | Data directory existing on HDFS          |
| `outputDir`                      | String, optional, HDFS URI | Output directory on HDFS, `$PAI_DEFAULT_FS_URI/Output/$jobName` will be used if not specified |
| `codeDir`                        | String, optional, HDFS URI | Code directory existing on HDFS, should not contain any data and should be less than 200MB. codeDir will created to your job container local environment and could be accessed inner job container. NOTE: this folder is readonly     |
| `virtualCluster`                 | String, optional           | The virtual cluster job runs on. If omitted, the job will run on `default` virtual cluster    |
| `taskRoles`                      | List, required             | List of `taskRole`, one task role at least |
| `taskRole.name`                  | String in `^[A-Za-z0-9._~]+$` format, required | Name for the task role, need to be unique with other roles |
| `taskRole.taskNumber`            | Integer, required          | Number of tasks for the task role, no less than 1 |
| `taskRole.cpuNumber`             | Integer, required          | CPU number for one task in the task role, no less than 1 |
| `taskRole.memoryMB`              | Integer, required          | Memory for one task in the task role, no less than 100 |
| `taskRole.shmMB`                 | Integer, optional          | Shared memory for one task in the task role, no more than memory size. The default value is 64MB |
| `taskRole.gpuNumber`             | Integer, required          | GPU number for one task in the task role, no less than 0 |
| `taskRole.portList`              | List, optional             | List of `portType` to use                |
| `taskRole.portType.label`        | String in `^[A-Za-z0-9._~]+$` format, required | Label name for the port type |
| `taskRole.portType.beginAt`      | Integer, required          | The port to begin with in the port type, 0 for random selection |
| `taskRole.portType.portNumber`   | Integer, required          | Number of ports for the specific type    |
| `taskRole.command`               | String, required           | Executable command for tasks in the task role, can not be empty |
| `taskRole.minFailedTaskCount`    | Integer, optional          | Number of failed tasks to fail the entire job, null or no less than 1, if set to null means the job will always succeed regardless any task failure. Please refer to [frameworklauncher usermanual](../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#ApplicationCompletionPolicy) for details |
| `taskRole.minSucceededTaskCount` | Integer, optional          | Number of succeeded tasks to succeed the entire job, null or no less than 1, if set to null means the job will only succeed until all tasks are completed and minFailedTaskCount is not triggered. Please refer to [frameworklauncher usermanual](../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#ApplicationCompletionPolicy) for details |
| `gpuType`                        | String, optional           | Specify the GPU type to be used in the tasks. If omitted, the job will run on any gpu type |
| `retryCount`                     | Integer, optional          | Job retry count, no less than 0          |
| `jobEnvs`                        | Object, optional           | Job env parameters, key-value pairs, available in job container and **no substitution allowed** |
| `jobEnvs.paiAzRDMA`              | Boolean, optional          | If you cluster is azure rdma capable, you could specify the parameter to make your container azure rdma capable. How to use azure rdma? Please follow this [job example](../examples/azure-rdma-inte-mpi-benchmark-with-horovod-image) |
| `jobEnvs.isDebug`                | Boolean, optional          | after this flag is set as ```true```, if user's command exits with a none-zero value, the failed container will be reserved for job debugging.  [More detail](user/troubleshooting_job.md#reserve-failed-docker-for-debugging)|
| `extras`                         | Object, optional           | Extra parameters, key-value pairs, save any information that job may use |

For more details on explanation, please refer to [frameworklauncher user manual](../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md).

If you're using a private Docker registry which needs authentication for image pull and is different from the registry used during deployment,
please create an authentication file in the following format, upload it to HDFS and specify the path in `authFile` parameter in config file.

```text
docker_registry_server
username
password
```

**NOTE**:

- If you're using a private registry at Docker Hub, you should use `docker.io` for `docker_registry_server` field in the authentication file.

- Only **codeDir** will created to your job container local environment and could be accessed inner job container. dataDir & outputDir are environmental variable (For example, the file link url of hdfs) which will be used by your job inner training code to read data from the storage link.

### Environment variables

Each task in a job runs in one Docker container.
For a multi-task job, one task might communicate with others.
So a task need to be aware of other tasks' runtime information such as IP, port, etc.
The system exposes such runtime information as environment variables to each task's Docker container.
For mutual communication, user can write code in the container to access those runtime environment variables.
Those environment variables can also be used in the job config file.

Below we show a complete list of environment variables accessible in a Docker container:

| Category          | Environment Variable Name                             | Description                                                                        |
| :---------------- | :---------------------------------------------------- | :--------------------------------------------------------------------------------- |
| Job level         | PAI_JOB_NAME                                          | `jobName` in config file                                                           |
|                   | PAI_USER_NAME                                         | User who submit the job                                                            |
|                   | PAI_DEFAULT_FS_URI                                    | Default file system uri in PAI                                                     |
| Task role level   | PAI_TASK_ROLE_COUNT                                   | Total task roles' number in config file                                            |
|                   | PAI_TASK_ROLE_LIST                                    | Comma separated all task role names in config file                                 |
|                   | PAI_TASK_ROLE_TASK_COUNT\_`$taskRole`                 | Task count of the task role                                                        |
|                   | PAI_HOST_IP\_`$taskRole`\_`$taskIndex`                | The host IP for `taskIndex` task in `taskRole`                                     |
|                   | PAI_PORT_LIST\_`$taskRole`\_`$taskIndex`\_`$portType` | The `$portType` port list for `taskIndex` task in `taskRole`                       |
|                   | PAI_RESOURCE\_`$taskRole`                             | Resource requirement for the task role in "gpuNumber,cpuNumber,memMB,shmMB" format |
|                   | PAI_MIN_FAILED_TASK_COUNT\_`$taskRole`                | `taskRole.minFailedTaskCount` of the task role                                     |
|                   | PAI_MIN_SUCCEEDED_TASK_COUNT\_`$taskRole`             | `taskRole.minSucceededTaskCount` of the task role                                  |
| Current task role | PAI_CURRENT_TASK_ROLE_NAME                            | `taskRole.name` of current task role                                               |
| Current task      | PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX              | Index of current task in current task role, starting from 0                        |

### A complete example

A distributed TensorFlow job is listed below as an example:

```js
{
  "jobName": "tensorflow-distributed-jobguid",
  // customized tensorflow docker image with hdfs, cuda and cudnn support
  "image": "your_docker_registry/pai.run.tensorflow",
  // this example uses cifar10 dataset, which is available from
  // http://www.cs.toronto.edu/~kriz/cifar.html
  "dataDir": "$PAI_DEFAULT_FS_URI/path/tensorflow-distributed-jobguid/data",
  "outputDir": "$PAI_DEFAULT_FS_URI/path/tensorflow-distributed-jobguid/output",
  // this example uses code from tensorflow benchmark https://git.io/vF4wT
  "codeDir": "$PAI_DEFAULT_FS_URI/path/tensorflow-distributed-jobguid/code",
  "virtualCluster": "your_virtual_cluster",
  "taskRoles": [
    {
      "name": "ps_server",
      // use 2 ps servers in this job
      "taskNumber": 2,
      "cpuNumber": 2,
      "memoryMB": 8192,
      "gpuNumber": 0,
      "portList": [
        {
          "label": "http",
          "beginAt": 0,
          "portNumber": 1
        },
        {
          "label": "ssh",
          "beginAt": 0,
          "portNumber": 1
        }
      ],
      // run tf_cnn_benchmarks.py in code directory
      // please refer to https://www.tensorflow.org/performance/performance_models#executing_the_script for arguments' detail
      // if there's no `scipy` in the docker image, need to install it first
      "command": "pip --quiet install scipy && python code/tf_cnn_benchmarks.py --local_parameter_device=cpu --batch_size=$batch_size --model=$job_model --variable_update=parameter_server --data_dir=$PAI_DATA_DIR --data_name=cifar10 --train_dir=$PAI_OUTPUT_DIR --ps_hosts=$PAI_TASK_ROLE_ps_server_HOST_LIST --worker_hosts=$PAI_TASK_ROLE_worker_HOST_LIST --job_name=ps --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX"
    },
    {
      "name": "worker",
      // use 2 workers in this job
      "taskNumber": 2,
      "cpuNumber": 2,
      "memoryMB": 16384,
      "gpuNumber": 4,
      "portList": [
        {
          "label": "http",
          "beginAt": 0,
          "portNumber": 1
        },
        {
          "label": "ssh",
          "beginAt": 0,
          "portNumber": 1
        }
      ],
      "command": "pip --quiet install scipy && python code/tf_cnn_benchmarks.py --local_parameter_device=cpu --batch_size=$batch_size --model=$job_model --variable_update=parameter_server --data_dir=$PAI_DATA_DIR --data_name=cifar10 --train_dir=$PAI_OUTPUT_DIR --ps_hosts=$PAI_TASK_ROLE_ps_server_HOST_LIST --worker_hosts=$PAI_TASK_ROLE_worker_HOST_LIST --job_name=worker --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX",
      // kill the entire job when 2 worker tasks completed
      "minSucceededTaskCount": 2
    }
  ],
  "retryCount": 0,
  "jobEnvs": {
    "batch_size": 32,
    "job_model": "resnet20"
  },
  "extras": {
  }
}
```

## Learn more job examples

For more examples, please refer to [job examples directory](../examples).

## Job exit spec

For the **specification of each job exitcode**, please refer to [PAI Job Exit Spec User Manual](../src/job-exit-spec/config/user-manual.md).
