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

## Introduction

The system supports major deep learning frameworks, including CNTK and TensorFlow, etc. 
It also supports other type of workload through a customized docker image. 
Users need to prepare a config file and submit it for a job submission. 
This guide introduces the details of job submission.


## Prerequisites

This guide assumes the system has already been deployed properly and a docker registry is available to store docker images. 


## Docker image

The system launches a deep learning job in one or more Docker containers. A Docker images is required in advance. 
The system provides a base Docker images with HDFS, CUDA and cuDNN support, based on which users can build their own custom Docker images.

To build a base Docker image, for example [Dockerfile.build.base](Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base), run:
```sh
docker build -f Dockerfiles/Dockerfile.build.base -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 Dockerfiles/
```

Then a custom docker image can be built based on it by adding `FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04` in the Dockerfile.

As an example, we customize a TensorFlow Docker image using [Dockerfile.run.tensorflow](Dockerfiles/cuda8.0-cudnn6/Dockerfile.run.tensorflow):
```sh
docker build -f Dockerfiles/Dockerfile.run.tensorflow -t pai.run.tensorflow Dockerfiles/
```

Next, the built image is pushed to a docker registry for every node in the system to access that image:
```sh
docker tag pai.run.tensorflow your_docker_registry/pai.run.tensorflow
docker push your_docker_registry/pai.run.tensorflow
```

And the image is ready to serve. Note that above script assume the docker registry is deployed locally. 
Actual script can vary depending on the configuration of Docker registry. 


## Json config file for job submission

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
      "gpuNumber":  Integer,
      "portList": [
        {
          "label": String,
          "beginAt": Integer,
          "portNumber": Integer
        }
      ],
      "command":    String
    }
  ],
  "gpuType": String,
  "killAllOnCompletedTaskNumber": Integer,
  "retryCount": Integer
}
```

Below please find the detailed explanation for each of the parameters in the config file:

| Field Name                     | Schema                     | Description                              |
| :----------------------------- | :------------------------- | :--------------------------------------- |
| `jobName`                      | String in `^[A-Za-z0-9\-._~]+$` format, required | Name for the job, need to be unique |
| `image`                        | String, required           | URL pointing to the Docker image for all tasks in the job |
| `authFile`                     | String, optional, HDFS URI | Docker registry authentication file existing on HDFS |
| `dataDir`                      | String, optional, HDFS URI | Data directory existing on HDFS          |
| `outputDir`                    | String, optional, HDFS URI | Output directory on HDFS, `$PAI_DEFAULT_FS_URI/Output/$jobName` will be used if not specified |
| `codeDir`                      | String, optional, HDFS URI | Code directory existing on HDFS          |
| `virtualCluster`               | String, optional           | The virtual cluster job runs on. If omitted, the job will run on `default` virtual cluster    |
| `taskRoles`                    | List, required             | List of `taskRole`, one task role at least |
| `taskRole.name`                | String in `^[A-Za-z0-9._~]+$` format, required | Name for the task role, need to be unique with other roles |
| `taskRole.taskNumber`          | Integer, required          | Number of tasks for the task role, no less than 1 |
| `taskRole.cpuNumber`           | Integer, required          | CPU number for one task in the task role, no less than 1 |
| `taskRole.memoryMB`            | Integer, required          | Memory for one task in the task role, no less than 100 |
| `taskRole.gpuNumber`           | Integer, required          | GPU number for one task in the task role, no less than 0 |
| `taskRole.portList`            | List, optional             | List of `portType` to use                |
| `taskRole.portType.label`      | String in `^[A-Za-z0-9._~]+$` format, required | Label name for the port type |
| `taskRole.portType.beginAt`    | Integer, required          | The port to begin with in the port type, 0 for random selection |
| `taskRole.portType.portNumber` | Integer, required          | Number of ports for the specific type    |
| `taskRole.command`             | String, required           | Executable command for tasks in the task role, can not be empty |
| `gpuType`                      | String, optional           | Specify the GPU type to be used in the tasks. If omitted, the job will run on any gpu type |
| `killAllOnCompletedTaskNumber` | Integer, optional          | Number of completed tasks to kill the entire job, no less than 0 |
| `retryCount`                   | Integer, optional          | Job retry count, no less than 0          |

If you're using a private Docker registry which needs authentication for image pull and is different from the registry used during deployment,
please create an authentication file in the following format, upload it to HDFS and specify the path in `authFile` parameter in config file.

```
docker_registry_server
username
password
```

*NOTE*: If you're using a private registry at Docker Hub, you should use `docker.io` for `docker_registry_server` field in the authentication file.

## Runtime environment

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
| PAI_CURRENT_TASK_ROLE_GPU_COUNT    | `taskRole.gpuNumber` of current task role  |
| PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX | Index of current task in current task role, starting from 0 |
| PAI_JOB_TASK_COUNT                 | Total tasks' number in config file       |
| PAI_JOB_TASK_ROLE_COUNT            | Total task roles' number in config file  |
| PAI_JOB_TASK_ROLE_LIST             | Comma separated all task role names in config file |
| PAI_KILL_ALL_ON_COMPLETED_TASK_NUM | `killAllOnCompletedTaskNumber` in config file |
| PAI_CONTAINER_HOST_IP              | Allocated ip for current docker container |
| PAI_CONTAINER_HOST_PORT_LIST       | Allocated port list for current docker container, in `portLabel0:port0,port1,port2;portLabel1:port3,port4` format |
| PAI_CONTAINER_HOST_\_`$type`\_PORT_LIST | Allocated port list for `portList.label == $type`, comma separated `port` string |
| PAI_TASK_ROLE\_`$name`\_HOST_LIST  | Host list for `PAI_TASK_ROLE_NAME == $name`, comma separated `ip:port` string, sorted by current task index in task role. Each task role has a host list environment variable with the corresponding task role name |


## An example deep learning job

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
      "command": "pip --quiet install scipy && python code/tf_cnn_benchmarks.py --local_parameter_device=cpu --batch_size=32 --model=resnet20 --variable_update=parameter_server --data_dir=$PAI_DATA_DIR --data_name=cifar10 --train_dir=$PAI_OUTPUT_DIR --ps_hosts=$PAI_TASK_ROLE_ps_server_HOST_LIST --worker_hosts=$PAI_TASK_ROLE_worker_HOST_LIST --job_name=worker --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX"
    }
  ],
  // kill all 4 tasks when 2 worker tasks completed
  "killAllOnCompletedTaskNumber": 2,
  "retryCount": 0
}
```


## More examples

- [tensorflow-example.json](tensorflow/tensorflow-example.json): Single GPU trainning on ImageNet.
- [tensorflow-distributed-example.json](tensorflow/tensorflow-distributed-example.json): Distributed trainning on CIFAR-10.
- [tensorboard-example.json](tensorflow/tensorboard-example.json): TensorBoard visualization for trainning logs.
- [cntk-example.json](cntk/cntk-example.json): CNTK grapheme-to-phoneme trainning using sequence-to-sequence model on CMUDict corpus.


## Job submission

1. Put the code and data on HDFS

    Use `pai-fs` to upload your code and data to HDFS on the system, for example
    ```sh
    pai-fs -cp -r /local/data/dir hdfs://host:port/path/tensorflow-distributed-jobguid/data
    ```
    please refer to [pai-fs/README.md](../pai-fs/README.md#usage) for more details.

2. Prepare a job config file

    Prepare the [config file](#json-config-file-for-job-submission) for your job.

3. Submit the job through web portal

    Open web portal in a browser, click "Submit Job" and upload your config file.

## SSH Connection
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