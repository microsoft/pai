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


# AII Examples

## Introduction

The system supports training or evaluation with CNTK, TensorFlow, and other custom docker images for deep learning. Users need to prepare a config file and submit it to run a job. This guide will introduce how to prepare a config file and how to run a deep learning job on the system.


## Prerequisites

This guide assumes users have already installed and configured the system properly.


## How to Run a Deep Learning Job

### Custom Docker Image

The deep learning jobs will run in docker containers in the system. Docker images need to be prepared in advance. We provide base docker images with HDFS, cuda and cudnn support so that users can build their own custom docker images based on it.

To build a base docker image, for example [Dockerfile.build.base](Dockerfiles/Dockerfile.build.base), simply run:
```sh
docker build -f Dockerfiles/Dockerfile.build.base -t aii.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 Dockerfiles/
```

Then custom docker images can be built based on it by adding `FROM aii.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04` in the Dockerfile.

As an example, we build a TensorFlow docker image using a custom [Dockerfile.run.tensorflow](Dockerfiles/Dockerfile.run.tensorflow):
```sh
docker build -f Dockerfiles/Dockerfile.run.tensorflow -t aii.run.tensorflow Dockerfiles/
```

Next we need to push the TensorFlow image to intra docker registry so that every node in the system can access that image:
```sh
docker tag aii.run.tensorflow localhost:5000/aii.run.tensorflow
docker push localhost:5000/aii.run.tensorflow
```

The built image can be used in the system now.


### Config File

Users need to prepare a json config file to describe the details of jobs, here is its format:

```
{
  "jobName":   String,
  "image":     String,
  "dataDir":   String,
  "outputDir": String,
  "codeDir":   String,
  "taskRoles": [
    {
      "name":       String,
      "taskNumber": Integer,
      "cpuNumber":  Integer,
      "memoryMB":   Integer,
      "gpuNumber":  Integer,
      "command":    String
    }
  ],
  "killAllOnCompletedTaskNumber": Integer,
  "retryCount": Integer
}
```

Here's all the parameters for job config file:

| Field Name                     | Schema                     | Description                              |
| :----------------------------- | :------------------------- | :--------------------------------------- |
| `jobName`                      | String, required           | Name for the job, need to be unique      |
| `image`                        | String, required           | URL pointing to the docker image for all tasks in the job |
| `dataDir`                      | String, optional, HDFS URI | Data directory existing on HDFS          |
| `outputDir`                    | String, optional, HDFS URI | Output directory existing on HDFS        |
| `codeDir`                      | String, required, HDFS URI | Code directory existing on HDFS          |
| `taskRoles`                    | List, required             | List of `taskRole`, one task role at least |
| `taskRole.name`                | String, required           | Name for the task role, need to be unique with other roles |
| `taskRole.taskNumber`          | Integer, required          | Number for the task role, no less than 1 |
| `taskRole.cpuNumber`           | Integer, required          | CPU number for one task in the task role, no less than 1 |
| `taskRole.memoryMB`            | Integer, required          | Memory for one task in the task role, no less than 100 |
| `taskRole.gpuNumber`           | Integer, required          | GPU number for one task in the task role, no less than 0 |
| `taskRole.command`             | String, required           | Executable command for tasks in the task role, can not be empty |
| `killAllOnCompletedTaskNumber` | Integer, optional          | Number of completed tasks to kill all tasks, no less than 0 |
| `retryCount`                   | Integer, optional          | Job retry count, no less than 0          |


### Runtime Environment

All user jobs will run separately in docker containers using the docker image specified in config file. For a certain job, each task will run in one docker container. The allocation of docker containers are influenced by resources on each node, so all containers in one job may on one node or different nodes. It's easy for one task in a job running without communication. But for distributed deep learning jobs, some tasks must communicate with each other so they have to know other tasks' information. We export some environment variables in docker container so that users can access to runtime environment in their code.

Here's all the `AII` prefixed environment variables in runtime docker containers:

