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

JSON 文件中的字段有两个级别。 The top level is shared information of the job, including job name, docker image, task roles, and so on. The second level is taskRoles, it's an array and each item specify a command and its environment.

Below is required fields and [full spec of job configuration](../job_tutorial.md) is here.

- **jobName** is the name of current job. It must be unique in each user account. A meaningful name helps managing jobs well.

- **image**
  
  [Docker](https://www.docker.com/why-docker) is a popular technology to provide virtual environments on a server. OpenPAI uses Docker to provide consistent and clean environments. OpenPAI can also serve multiple resource requests on the same server.
  
  The **image** field is the identity of a docker image, which includes customized Python or system packages, to provide a clean and consistent environment for each running.
  
  The hub.docker.com is a public docker repository with a lot of docker images. The [ufoym/deepo](https://hub.docker.com/r/ufoym/deepo) on hub.docker.com is recommended for deep learning. In the hello-world example, it uses a TensorFlow image, *ufoym/deepo:tensorflow-py36-cu90*, in ufoym/deepo. Administrator may set a private docker repository.
  
  If an appropriate docker image isn't found, it's easy to [build a docker image](../job_docker_env.md).
  
  Note, if a docker image doesn't include *openssh-server* and *curl* packages, it cannot use SSH feature of OpenPAI. If SSH is needed, another docker image can be built and includes *openssh-server* and *curl*.

- **taskRoles** defines different roles in a job.
  
  For single machine jobs, there is only one role in taskRoles.
  
  For distributed jobs, there may be multiple roles in taskRoles. For example, when TensorFlow is used to running distributed job, it has two roles, including parameter server and worker. There are two task roles in the corresponding job configuration, refer to [the example](../job_tutorial.md#a-complete-example).

- **taskRoles/name** is the name of current task role and it's used in environment variables in distributed jobs.

- **taskRoles/taskNumber** is number of instances of current role. In single server jobs, it should be 1. In distributed jobs, it depends on how many instances are needed for a task role. For example, if it's 8 in a worker role of TensorFlow. It means there should be 8 docker containers as workers should be instantiated for this role.

- **taskRoles/cpuNumber**, **taskRoles/memoryMB**, **taskRoles/gpuNumber** are easy to understand. They specify corresponding hardware resources including the number of CPU core, MB of memory, and number of GPU.

- **taskRoles/command** is the command to run in this task role. It can be multiple commands, and joint by `&&` like in terminal. For example, in the hello-world job, the command clones code from GitHub, downloads data and then executes the training progress.
  
  Like the hello-world job, user needs to construct command(s) to get code, data and trigger running.

### 传入/传出文件

Most model training and other kinds of jobs need to transfer files between running environments and outside. Files include dataset, code, scripts, trained model, and so on.

OpenPAI manages computing resources, but it doesn't provide persistent storage. The [how to use storage](storage.md) is prepared for OpenPAI users.

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