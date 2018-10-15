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


# How to Run a Deep Learning Job

OpenPAI supports major deep learning frameworks, including CNTK and TensorFlow, etc. 
It also supports other type of job through a customized docker image. 
Users need to prepare a config file and submit it for a job submission. 
This guide introduces the details of job submission.

## Table of Contents:

- [Quick start: how to write and submit a CIFAR-10 job](#quickstart)
- [Write a customized job](#writejob)
  - [Prerequisites](#prerequisites)
  - [Use docker to package the job environment dependencies](#docker)
  - [Write a job json configuration file](#jobjson)
  - [Job runtime environmental variable](#envvar)
  - [A deep learning job example](#example)
  - [Job submission steps](#submission)
- [How to debug Job](#debug)
- [Learn more job examples](#moreexample)

## Quick start: how to write and submit a CIFAR-10 job <a name="quickstart"></a>

Please refer to this [document](../examples/README.md#quickstart) for how to write and submit a CIFAR-10 job.

## Write a customized job  <a name="writejob"></a>

### Prerequisites <a name="prerequisites"></a>

This guide assumes the system has already been deployed properly and a docker registry is available to store docker images. 

### Use docker to package the job environment dependencies <a name="docker"></a>

OpenPAI packaged the docker env required by the job for user to use. User could refer to [job_docker_env.md](./job_docker_env.md) to customize example's docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image in following example `"image": "your_docker_registry/pai.run.tensorflow"` with your own. OpenPAI has many pre-built images for different frameworks. In [Learn more job examples](#moreexample) section, each example folder will contain a pre-build docker env.

### Write a job json configuration file <a name="jobjson"></a>

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
  "retryCount": Integer
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
| `codeDir`                        | String, optional, HDFS URI | Code directory existing on HDFS, should not contain any data and should be less than 200MB    |
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
| `taskRole.minFailedTaskCount`    | Integer, optional          | Number of failed tasks to kill the entire job, null or no less than 1, refer to [frameworklauncher usermanual](../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#ApplicationCompletionPolicy) for details |
| `taskRole.minSucceededTaskCount` | Integer, optional          | Number of succeeded tasks to kill the entire job, null or no less than 1, refer to [frameworklauncher usermanual](../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#ApplicationCompletionPolicy) for details |
| `gpuType`                        | String, optional           | Specify the GPU type to be used in the tasks. If omitted, the job will run on any gpu type |
| `retryCount`                     | Integer, optional          | Job retry count, no less than 0          |

For more details on explanation, please refer to [frameworklauncher usermanual](../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md).

If you're using a private Docker registry which needs authentication for image pull and is different from the registry used during deployment,
please create an authentication file in the following format, upload it to HDFS and specify the path in `authFile` parameter in config file.

```
docker_registry_server
username
password
```

*NOTE*: If you're using a private registry at Docker Hub, you should use `docker.io` for `docker_registry_server` field in the authentication file.

### Job runtime environmental variable <a name="envvar"></a>

Each task in a job runs in one Docker container.
For a multi-task job, one task might communicate with others.
So a task need to be aware of other tasks' runtime information such as IP, port, etc.
The system exposes such runtime information as environment variables to each task's Docker container.
For mutual communication, user can write code in the container to access those runtime environment variables.
Those environment variables can also be used in the job config file.

Below we show a complete list of environment variables accessible in a Docker container:

| Environment Variable Name          | Description                              |
| :--------------------------------- | :--------------------------------------- |
| PAI_WORK_DIR                       | Working directory in Docker container    |
| PAI_DEFAULT_FS_URI                 | Default file system uri in PAI           |
| PAI_JOB_NAME                       | `jobName` in config file                 |
| PAI_JOB_VC_NAME                    | The virtual cluster in which the job is running     |
| PAI_USER_NAME                      | User who submit the job                  |
| PAI_DATA_DIR                       | `dataDir` in config file                 |
| PAI_OUTPUT_DIR                     | `outputDir`in config file or the generated path if `outputDir` is not specified |
| PAI_CODE_DIR                       | `codeDir` in config file                 |
| PAI_CURRENT_TASK_ROLE_NAME         | `taskRole.name` of current task role     |
| PAI_CURRENT_TASK_ROLE_TASK_COUNT   | `taskRole.taskNumber` of current task role |
| PAI_CURRENT_TASK_ROLE_CPU_COUNT    | `taskRole.cpuNumber` of current task role  |
| PAI_CURRENT_TASK_ROLE_MEM_MB       | `taskRole.memoryMB` of current task role   |
| PAI_CURRENT_TASK_ROLE_SHM_MB       | `taskRole.shmMB` of current task role      |
| PAI_CURRENT_TASK_ROLE_GPU_COUNT    | `taskRole.gpuNumber` of current task role  |
| PAI_CURRENT_TASK_ROLE_MIN_FAILED_TASK_COUNT    | `taskRole.minFailedTaskCount` of current task role    |
| PAI_CURRENT_TASK_ROLE_MIN_SUCCEEDED_TASK_COUNT | `taskRole.minSucceededTaskCount` of current task role |
| PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX | Index of current task in current task role, starting from 0 |
| PAI_JOB_TASK_COUNT                 | Total tasks' number in config file       |
| PAI_JOB_TASK_ROLE_COUNT            | Total task roles' number in config file  |
| PAI_JOB_TASK_ROLE_LIST             | Comma separated all task role names in config file |
| PAI_CONTAINER_HOST_IP              | Allocated ip for current docker container |
| PAI_CONTAINER_HOST_PORT_LIST       | Allocated port list for current docker container, in `portLabel0:port0,port1,port2;portLabel1:port3,port4` format |
| PAI_CONTAINER_HOST\_`$type`\_PORT_LIST | Allocated port list for `portList.label == $type`, comma separated `port` string |
| PAI_TASK_ROLE\_`$name`\_HOST_LIST  | Host list for `PAI_TASK_ROLE_NAME == $name`, comma separated `ip:port` string, sorted by current task index in task role. Each task role has a host list environment variable with the corresponding task role name |


### A deep learning job example <a name="example"></a>

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
      "command": "pip --quiet install scipy && python code/tf_cnn_benchmarks.py --local_parameter_device=cpu --batch_size=32 --model=resnet20 --variable_update=parameter_server --data_dir=$PAI_DATA_DIR --data_name=cifar10 --train_dir=$PAI_OUTPUT_DIR --ps_hosts=$PAI_TASK_ROLE_ps_server_HOST_LIST --worker_hosts=$PAI_TASK_ROLE_worker_HOST_LIST --job_name=ps --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX"
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
      "command": "pip --quiet install scipy && python code/tf_cnn_benchmarks.py --local_parameter_device=cpu --batch_size=32 --model=resnet20 --variable_update=parameter_server --data_dir=$PAI_DATA_DIR --data_name=cifar10 --train_dir=$PAI_OUTPUT_DIR --ps_hosts=$PAI_TASK_ROLE_ps_server_HOST_LIST --worker_hosts=$PAI_TASK_ROLE_worker_HOST_LIST --job_name=worker --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX",
      // kill the entire job when 2 worker tasks completed
      "minSucceededTaskCount": 2
    }
  ],
  "retryCount": 0
}
```

### Job submission steps <a name="submission"></a>

1. Put the code and data on [HDFS](../docs/hadoop/hdfs.md)

- Option-1: Use [WebHDFS](../docs/hadoop/hdfs.md#WebHDFS) to upload your code and data to HDFS on the system. 
- Option-2: Use HDFS tools to upload your code and data to HDFS on the system. We upload a [Docker image](https://hub.docker.com/r/paiexample/pai.example.hdfs/) to DockerHub with built-in HDFS support.
    Please refer to the [HDFS commands guide](https://hadoop.apache.org/docs/r2.7.2/hadoop-project-dist/hadoop-hdfs/HDFSCommands.html) for details. 

2. Prepare a job config file

    Prepare the [config file](#json-config-file-for-job-submission) for your job.

3. Submit the job through web portal

    Open web portal in a browser, click "Submit Job" and upload your config file.

## How to debug the job <a name="debug"></a>

You can ssh connect to a specified container either from outside or inside container.

### SSH connect from outside

1. Get job ssh connect info by invoking `/api/v1/jobs/:jobName/ssh` api or clicking the job detail page on webportal.

2. Open a Bash shell terminal.

3. Download the corresponding private key from HDFS.
   For example, with [wget](http://www.gnu.org/software/wget/), you can execute below command line:
   ```sh
   wget http://host:port/webhdfs/v1/Container/userName/jobName/ssh/application_id/.ssh/application_id?op=OPEN -O application_id
   ```
4. Use `chmod` command to set correct permission for the key file.
   ```sh
   chmod 400 application_id
   ```
5. Use `ssh` command to connect into container. for example
   ```sh
   ssh -i application_id -p ssh_port root@container_ip
   ```
### SSH connect inside containers

You can use `ssh $PAI_CURRENT_TASK_ROLE_NAME-$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX` command to connect into another containers which belong to the same job. For example, if there are two taskRoles: master and worker, you can connect to worker-0 container directly with below command line:
```sh
ssh worker-0
```

## Learn more job examples <a name="moreexample"></a>

For more examples, please refer to [job examples directory](../examples).