| Environment Variable Name          | Description                              |
| :--------------------------------- | :--------------------------------------- |
| AII_JOB_NAME                       | `jobName` in config file                 |
| AII_DATA_DIR                       | `dataDir` in config file                 |
| AII_OUTPUT_DIR                     | `outputDir`in config file                |
| AII_CODE_DIR                       | `codeDir` in config file                 |
| AII_TASK_ROLE_NAME                 | `taskRole.name` of current task role     |
| AII_TASK_ROLE_NUM                  | `taskRole.number` of current task role   |
| AII_TASK_CPU_NUM                   | `taskRole.cpuNumber` of current task     |
| AII_TASK_MEM_MB                    | `taskRole.memoryMB` of current task      |
| AII_TASK_GPU_NUM                   | `taskRole.gpuNumber` of current task     |
| AII_TASK_ROLE_INDEX                | Index of current task in the task role, starting from 0 |
| AII_TASK_ROLE_NO                   | Index of current task role in config file, starting from 0 |
| AII_TASKS_NUM                      | Total tasks' number in config file       |
| AII_TASK_ROLES_NUM                 | Total task roles' number in config file  |
| AII_KILL_ALL_ON_COMPLETED_TASK_NUM | `killAllOnCompletedTaskNumber` in config file |
| AII_CURRENT_CONTAINER_IP           | Allocated ip for current docker container |
| AII_CURRENT_CONTAINER_PORT         | Allocated port for current docker container |
| AII_TASK_ROLE\_`$i`\_HOST_LIST     | Host list for `AII_TASK_ROLE_NO == $i`, comma separated `ip:port` string |


### Deep Learning Job Example

Users can use the json config file to run deep learning jobs in docker environment, we use a distributed tensorflow job as an example:

```
{
  "jobName": "tensorflow-distributed-example",
  // customized tensorflow docker image with hdfs, cuda and cudnn support
  "image": "localhost:5000/aii.run.tensorflow",
  // this example uses cifar10 dataset, which is available from
  // http://www.cs.toronto.edu/~kriz/cifar.html
  "dataDir": "hdfs://path/to/data",
  "outputDir": "hdfs://path/to/output",
  // this example uses code from tensorflow benchmark https://git.io/vF4wT
  "codeDir": "hdfs://path/to/code",
  "taskRoles": [
    {
      "name": "ps_server",
      // use 2 ps servers in this job
      "taskNumber": 2,
      "cpuNumber": 2,
      "memoryMB": 8192,
      "gpuNumber": 0,
      // run tf_cnn_benchmarks.py in code directory
      // please refer to https://www.tensorflow.org/performance/performance_models#executing_the_script for arguments' detail
      // if there's no `scipy` in the docker image, need to install it first
      "command": "pip install scipy && python tf_cnn_benchmarks.py --local_parameter_device=cpu --num_gpus=4 --batch_size=32 --model=resnet20 --variable_update=parameter_server --data_dir=$AII_DATA_DIR --data_name=cifar10 --train_dir=$AII_OUTPUT_DIR --ps_hosts=$AII_TASK_ROLE_0_HOST_LIST --worker_hosts=$AII_TASK_ROLE_1_HOST_LIST --job_name=ps --task_index=$AII_TASK_ROLE_INDEX"
    },
    {
      "name": "worker",
      // use 2 workers in this job
      "taskNumber": 2,
      "cpuNumber": 2,
      "memoryMB": 16384,
      "gpuNumber": 4,
      "command": "pip install scipy && python tf_cnn_benchmarks.py --local_parameter_device=cpu --num_gpus=4 --batch_size=32 --model=resnet20 --variable_update=parameter_server --data_dir=$AII_DATA_DIR --data_name=cifar10 --train_dir=$AII_OUTPUT_DIR --ps_hosts=$AII_TASK_ROLE_0_HOST_LIST --worker_hosts=$AII_TASK_ROLE_1_HOST_LIST --job_name=worker --task_index=$AII_TASK_ROLE_INDEX"
    }
  ],
  // kill all 4 tasks when 2 worker tasks completed
  "killAllOnCompletedTaskNumber": 2,
  "retryCount": 0
}
```


### Job Submission

1. Put the code and data on HDFS

    Use `aii-fs` to upload your code and data to HDFS on the system, for example
    ```sh
    aii-fs -cp -r /local/data/dir hdfs://path/to/data
    ```
    please refer to [aii-fs/README.md](../aii-fs/README.md#usage) for more details.

2. Prepare a job config file

    Prepare your deep learning job [config file](#config-file).

3. Submit the job through web portal

    Open web portal in a browser, click "Submit Job" and upload your config file.
