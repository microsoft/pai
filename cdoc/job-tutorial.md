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
# PAI深度学习任务指南
## 概述
- PAI支持当前主流的深度学习框架，如CNTK、Tensorflow等。
- 也可通过自定义Docker镜像支持其他种类的任务。
- 用户提交job需准备一个配置文件。
- 本文详细介绍了提交job的基本步骤。

## 先决条件
执行本文的步骤前，请确保系统已经正确部署，以及确保一个可用的Docker registry用以存储用户自定义的Docker images。

## Docker镜像
系统将在一个或多个docker容器中执行深度学习job，用户首先要根据job定制自己所需的docker镜像。
系统提供了一个带HDFS，CUDA和cuDNN支持的基础镜像，用户可在此基础之上进行定制。

首先生成基础镜像，Dockerfile示例见[Dockerfile.build.base](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base), 执行以下命令生成镜像:
```sh
docker build -f Dockerfiles/Dockerfile.build.base -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 Dockerfiles/
```

接着，用户在构建自定义镜像时需在Dockerfile的首句添加：
    
    FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

例如，要生成一个带Tensorflow的镜像，Dockerfile示例见[Dockerfile.run.tensorflow](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.run.tensorflow)，执行以下命令生成：
```sh
docker build -f Dockerfiles/Dockerfile.run.tensorflow -t pai.run.tensorflow Dockerfiles/
```

生成镜像之后，将其提交至Docker registry，使得系统中的任何一个结点都能获取该镜像。执行：
```sh
docker tag pai.run.tensorflow your_docker_registry/pai.run.tensorflow
docker push your_docker_registry/pai.run.tensorflow
```
至此完成Docker镜像的准备。

注意，上文中的脚本是假设Docker registry搭建在本地，实际的脚本代码根据Docker registry的配置可能有所不同。

## job配置文件
用户需准备一个json文件描述job的配置细节，示例如下：
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

下表为配置文件中每个参数的详细说明：
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

如果你使用的是私有Docker registry，pull镜像时需要认证，则你需要新建一个认证文件上传至HDFS，并且在配置文件的`authFile` 字段指明该文件位置。该认证文件的格式如下：
```
docker_registry_server
username
password
```
**注意：** 如果你使用的是Docker Hub的私人registry，认证文件的`docker_registry_server`字段应为`docker.io` 。

## 运行环境
Job中的每一个task都运行在一个容器中，对于multi-task job，tasks之间需要相互通讯，故每个task要能获取其他tasks的运行环境信息（Runtime Information），如IP、port等等。
系统将这些运行环境信息作为环境变量公开给每task的Docker容器。
为了相互沟通，用户可以在容器中编写代码来访问这些运行环境变量。
这些环境变量也可以在job配置文件中使用。

Docker容器中可访问的环境变量的完整列表如下：
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

## 深度学习job示例
一个分布式Tensorflow job的配置文件示例如下所示：
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

## 更多例子
- [tensorflow-example.json](tensorflow/tensorflow-example.json): ImageNet数据集Tensorflow单GPU训练示例.
- [tensorflow-distributed-example.json](tensorflow/tensorflow-distributed-example.json): CIFAR-10数据集Tensorflow分布式训练示例.
- [tensorboard-example.json](tensorflow/tensorboard-example.json): 使用TensorBoard可视化训练logs示例.
- [cntk-example.json](cntk/cntk-example.json): CMUDict语料库使用CNTK序列模型字音转换训练示例。

## 提交job
1. 上传数据和代码至HDFS
    使用`pai-fs`将你的数据和代码上传至HDFS，例如：
    ```sh
        pai-fs -cp -r /local/data/dir hdfs://host:port/path/tensorflow-distributed-jobguid/data
    ```
    `pai-fs`的更多操作详见[pai-fs/README.md](../pai-fs/README.md#usage)
2. 准备job配置文件
    为你的job准备[config file](#json-config-file-for-job-submission)

3. 通过门户网站提交job
    浏览器中打开门户网站，点击"Submit Job"上传配置文件，即可提交你的job。

## SSH连接
你可以使用SSH连接从容器外部或内部连接到其他指定的容器。
## 从容器外部SSH连接
1. 通过调用`/api/v1/jobs/:jobName/ssh` api或是点击门户网站上的job详情页来获取SSH连接。

2. 打开Bash终端

3. 从HDFS中下载相应私钥，例如使用[wget](http://www.gnu.org/software/wget/)：
    ```sh
    wget http://host:port/webhdfs/v1/Container/userName/jobName/ssh/application_id/.ssh/application_id?op=OPEN -O application_id
    ```

4. 使用`chmod`赋予该私钥文件相应权限，如：
    ```sh
   chmod 400 application_id
   ```


5. 使用`ssh`命令连接容器，例如：
    ```sh
   ssh -i application_id -p ssh_port root@container_ip
   ```

### 从容器内部SSH连接
可以使用`ssh $PAI_CURRENT_TASK_ROLE_NAME-$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX`命令连接同属于一个job的其他容器。例如，有两个taskRoles，master 和 worker，可以使用如下命令直接连接到worker-0容器：
```sh
ssh worker-0
```