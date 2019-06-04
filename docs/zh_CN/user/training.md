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

This document is for new users of OpenPAI. It provides the must to know knowledge to train models or execute other kinds of commands.

Before learning this document, make sure you have IP address or domain name and an account of an OpenPAI cluster already. 如果还没安装 OpenPAI 集群，参考[这里](../../../README_zh_CN.md#部署)进行部署。

## 提交 hello-world Job

**Job** 在 OpenPAI 中定义了在指定的环境中如何执行命令。 Job 可以是模型训练，其它用途的命令，或者分布在多台服务器上。

本节介绍了如何提交一个非常简单的 Job，这就像在学习编程语言时，从 hello-world 示例开始一样。 此示例使用 TensorFlow 在 CIFAR-10 数据集上训练模型。 其从互联网下载数据和代码，且没有将训练完的模型复制出来。 通过此示例可初步了解 OpenPAI。 接下来的章节会介绍更多内容，以便于提交真正实用的 Job。

**注意**， Web 界面是提交 Job 的方法之一。 它学起来非常简单，但却不是最高效的提交和管理 Job 的方法。 推荐使用 [OpenPAI VS Code Client](../../contrib/pai_vscode/VSCodeExt.md)，来获得最好的体验。

1. 浏览至 OpenPAI 的 Web 界面。 可从 OpenPAI 管理员那里获取 IP 地址或域名。 在登录页面中，点击 *sign in*，输入用户名、密码。
  
  之后，OpenPAI 会显示如下的 Job 列表。
  
  ![Job 列表](imgs/web_job_list.png)

2. 单击左边的的 **Submit Job** 并转到此页面。
  
  ![提交 Job](imgs/web_submit_job.png)

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
  
  ![粘贴 Job](imgs/web_paste_json.png)

4. 然后点击 **Submit** 按钮将 Job 提交到 OpenPAI 平台。
  
  ![点击提交 Job](imgs/web_click_submit_job.png)

5. 提交后，页面重定向到作业列表，提交的作业在列表中为 **Waiting** 状态。 单击左边的 **Jobs** 也可以到达此页面。
  
  ![Job 列表](imgs/web_job_list.png)

6. 单击 Job 名称查看详细信息。 开始运行后，Job 状态会变为 *Running*，并且会在下面显示分配给 Task Role 的 IP 地址。 除此之外，还有更多的信息及操作，如状态、查看日志等。
  
  ![Job 列表](imgs/web_job_details.png)

## 理解 Job

This section introduces more knowledge about job, so that you can write your own job configuration easily.

### 了解 hello-world Job

The **job configuration** is a JSON file, which is submitted to OpenPAI. The hello-world job configuration includes below required key fields.

JSON 文件中的字段有两个级别。 The top level is shared information of the job, including job name, Docker image, task roles, and so on. The second level is taskRoles, it's an array and each item describe a command and its environment.

以下是 Job 配置的必需字段，更多字段参考 [Job 配置手册](../job_tutorial.md)。

- **jobName** 是当前 Job 的名称。 在每个用户账号中，其必需是唯一的。 有意义的名称有助于管理 Job。

- **image**
  
  [Docker](https://www.docker.com/why-docker) is a popular technology to provide virtual environments on a server. OpenPAI 用 Docker 来提供一致、干净的环境。 With Docker, OpenPAI can serve multiple resource requests on the same server.
  
  The **image** field is the identity of a Docker image, which includes customized Python or system packages.
  
  The hub.docker.com is a public Docker repository with a lot of Docker images. 深度学习训练任务推荐使用 hub.docker.com 上的 [ufoym/deepo](https://hub.docker.com/r/ufoym/deepo)。 在 hello-world 示例中，使用了 ufoym/deepo 中的 Tensorflow 映像：*ufoym/deepo:tensorflow-py36-cu90*。 Administrator may set a private Docker repository.
  
  If an appropriate Docker image isn't found, it's easy to [build a Docker image](../job_docker_env.md).
  
  Note, if a Docker image doesn't include *openssh-server* and *curl* packages, it cannot use SSH feature of OpenPAI. If SSH is needed, a new Docker image can be built and includes *openssh-server* and *curl* on top of the existing Docker image.

- **taskRoles** 定义了 Job 中的不同角色。
  
  For single server jobs, there is only one role in taskRoles.
  
  对于分布式的 Job，可能会在 taskRoles 中有多个角色。 例如，在使用 TensorFlow 来运行分布式 Job 时，需要两个角色，包括参数服务器和工作节点。 There are two task roles in the corresponding job configuration, refer to [the example](../job_tutorial.md#a-complete-example) for details.

- **taskRoles/name** is the name of task role and it's used in environment variables in distributed jobs.

- **taskRoles/taskNumber** is number of instances of this task role. 在单服务器 Job 中，其为 1。 在分布式 Job 中，根据任务角色需要多少个实例来定。 例如，其在 TensorFlow 的工作阶段角色中为 8。 It means there should be 8 Docker containers for the worker role.

- **taskRoles/cpuNumber**，**taskRoles/memoryMB**，**taskRoles/gpuNumber** 非常容易理解。 它们指定了相应的硬件资源，包括 CPU 核数量，内存（MB），以及 GPU 数量。

- **taskRoles/command** 是此任务角色要运行的命令。 可以是多个命令，像在终端中一样，通过 `&&` 组合到一起。 例如，在 hello-world Job 中，命令会从 GitHub 中克隆代码，下载数据，然后执行训练过程。
  
  Like the hello-world job, user needs to construct command(s) to get code, data and trigger executing.

### 传入/传出文件

大多数模型训练以及其它类型的 Job 都需要在运行环境内外间传输文件。 这些文件包括数据集、代码、脚本、训练好的模型等等。

OpenPAI manages computing resources, but it doesn't manage persistent storage. [如何使用存储](storage.md)可帮助 OpenPAI 用户来管理存储。

最好与 OpenPAI 集群的管理员确认如何传输文件，他们可能已经选出了最合适的方法和示例。

### Job 流程

Job 配置准备好后，下一步则需要将其提交到 OpenPAI。 推荐使用 [Visual Studio Code OpenPAI Client](../../../contrib/pai_vscode/VSCodeExt_zh_CN.md) 来提交 Job。

Note, both web UI and the Visual Studio Code Client through [RESTful API](../rest-server/API.md) to access OpenPAI. The RESTful API can be used to customize the client experience.

After received job configuration, OpenPAI processes it as below steps.

1. 等待分配资源。 OpenPAI 会等待分配到足够的资源，包括 CPU，内存和 GPU。 如果资源足够，Job 会很快开始。 If there is not enough resource, job is queued and wait on previous jobs completing and releasing resource.

2. Initialize Docker container. OpenPAI pulls the Docker image, which is specified in configuration, if the image doesn't exist locally. After that OpenPAI will initialize the Docker container.

3. 运行配置中的命令。 在命令执行过程中，OpenPAI 会近实时的输出 [stdout 和 stderr](troubleshooting_job.md)。 还可通过一些指标来[监控工作负载](troubleshooting_job.md#how-to-check-job-log)。

4. Finish job. 命令完成后，OpenPAI 会用最后的退出代码作为信号来决定 Job 是否成功结束。 0 表示成功，其它值表示失败。 随后，OpenPAI 会回收资源，以便运行下一个 Job。

When a job is submitted to OpenPAI, the job's status changes from waiting, to running, then succeeded or failed. The status may display as stopped if the job is interrupted by user or system.

## 参考

- [Job 配置的完整说明](../job_tutorial.md)
- [示例](../../../examples)
- [调研 Job 错误](troubleshooting_job.md)
- [如何使用存储](storage.md)