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

- [在 OpenPAI 上训练模型](#train-models-on-openpai) 
  - [提交 hello-world Job](#submit-a-hello-world-job)
  - [理解 Job](#understand-job) 
    - [理解 hello-world Job](#learn-hello-world-job)
    - [传输文件](#transfer-files)
    - [Job 流程](#job-workflow)
  - [参考](#reference)

本文档适合于初次使用 OpenPAI 来训练机器学习模型或执行其它命令的人。

假设已经知道 OpenPAI 的 IP 地址或域名，并已经有了账号。 如果还没安装 OpenPAI 集群，参考[这里](../../../README_zh_CN.md#部署)进行部署。

## 提交 hello-world Job

**Job** 在 OpenPAI 中定义了在指定的环境中如何执行命令。 Job 可以是模型训练，其它用途的命令，或者分布在多台服务器上。

本节介绍了如何提交一个非常简单的 Job，这就像在学习编程语言时，从 hello-world 示例开始一样。 此示例使用 TensorFlow 在 CIFAR-10 数据集上训练模型。 它会从互联网下载数据和代码，且不会将模型复制出来。 It helps getting started with OpenPAI. 接下来的章节会介绍更多内容，以便于提交真正实用的 Job。

1. 浏览至 OpenPAI 的 Web 界面。 可从 OpenPAI 管理员那里获取 IP 地址或域名。 如果需要登录，点击 *login* 按钮，并输入用户名、密码。
  
      After that, OpenPAI will show dashboard as below.
      
      ![dashboard](imgs/web_dashboard.png)
      

2. 单击左边的的 **Submit Job** 并转到此页面。
  
      ![submit job](imgs/web_submit_job.png)
      

3. 点击 **JSON** 按钮。 在弹出的文本框中，清除现有内容并粘贴下面的内容，然后单击“保存”。
  
      The content is introduced in next sections.
      
      ```json
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
      ```
      
      ![paste job](imgs/web_paste_json.png)
      

4. 将显示如下。 点击 **Submit** 按钮将作业提交到 OpenPAI 平台。
  
      ![click submit job](imgs/web_click_submit_job.png)
      
      Note, Web portal is one of ways to submit jobs. It's not most efficient way, but simplest way to begin. [OpenPAI VS Code Client](../../contrib/pai_vscode/VSCodeExt.md) is recommended to work with OpenPAI.
      

5. 提交后，页面重定向到作业列表，提交的作业在列表中为 **Waiting** 状态。 单击左边的 **Jobs** 也可以到达此页面。
  
      ![job list](imgs/web_job_list.png)
      

6. 单击 Job 名称以查看详细信息。 Keep refreshing the details page, until job status is changed to *Running*, and IP address is assigned in below pane of task role. There are more details and actions, like status, tracking log and so on.
  
      ![job list](imgs/web_job_details.png)
      

## 理解 Job

With submitting a hello-world job, this section introduces more knowledge about job, so that you can write your own job configuration easily.

### 理解 hello-world Job

**Job 配置**是一个发送到 OpenPAI 的 JSON 文件。 这里使用 hello-world Job 的配置来理解关键字段。

Job 的 JSON 文件有两层节点。 顶级节点包括了此 Job 的共享信息，包括 Job 名称，Docker 映像，任务角色等等。 第二级是 taskRoles，它是一个数组。 数组中每个项目都会指定命令和相应的运行环境。

以下是 Job 配置的必需字段，更多字段参考 [Job 配置手册](../job_tutorial.md)。

- **jobName** 是当前 Job 的唯一名称，也会显示在 Web 中。 有意义的名称有助于管理 Job。

- **image**
  
      OpenPAI uses [docker](https://www.docker.com/why-docker) to provide runtime environments. Docker is a popular technology to provide isolated environments on the same server. So that OpenPAI can serve multiple resource requests on the same server and provides consistent clean environments.
      
      The **image** field is the identity of docker image, which includes customized Python and system packages, to provide a clean and consistent environment for each running.
      
      Administrator may set a private docker repository. The hub.docker.com is a public docker repository with a lot of docker images. The [ufoym/deepo](https://hub.docker.com/r/ufoym/deepo) on hub.docker.com is recommended for deep learning. In the hello-world example, it uses a TensorFlow image, *ufoym/deepo:tensorflow-py36-cu90*, from ufoym/deepo.
      
      If an appropriate docker image isn't found, it's not difficult to [build a docker image](../job_docker_env.md) from scratch.
      
      Note, if a docker image doesn't include *openssh-server* and *curl* components by default, it cannot use SSH feature of OpenPAI. If SSH is needed, another docker image can be built on top of this image and includes *openssh-server* and *curl*.
      

- **taskRoles** defines different roles in a job.
  
      For single machine jobs, there is only one item in taskRoles.
      
      For distributed jobs, there may be multiple roles in taskRoles. For example, when TensorFlow is used to running distributed job, it has two roles, including parameter server and worker. There are two task roles in the corresponding job configuration, refer to [an example](../job_tutorial.md#a-complete-example).
      

- **taskRoles/name** is the name of current task role and it's used in environment variables for communication in distributed jobs.

- **taskRoles/taskNumber** is number of current task instances. For single server jobs, it should be 1. For distributed jobs, it depends on how many instances are needed for this task role. For example, if it's 8 in a worker role of TensorFlow. It means there should be 8 docker containers as workers should be instantiated for this task.

- **taskRoles/cpuNumber**, **taskRoles/memoryMB**, **taskRoles/gpuNumber** are easy to understand. They specify corresponding hardware resources including count of CPU core, MB of memory, and count of GPU.

- **taskRoles/command** is what user want to run in this task role. It can be multiple commands, which are joint by `&&` like in terminal. In the hello-world job configuration, it clones code from GitHub, downloads data and then executes the training progress within one line.
  
      Like the hello-world job, user needs to construct command(s) to get code, data and trigger executing.
      

### Transfer files

Most model training and other kinds of jobs need to transfer files between docker container and outside on OpenPAI. The files include dataset, code, scripts, trained model, and so on.

OpenPAI creates a clean docker container each running. Some files can be built into docker image directly if they are changed rarely.

If it needs to transfer files at runtime, the command field, which passes to docker in job configuration, is used to initiate the files transferring progress. For example, use `git`, `wget`, `scp`, `sftp`, other commands, code or scripts to copy files in and out. If some commands are not built in docker, it can be installed in the command field by `apt install ...` or `python -m pip install ...`.

It's better to check with administrator of the OpenPAI cluster, since there may be suggested approaches and examples already.

### Job workflow

Once job configuration is ready, next step is to submit it to OpenPAI. 推荐使用 [Visual Studio Code OpenPAI 扩展](../../../contrib/pai_vscode/VSCodeExt_zh_CN.md)来提交 Job。 Both web UI and extension through [RESTful API of OpenPAI](../rest-server/API.md) to manage jobs. So, it's possible to implement your own script or tool.

After received job configuration, OpenPAI processes it as below steps.

1. Wait to allocate resource. As job configuration, OpenPAI waits enough resources including CPU, memory, and GPU are allocated. If there is enough resource, the job starts to run very soon. If there is not enough resource, job is queued and wait previous job to complete.
  
      Note, distributed jobs start to run when first environment is ready. But user code can still wait until enough container(s) are running to execute actual progress. The job status is set to *Running* on OpenPAI as well, once one container is running.
      

2. Initialize docker container. OpenPAI pulls the docker image, which is specified in configuration, if it doesn't exist locally. After docker container started, OpenPAI executes some initialization and then run user's command(s).

3. Execute user commands. During user command executing, OpenPAI outputs [stdout and stderr](troubleshooting_job.md) near real-time. There also are metrics to [monitor workload](troubleshooting_job.md#how-to-check-job-log).

4. Finalize job running. Once user's command completed. OpenPAI use latest exit code as signal to decide the job is success or not. 0 means success, others mean failure. Then OpenPAI recycles resource for next job.

When job is submitted to OpenPAI, user can see job's status changing from waiting, to running, then to succeeded or failed. It may be stopped if the job is interrupted by user or system.

## Reference

- [Full spec of job configuration](../job_tutorial.md)
- [Examples](../../../examples)
- [Troubleshooting job failure](troubleshooting_job.md)