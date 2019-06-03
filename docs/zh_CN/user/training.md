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

# 在 OpenPAI 上训练模型

- [在 OpenPAI 上训练模型](#在-openpai-上训练模型) 
  - [提交 hello-world Job](#提交-hello-world-job)
  - [理解 Job](#理解-job) 
    - [了解 hello-world Job](#了解-hello-world-job)
    - [传入/传出文件](#传入传出文件)
    - [Job 流程](#job-流程)
  - [参考](#参考)

本文档包含了训练模型或执行其它类型任务的必要知识，适合 OpenPAI 新用户。

阅读前，确保已经有了 OpenPAI 集群的 IP 地址或域名，以及相应的账号。 如果还没安装 OpenPAI 集群，参考[这里](../../../README_zh_CN.md#部署)进行部署。

## 提交 hello-world Job

**Job** 在 OpenPAI 中定义了在指定的环境中如何执行命令。 Job 可以是模型训练，其它用途的命令，或者分布在多台服务器上。

本节介绍了如何提交一个非常简单的 Job，这就像在学习编程语言时，从 hello-world 示例开始一样。 此示例使用 TensorFlow 在 CIFAR-10 数据集上训练模型。 其从互联网下载数据和代码，且没有将训练完的模型复制出来。 通过此示例可初步了解 OpenPAI。 接下来的章节会介绍更多内容，以便于提交真正实用的 Job。

**注意**， Web 界面是提交 Job 的方法之一。 它学起来非常简单，但却不是最高效的提交和管理 Job 的方法。 推荐使用 [OpenPAI VS Code Client](../../contrib/pai_vscode/VSCodeExt.md)，来获得最好的体验。

1. 浏览至 OpenPAI 的 Web 界面。 可从 OpenPAI 管理员那里获取 IP 地址或域名。 在登录页面中，点击 *sign in*，输入用户名、密码。
  
  之后，OpenPAI 会显示如下的 Job 列表。
  
  ![job list](imgs/web_job_list.png)

2. 单击左边的的 **Submit Job** 并转到此页面。
  
  ![submit job](imgs/web_submit_job.png)

3. 点击 **JSON** 按钮。 在弹出的文本框中，清除现有内容并粘贴下面的内容，然后单击“保存”。
  
  内容将在下一节中介绍。
  
      json
       {
       "jobName": "tensorflow-cifar10",
       "image": "tensorflow/tensorflow:1.12.0-gpu-py3",
       "taskRoles": [
           {
           "name": "default",
           "taskNumber": 1,
           "cpuNumber": 4,
           "memoryMB": 8192,
           "gpuNumber": 1,
           "command": "apt update && apt install -y git && git clone https://github.com/tensorflow/models && cd models/research/slim && python download_and_convert_data.py --dataset_name=cifar10 --dataset_dir=/tmp/data && python train_image_classifier.py --dataset_name=cifar10 --dataset_dir=/tmp/data --max_number_of_steps=1000"
           }
       ]
       }
  
  ![paste job](imgs/web_paste_json.png)

4. 然后点击 **Submit** 按钮将 Job 提交到 OpenPAI 平台。
  
  ![click submit job](imgs/web_click_submit_job.png)

5. 提交后，页面重定向到作业列表，提交的作业在列表中为 **Waiting** 状态。 单击左边的 **Jobs** 也可以到达此页面。
  
  ![job list](imgs/web_job_list.png)

6. 单击 Job 名称查看详细信息。 开始运行后，Job 状态会变为 *Running*，并且会在下面显示分配给 Task Role 的 IP 地址。 除此之外，还有更多的信息及操作，如状态、查看日志等。
  
  ![job list](imgs/web_job_details.png)

## 理解 Job

本章节介绍了更多 Job 的知识，以便能轻松创建 Job 配置。

### 了解 hello-world Job

**Job 配置**是一个提交到 OpenPAI 的 JSON 文件。 hello-world Job 的配置包含了以下必需的关键字段。

JSON 文件中的字段有两个级别。 顶级节点是此 Job 的共享信息，包括 Job 名称，Docker 映像， Task Role 等等。 第二级是 taskRoles，是一个数组，它的每一项都描述了一个命令及其运行环境。

以下是 Job 配置的必需字段，更多字段参考 [Job 配置手册](../job_tutorial.md)。

- **jobName** 是当前 Job 的名称。 在每个用户账号中，其必需是唯一的。 有意义的名称有助于管理 Job。

- **image**
  
  [Docker](https://www.docker.com/why-docker) 是在服务器上提供虚拟环境的常用技术。 OpenPAI 用 Docker 来提供一致、干净的环境。 通过 Docker, OpenPAI 可以在同一台服务器上同时服务于多个资源请求。
  
  **image** 字段是 Docker 映像的标识，它包含了定制的 Python 和系统包。
  
  hub.docker.com 是共享的 Docker 存储库，有大量的 Docker 映像。 深度学习训练任务推荐使用 hub.docker.com 上的 [ufoym/deepo](https://hub.docker.com/r/ufoym/deepo)。 在 hello-world 示例中，使用了 ufoym/deepo 中的 Tensorflow 映像：*ufoym/deepo:tensorflow-py36-cu90*。 管理员可以设置专用的 Docker 存储库。
  
  如果没有找到合适的 Docker 映像，可参考[构建 Docker 映像](../job_docker_env.md)，能很容易的定制一个 Docker 映像。
  
  注意，如果 Docker 映像没有包括 *openssh-server* 和 *curl* 包，则无法使用 OpenPAI 的 SSH 功能。 如果需要使用 SSH，可基于已有 Docker 映像来构建一个包含了 *openssh-server* 和 *curl* 的新 Docker 映像。

- **taskRoles** 定义了 Job 中的不同角色。
  
  对于单机运行的 Job，在 taskRoles 中只有一个角色。
  
  对于分布式的 Job，可能会在 taskRoles 中有多个角色。 例如，在使用 TensorFlow 来运行分布式 Job 时，需要两个角色，包括参数服务器和工作节点。 相应的在 Job 配置中需要两个任务角色，参考[示例](../job_tutorial.md#a-complete-example)，了解详细信息。

- **taskRoles/name** 是任务角色的名称，还会被用于分布式 Job 的环境变量中。

- **taskRoles/taskNumber** 是任务角色的实例数量。 在单服务器 Job 中，其为 1。 在分布式 Job 中，根据任务角色需要多少个实例来定。 例如，其在 TensorFlow 的工作阶段角色中为 8。 则表示需要为工作节点角色创建 8 个 Docker 容器。

- **taskRoles/cpuNumber**，**taskRoles/memoryMB**，**taskRoles/gpuNumber** 非常容易理解。 它们指定了相应的硬件资源，包括 CPU 核数量，内存（MB），以及 GPU 数量。

- **taskRoles/command** 是此任务角色要运行的命令。 可以是多个命令，像在终端中一样，通过 `&&` 组合到一起。 例如，在 hello-world Job 中，命令会从 GitHub 中克隆代码，下载数据，然后执行训练过程。
  
  像 hello-world Job 一样，用户需要构造命令来获取代码、数据，并开始执行。

### 传入/传出文件

大多数模型训练以及其它类型的 Job 都需要在运行环境内外间传输文件。 这些文件包括数据集、代码、脚本、训练好的模型等等。

OpenPAI 会管理计算资源，但不会管理持久化的存储资源。 [如何使用存储](storage.md)可帮助 OpenPAI 用户来管理存储。

It's better to check with administrator of the OpenPAI cluster about how to transfer files, since they may choose most suitable approaches and examples for you.

### Job 流程

Once job configuration is ready, next step is to submit it to OpenPAI. To submit a job, it's recommended to use [Visual Studio Code Client](../../contrib/pai_vscode/VSCodeExt.md). Both web UI and the client through [RESTful API of OpenPAI](../rest-server/API.md) to access OpenPAI. The RESTful API can be used to customize a client.

After received job configuration, OpenPAI processes it as below steps.

1. Wait for resource allocated. OpenPAI waits enough resources including CPU, memory, and GPU are allocated. If there is enough resource, the job starts very soon. If there is not enough resource, job is queued and wait on previous jobs.
  
  Note, distributed jobs are marked as running in OpenPAI once they start to wait resource. The job status is set to *Running* on OpenPAI as well.

2. Initialize docker container. OpenPAI pulls the docker image, which is specified in configuration, if the image doesn't exist locally. After that OpenPAI will initialize the docker container.

3. run the command in configuration. During the command is executing, OpenPAI outputs [stdout and stderr](troubleshooting_job.md) near real-time. Some metrices can be used to [monitor workload](troubleshooting_job.md#how-to-check-job-log).

4. Finalize job running. Once the command is completed, OpenPAI use latest exit code as signal to decide the job is success or not. 0 means success, others mean failure. Then OpenPAI recycles resources for next jobs.

When a job is submitted to OpenPAI, the job's status changes from waiting, to running, then succeeded or failed. The status may display as stopped if the job is interrupted by user or system.

## 参考

- [Full spec of job configuration](../job_tutorial.md)
- [Examples](../../../examples)
- [Troubleshooting job failure](troubleshooting_job.md)
- [How to use storage](storage.md)