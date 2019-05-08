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

# Train models on OpenPAI

- [Train models on OpenPAI](#train-models-on-openpai)
  - [Submit a hello-world job](#submit-a-hello-world-job)
  - [Understand job](#understand-job)
    - [Learn hello-world job](#learn-hello-world-job)
    - [Transfer files](#transfer-files)
    - [Job workflow](#job-workflow)
  - [Reference](#reference)

This document is for beginners, who use OpenPAI to train machine learning models or execute other commands.

It assumes that you know IP address or domain name and have an account of OpenPAI. If there isn't an OpenPAI cluster yet, refer to [here](../../README.md#deploy-openpai) to deploy one.

## Submit a hello-world job

The **job** of OpenPAI defines how to execute command(s) in specified environment(s). A job can be model training, other kinds of commands, or distributed on multiple servers.

Following this section to submit a very simple job like hello-world during learning a program language. It trains a model, which is implemented by TensorFlow, on CIFAR-10 dataset. It downloads data and code from internet and doesn't copy model out. It helps getting started with OpenPAI. Next sections include more details to help on submitting real jobs.

1. Navigate to OpenPAI web portal. Input IP address or domain name of OpenPAI, which is from administrator of the OpenPAI cluster. Click *sign in* and input user name, password, once login page shows.

   After that, OpenPAI will show job list as below.

   ![job list](imgs/web_job_list.png)

2. Click **Submit Job** on the left pane and reach this page.

   ![submit job](imgs/web_submit_job.png)

3. Click **JSON** button. Clear existing content and paste below content in the popped text box, then click save.

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

4. It will show as below. Click **Submit** button to submit the job to OpenPAI platform.

   ![click submit job](imgs/web_click_submit_job.png)

   Note, Web portal is one of ways to submit jobs. It's not most efficient way, but simplest way to begin. [OpenPAI VS Code Client](../../contrib/pai_vscode/VSCodeExt.md) is recommended to work with OpenPAI.

5. After submitted, the page redirects to job list, and the submitted job is in list as **waiting** status. Click **Jobs** on right pane can also reach this page.

   ![job list](imgs/web_job_list.png)

6. Click job name to view job details. Keep refreshing the details page, until job status is changed to *Running*, and IP address is assigned in below pane of task role. There are more details and actions, like status, tracking log and so on.

   ![job list](imgs/web_job_details.png)

## Understand job

With submitting a hello-world job, this section introduces more knowledge about job, so that you can write your own job configuration easily.

### Learn hello-world job

The **job configuration** is a JSON file, which is posted to OpenPAI. Here uses the hello-world job configuration to understand key fields.

The JSON file of job has two levels entries. The top level includes shared information of the job, including job name, docker image, task roles, and so on. The second level is taskRoles, it's an array. Each item in the array specifies commands and the corresponding running environment.

Below is required fields and [full spec of job configuration](../job_tutorial.md) is here.

- **jobName** is the unique name of current job, displays in web also. A meaningful name helps managing jobs well.

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

Once job configuration is ready, next step is to submit it to OpenPAI. To submit a job, the recommended way is to use [Visual Studio Code extension for OpenPAI](../../contrib/pai_vscode/VSCodeExt.md). Both web UI and extension through [RESTful API of OpenPAI](../rest-server/API.md) to manage jobs. So, it's possible to implement your own script or tool.

After received job configuration, OpenPAI processes it as below steps.

1. Wait to allocate resource. As job configuration, OpenPAI waits enough resources including CPU, memory, and GPU are allocated. If there is enough resource, the job starts to run very soon. If there is not enough resource, job is queued and wait previous job to complete.

   Note, distributed jobs start to run when first environment is ready. But user code can still wait until enough container(s) are running to execute actual progress. The job status is set to *Running* on OpenPAI as well, once one container is running.

2. Initialize docker container. OpenPAI pulls the docker image, which is specified in configuration, if it doesn't exist locally. After docker container started, OpenPAI executes some initialization and then run user's command(s).

3. Execute user commands. During user command executing, OpenPAI outputs [stdout and stderr](troubleshooting_job.md) near real-time. There also are metrics to [monitor workload](troubleshooting_job.md#how-to-check-job-log).

4. Finalize job running. Once user's command completed. OpenPAI use latest exit code as signal to decide the job is success or not. 0 means success, others mean failure. Then OpenPAI recycles resource for next job.

When job is submitted to OpenPAI, user can see job's status changing from waiting, to running, then to succeeded or failed. It may be stopped if the job is interrupted by user or system.

## Reference

- [Full spec of job configuration](../job_tutorial.md)
- [Examples](../../examples)
- [Troubleshooting job failure](troubleshooting_job.md)
