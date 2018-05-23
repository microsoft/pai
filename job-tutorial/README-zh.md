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
# PAI 深度学习任务指南
## 概述
- PAI 支持当前主流的深度学习框架，如 CNTK、Tensorflow 等。
- 也可通过自定义 Docker 镜像支持其他种类的任务。
- 用户提交 job 需准备一个配置文件。
- 本文详细介绍了提交 job 的基本步骤。

## 先决条件
执行本文的步骤前，请确保系统已经正确部署，以及确保一个可用的 Docker registry 用以存储用户自定义的 Docker images。

## Docker 镜像
系统将在一个或多个 docker 容器中执行深度学习 job，用户首先要根据 job 定制自己所需的 docker 镜像。
系统提供了一个带 HDFS，CUDA 和 cuDNN 支持的基础镜像，用户可在此基础之上进行定制。

首先生成基础镜像，Dockerfile 示例见 [Dockerfile.build.base](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base), 执行以下命令生成镜像:
```sh
docker build -f Dockerfiles/Dockerfile.build.base -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 Dockerfiles/
```

接着，用户在构建自定义镜像时需在 Dockerfile 的首句添加：
    
    FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

例如，要生成一个带 Tensorflow 的镜像，Dockerfile 示例见 [Dockerfile.run.tensorflow](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.run.tensorflow)，执行以下命令生成：
```sh
docker build -f Dockerfiles/Dockerfile.run.tensorflow -t pai.run.tensorflow Dockerfiles/
```

生成镜像之后，将其提交至Docker registry，使系统中的任何一个结点都能获取该镜像。执行：
```sh
docker tag pai.run.tensorflow your_docker_registry/pai.run.tensorflow
docker push your_docker_registry/pai.run.tensorflow
```
至此完成Docker镜像的准备。

注意，上文中的脚本是假设 Docker registry 搭建在本地，实际的脚本代码根据 Docker registry 的配置可能有所不同。

## job配置文件
用户需准备一个 json 文件描述 job 的配置细节，示例如下：
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

| 字段名                     | 类型                    | 意义                             |
| :----------------------------- | :------------------------- | :--------------------------------------- |
| `jobName`                      | String in `^[A-Za-z0-9\-._~]+$` format, required | job 名称，必须是唯一的 |
| `image`                        | String, required           | job 中所有 tasks 使用的 Docker 镜像 URL 地址 |
| `authFile`                     | String, optional, HDFS URI | 存储在 HDFS 上的 Docker registry 认证文件 |
| `dataDir`                      | String, optional, HDFS URI | 存储在 HDFS 上的数据文件目录          |
| `outputDir`                    | String, optional, HDFS URI | HDFS 上的输出目录，默认为`$PAI_DEFAULT_FS_URI/Output/$jobName`  |
| `codeDir`                      | String, optional, HDFS URI | 存储在 HDFS 上的代码目录         |
| `virtualCluster`               | String, optional           | 运行 job 的虚拟集群，若此项为空，job将运行在默认虚拟集群 |
| `taskRoles`                    | List, required             | `taskRole` 列表，需至少指定一个 |
| `taskRole.name`                | String in `^[A-Za-z0-9._~]+$` format, required | task role 名称，各 task role 名称不能重复 |
| `taskRole.taskNumber`          | Integer, required          | task 数量，不得少于一个 |
| `taskRole.cpuNumber`           | Integer, required          | 每个 task 的 CPU 数量，大于等于 1|
| `taskRole.memoryMB`            | Integer, required         | 每个 task 的存储空间，大于等于 100  |
| `taskRole.gpuNumber`           | Integer, required          | 每个 task 的 GPU 数量， 大于等于 0  | 
| `taskRole.portList`            | List, optional             | job 中用到的 `portType` 列表                |
| `taskRole.portType.label`      | String in `^[A-Za-z0-9._~]+$` format, required | 端口类型的标签名 |
| `taskRole.portType.beginAt`    | Integer, required          | 端口类型中的端口起始位置, 默认为 0 |
| `taskRole.portType.portNumber` | Integer, required          | 端口类型中的端口数量  |
| `taskRole.command`             | String, required           | task role 中给 task 的可执行命令，不能为空 |
| `gpuType`                      | String, optional           | 指定 tasks 使用的 GPU 类型，若为空则 tasks 将使用任意类型的 GPU |
| `killAllOnCompletedTaskNumber` | Integer, optional          |  完成多少个tasks结束全部的tasks，大于等于 0 |
| `retryCount`                   | Integer, optional          | job 重试次数，大于等于 0          |

如果你使用的是私有 Docker registry，pull 镜像时需要认证，则你需要新建一个认证文件上传至 HDFS，并且在配置文件的 `authFile`  字段指明该文件位置。该认证文件的格式如下：
```
docker_registry_server
username
password
```
**注意：** 如果你使用的是 Docker Hub 的私人 registry，认证文件的 `docker_registry_server` 字段应为 `docker.io` 。

## 运行环境
job 中的每一个 task 都运行在一个容器中，对于 multi-task job，tasks 之间需要相互通讯，故每个 task 要能获取其他 tasks 的运行环境信息（Runtime Information），如 IP、port 等等。
系统将这些运行环境信息作为环境变量公开给每个 task 的 Docker 容器。
为相互沟通，用户可以在容器中编写代码来访问这些运行环境变量。
这些环境变量也可以在 job 配置文件中使用。

Docker容器中可访问的环境变量的完整列表如下：

