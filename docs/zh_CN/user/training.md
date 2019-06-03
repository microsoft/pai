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
    - [传入/传出文件](#transfer-files-inout)
    - [Job 流程](#job-workflow)
  - [参考](#reference)

This document is for beginners, and it provides the must to know knowledge to train models or execute other kinds of commands.

It assumes that you have IP address or domain name and have an account of an OpenPAI cluster already. 如果还没安装 OpenPAI 集群，参考[这里](../../../README_zh_CN.md#部署)进行部署。

## 提交 hello-world Job

**Job** 在 OpenPAI 中定义了在指定的环境中如何执行命令。 Job 可以是模型训练，其它用途的命令，或者分布在多台服务器上。

Follow to submit a very simple job like hello-world during learning a program language. It trains a model, which is implemented by TensorFlow on CIFAR-10 dataset. 它会从互联网下载数据和代码，且不会将模型复制出来。 It helps getting started with OpenPAI. 接下来的章节会介绍更多内容，以便于提交真正实用的 Job。

**Note**, Web portal is one of ways to submit jobs. It's the simplest way to begin, but's not most efficient way to submit and manage jobs. [OpenPAI VS Code Client](../../contrib/pai_vscode/VSCodeExt.md) is recommended, as it provides best experience.

1. 浏览至 OpenPAI 的 Web 界面。 可从 OpenPAI 管理员那里获取 IP 地址或域名。 Click *sign in* and input username, password, once login page shows.
  
  After that, OpenPAI will show job list as below.
  
  ![job list](imgs/web_job_list.png)

2. 单击左边的的 **Submit Job** 并转到此页面。
  
  ![submit job](imgs/web_submit_job.png)

3. 点击 **JSON** 按钮。 在弹出的文本框中，清除现有内容并粘贴下面的内容，然后单击“保存”。
  
  The content is introduced in next sections.
  
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

4. Then click **Submit** button to submit the job to OpenPAI.
  
  ![click submit job](imgs/web_click_submit_job.png)

5. After submitted, the page redirects to job list, and the submitted job is in list as **Waiting** status. Click **Jobs** on left pane can also reach this page.
  
  ![job list](imgs/web_job_list.png)

6. Click job name to view details. Job status will be changed to *Running*, and IP address is assigned in below pane of task role once it starts to run. There are more details and actions, like status, tracking log and so on.
  
  ![job list](imgs/web_job_details.png)

## 理解 Job

With submitting a hello-world job, this section introduces more knowledge about job, so that you can write your own job configuration easily.

### 理解 hello-world Job

The **job configuration** is a JSON file, which is posted to OpenPAI. The hello-world job configuration uses below required key fields.

There are two levels of fields in the JSON file. The top level is shared information of the job, including job name, docker image, task roles, and so on. The second level is taskRoles, it's an array and each item specify a command and its environment.

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

### Transfer files in/out

Most model training and other kinds of jobs need to transfer files between running environments and outside. Files include dataset, code, scripts, trained model, and so on.

OpenPAI manages computing resources, but it doesn't provide persistent storage. The [how to use storage](storage.md) is prepared for OpenPAI users.

It's better to check with administrator of the OpenPAI cluster about how to transfer files, since they may choose most suitable approaches and examples for you.

### Job workflow

Once job configuration is ready, next step is to submit it to OpenPAI. To submit a job, it's recommended to use [Visual Studio Code Client](../../contrib/pai_vscode/VSCodeExt.md). Both web UI and the client through [RESTful API of OpenPAI](../rest-server/API.md) to access OpenPAI. The RESTful API can be used to customize a client.

After received job configuration, OpenPAI processes it as below steps.

1. Wait for resource allocated. OpenPAI waits enough resources including CPU, memory, and GPU are allocated. If there is enough resource, the job starts very soon. If there is not enough resource, job is queued and wait on previous jobs.
  
  Note, distributed jobs are marked as running in OpenPAI once they start to wait resource. The job status is set to *Running* on OpenPAI as well.

2. Initialize docker container. OpenPAI pulls the docker image, which is specified in configuration, if the image doesn't exist locally. After that OpenPAI will initialize the docker container.

3. run the command in configuration. During the command is executing, OpenPAI outputs [stdout and stderr](troubleshooting_job.md) near real-time. Some metrices can be used to [monitor workload](troubleshooting_job.md#how-to-check-job-log).

4. Finalize job running. Once the command is completed, OpenPAI use latest exit code as signal to decide the job is success or not. 0 means success, others mean failure. Then OpenPAI recycles resources for next jobs.

When a job is submitted to OpenPAI, the job's status changes from waiting, to running, then succeeded or failed. The status may display as stopped if the job is interrupted by user or system.

## Reference

- [Full spec of job configuration](../job_tutorial.md)
- [Examples](../../../examples)
- [Troubleshooting job failure](troubleshooting_job.md)
- [How to use storage](storage.md)