| 环境变量名          | Description                              |
| :--------------------------------- | :--------------------------------------- |
| PAI_WORK_DIR                       | Docker 容器中的工作目录    |
| PAI_DEFAULT_FS_URI                 | PAI 中默认文件系统的 URI           |
| PAI_JOB_NAME                       |  即配置文件中的 `jobName`                 |
| PAI_JOB_VC_NAME                    | job 所在的虚拟集群     |
| PAI_USER_NAME                      | 提交 job 的用户名                  |
| PAI_DATA_DIR                       |  即配置文件中的 `dataDir`                 |
| PAI_OUTPUT_DIR                     | 即配置文件中的 `outputDir`，或是  `outputDir` 没有指定时自动生成的目录 |
| PAI_CODE_DIR                       | 即配置文件中的 `codeDir`                |
| PAI_CURRENT_TASK_ROLE_NAME         | 当前 task role 的名称，即配置文件中的 `taskRole.name`  |
| PAI_CURRENT_TASK_ROLE_TASK_COUNT   | 当前 task role 的 task 数量，即配置文件中的
 `taskRole.taskNumber`  |
| PAI_CURRENT_TASK_ROLE_CPU_COUNT    | 当前 task role 的 CPU 数量，即配置文件中的 `taskRole.cpuNumber`  |
| PAI_CURRENT_TASK_ROLE_MEM_MB       |当前 task role 的存储空间，即配置文件中的  `taskRole.memoryMB`  |
| PAI_CURRENT_TASK_ROLE_GPU_COUNT    | 当前 task role 的 GPU 数量，即配置文件中的 `taskRole.gpuNumber`  |
| PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX | task role 中当前 task 的索引，从 0 开始 |
| PAI_JOB_TASK_COUNT                 | 配置文件中的 task 数量      |
| PAI_JOB_TASK_ROLE_COUNT            | 配置文件中的 task roles 数量 |
| PAI_JOB_TASK_ROLE_LIST             | 配置文件中的 所有 task roles名称，以逗号分隔 |
| PAI_KILL_ALL_ON_COMPLETED_TASK_NUM | 即配置文件中的  `killAllOnCompletedTaskNumber` |
| PAI_CONTAINER_HOST_IP              | 当前Docker 容器的 IP |
| PAI_CONTAINER_HOST_PORT_LIST       | 当前 Docker 容器的端口列表，格式示例： `portLabel0:port0,port1,port2;portLabel1:port3,port4` |
| PAI_CONTAINER_HOST_\_`$type`\_PORT_LIST | `portList.label == $type` 的端口列表，以逗号分隔 ，端口为 string 类型 |
| PAI_TASK_ROLE\_`$name`\_HOST_LIST  |  `PAI_TASK_ROLE_NAME == $name`的主机列表，以逗号分隔， `ip:port` 为 string，以当前 task 的索引排序。 |

## 深度学习job示例
一个分布式Tensorflow job的配置文件示例如下所示：
```js
{
  "jobName": "tensorflow-distributed-jobguid",
  // 你自定义的带 HDFS、CUDA 和 cuDNN 支持的 tensorflow Docker 镜像
  "image": "your_docker_registry/pai.run.tensorflow",
  // 本示例使用 cifar10 数据集，获取地址：http://www.cs.toronto.edu/~kriz/cifar.html
  "dataDir": "$PAI_DEFAULT_FS_URI/path/tensorflow-distributed-jobguid/data",
  "outputDir": "$PAI_DEFAULT_FS_URI/path/tensorflow-distributed-jobguid/output",
  // 本示例代码使用的是 tensorflow 基准程序：https://git.io/vF4wT
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
      // 在代码目录中运行 tf_cnn_benchmarks.py
      // 参数释义请参考 https://www.tensorflow.org/performance/performance_models#executing_the_script 
      // 如果你的 Docker 镜像里不含 `scipy`，需要在下面的命令中安装
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
  // 当 2 个 worker tasks 完成时，结束全部的 4 个 tasks
  "killAllOnCompletedTaskNumber": 2,
  "retryCount": 0
}
```

## 更多例子
- [tensorflow-example.json](tensorflow/tensorflow-example.json): ImageNet数据集Tensorflow单GPU训练示例.
- [tensorflow-distributed-example.json](tensorflow/tensorflow-distributed-example.json): CIFAR-10数据集Tensorflow分布式训练示例.
- [tensorboard-example.json](tensorflow/tensorboard-example.json): 使用TensorBoard可视化训练logs示例.
- [cntk-example.json](cntk/cntk-example.json): CMUDict语料库使用CNTK序列模型字音转换训练示例。

## 提交 job
1. 上传数据和代码至HDFS

    使用 HDFS 工具上传你的代码和数据。我们在 DockerHub 上传了一个内置 HDFS 支持的 [Docker 镜像](https://hub.docker.com/r/paiexample/pai.example.hdfs/)。
    HDFS 的用法详情请参考 [HDFS 命令指南](https://hadoop.apache.org/docs/r2.7.2/hadoop-project-dist/hadoop-hdfs/HDFSCommands.html) 。

2. 准备 job 配置文件

    为你的job准备[config file](#json-config-file-for-job-submission)

3. 通过门户网站提交 job
    
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
可以使用`ssh $PAI_CURRENT_TASK_ROLE_NAME-$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX`命令连接同属于一个job的其他容器。例如，有两个taskRoles，master 和 worker，可以使用如下命令直接连接到worker-0容器：
```sh
ssh worker-0
```
