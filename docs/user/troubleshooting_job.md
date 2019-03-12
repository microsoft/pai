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

# Troubleshoot job

The failure of job is like other failures in computer system. When failure happens on remote system like OpenPAI, it needs more effort to address root cause. This document helps user troubleshooting more efficient on OpenPAI.

- [Troubleshoot job](#troubleshoot-job)
  - [Best practice](#best-practice)
    - [Fix issues locally](#fix-issues-locally)
    - [Use log better](#use-log-better)
    - [Verify with local simulator](#verify-with-local-simulator)
    - [Aware of resource bottleneck](#aware-of-resource-bottleneck)
  - [Diagnostic issues](#diagnostic-issues)
    - [Job is waiting for hours](#job-is-waiting-for-hours)
    - [Job is running, but no IP address, ports, and GPU assigned](#job-is-running-but-no-ip-address-ports-and-gpu-assigned)
    - [Job is running and retried many times](#job-is-running-and-retried-many-times)
    - [Job runs slowly](#job-runs-slowly)
    - [Job is failed](#job-is-failed)
  - [Guidance](#guidance)
    - [How to check job metrics](#how-to-check-job-metrics)
    - [How to check job log](#how-to-check-job-log)
    - [Connect to running environments with SSH](#connect-to-running-environments-with-ssh)
    - [Reserve failed docker for debugging](#reserve-failed-docker-for-debugging)
    - [Ask helps](#ask-helps)

## Best practice

With best practice, many issues could be addressed earlier with low cost, and some tough issues can be found easily also.

### Fix issues locally

Troubleshooting issues remotely is hard, so it's efficient to solve them locally.

- If some error happens in remote environment, try to reproduce it locally, and then try to fix it.
- Some issues may be caused by some different between local and remote, try to narrow down where it happens, and compare difference between local and remote.
- Minimize code difference between local and remote. That makes it's easy to reproduce problems locally.

### Use log better

Debug is very useful at local development, but it's hard remote, and most impossible in production environment. Log provides lots of information and works well in most environments.

To use log better,

1. Use more when developing. In development phase, avoid debugging, or print one time. The log should be refined, if it's not enough to troubleshoot issues. Some issue may be fixed locally or happens seldom. Once they happen, log can help exposing them.
2. Provide more information. More information doesn't mean more content. More content is easy to bury useful information. So, if some log repeats or duplicate a lot, it should be merged or disable.
3. Let log tell story, not just dump variables. People, who looks log, may never see code, or forget code logic already. Besides dump key variable's value, it needs to explain what it means in business logic also. For example, when some variable is abnormal, log should include why it's considered as abnormal, how it's critical, how to fix it.
4. Associate with context. In some parallel cases, log is filled by concurrent threads, process, or distributed systems. A context id is necessary to associate log in same context. And time synchronization is needed for distributed system.
5. What should be logged? The answer of this question is in above points partially. If something is helpful for troubleshooting, or further analyzing, it should be logged. For example, full error trace of abnormal situation, something may be helpful when there is any failure, and so on.

### Verify with local simulator

Some bug may happen in specific environment or configuration, so that code may run well locally, but failed remotely. If the environment can be simulated locally, more environment issues can be found.

OpenPAI VS Code Client can consume OpenPAI job configuration file and run in Docker container locally. This simulation can find problems that related to job configuration files, mismatched docker image with code dependencies, command line errors. It can cover most situations at remote, but still limited, like the requested resource in configuration is ignored, as in most case, local machine is not powerful like a GPU server. So when code is running locally, it may be much slower, and may be out of memory. The code or command can be modified to avoid these kind of issues and reduce training times to disclose more remote problems.

The simulator in OpenPAI VS Code Client needs Docker installed. Refer to [here](../../contrib/pai_vscode/VSCodeExt.md) to install and learn how to [simulate Job Running](../../contrib/pai_vscode/README.md#simulate-job-running).

Note, as Docker doesn't support GPU on Windows, so it may need a docker image with CPU package for local simulation.

### Aware of resource bottleneck

To use OpenPAI, user needs to specify used resources, including CPU, GPU and memory. If requested resource is lower than minimum requirement, the progress may be much slower than expected. So, to be aware and understand bottleneck is important for efficiency.

OpenPAI provides metrics of CPU, memory, and GPU. Refer to [how to check job metrics](#how-to-check-job-metrics) in this document to learn more.

## Diagnostic issues

### Job is waiting for hours

In general, jobs of OpenPAI stays in waiting status about 1 minute. But if there is not enough resource, a job may stay in waiting status longer.

![waiting](imgs/web_job_list_waiting.png)

In this case, the job is in queue to wait resource. When some jobs complete, this job will get resource to run. Another way is to reduce requested resource, so this job may get enough resource easier.

Notice, there may have more resources than requested in dashboard of OpenPAI. But resources are distributed on different servers, there may be no server meet the resources requirement for CPU, memory, and GPU all.

### Job is running, but no IP address, ports, and GPU assigned

As the design of OpenPAI, there are two phases to request resources. When job is running, it doesn't mean task instances is running. If there is no IP address assigned for a task instance, it means the task instance is in this situation. If there is enough resource, the task instance can start in seconds. If there is no resource, the task instance keeps no IP address in longer time.

![noiop](imgs/web_job_detail_noip.png)

### Job is running and retried many times

If OpenPAI fails with system reason, OpenPAI retries to run the job again. For example, as OpenPAI has two phases to request resources, it may be timeout in second phase. OpenPAI retries the job to request resources again. Check above issue, [job is running, but no IP address, ports, and GPU assigned](#job-is-running-but-no-ip-address-ports-and-gpu-assigned) to confirm if it's caused by limited resource.

If it retries many times, and isn't caused by limited resource, administrators of OpenPAI may needs to check what happens.

![noiop](imgs/web_job_detail_retry.png)

### Job runs slowly

The running speed of job is subjective sometime, so it needs more fact and data to estimate what's expected speed, before trying to fix it. Besides to fix code to improve speed, below is several reasons that may make job slowly in OpenPAI.

1. GPU is not enabled. Some framework, like TensorFlow, needs to install GPU package to enable GPU. In most case, the log of framework shows if GPU or CPU is enabled. Some framework, like PyTorch, code needs to be updated to GPU, and there is API to check if GPU is used. Learn more from [how to check job log](#how-to-check-job-log).

2. Resource bottleneck. Computing resource is not the only potential bottleneck, IO and memory capacity are also bottleneck sometime. When job is running in OpenPAI, metrics can be used to analyze bottleneck. Refer to [how to check job metrics](#how-to-check-job-metrics) for more information.

### Job is failed

Job failure can be caused by many reasons.

1. **System failures like over maximum resources**. If a job requests more than maximum resources, which the OpenPAI cluster can provide, the job fails shortly. For example, if the cluster has only 32 cores of CPU, but user requests 48 cores in a job configuration, it causes job failure.

   For this kind of system failures, there is no resource assigned, no IP, ports and GPUs as below.

   ![over requested 1](imgs/web_job_details_over1.png)

   Click *View Application Summary*, there is exception with message like below. it specifies which resource is over than maximum number. In below case, it requests 48 virtual cores, but 24 virtual cores are maximum available number in this cluster.

   ![over requested 1](imgs/web_job_details_over2.png)

   Note, there may be other kinds of system failures happening. If no resource assigned, click *View Application Summary* to get details of system failure.

2. **User level failures**. If IP address and GPU are assigned, it's user level failure in most case. In this case, log provides details of failure. Learn more from [how to check job log](#how-to-check-job-log).

   Note, OpenPAI detects job failure by returns non-zero exit code of task instance.

   ![job link](imgs/web_job_details_exitcode.png)

## Guidance

### How to check job metrics

- Click *Go to Job Metrics Page* as below in job details page, if some tasks are assigned IP, and ports.

![job link](imgs/web_job_details_metrics.png)

- A new page is opened and show metrics of this job. 

![job link](imgs/web_job_metrics.png)

Note, the UI is implemented by [Grafana](https://grafana.com/), check its web site for how to use.

### How to check job log

- Click *Go to Tracking Page* as below in job details page, if the task instance is assigned IP, and ports.

![job link](imgs/web_job_details_loglink.png)

- A new page is opened and shows log of yarn platform.

   It may be like below, with file name only. Click file names, it shows last lines of that file.

   ![job link](imgs/web_log_list1.png)

   Or it shows like below with last lines directly. Scroll down can find other files.

   ![job link](imgs/web_log_list2.png)

   In both cases, it includes 4 files, *DockerContainerDebug.log*, *YarnContainerDebug.log*, *stderr*, and *stdout*. Click *refresh* button of browser can show latest last lines. Click *here* shows the full log.

   *stderr* and *stdout* includes screen output of the task instance. So, all content, that user prints to screen, shows in them, and display near real-time. Hints of most errors can be found in the two files. *DockerContainerDebug.log*, *YarnContainerDebug.log* can find some errors like out of memory for GPU, if there is no hint in *stderr* and *stdout*.

Note, if a task instance has no resource assigned, there is no log file.

### Connect to running environments with SSH

With SSH, any command can be run in the environment, and it provides familiar approaches to terminal users.

For a running task instance, if it supports SSH connection, the *View SSH Info* link is clickable. Click the link,

![job ssh](imgs/web_job_detail_ssh.png)

It pops up information like below. Follow steps in the dialog, can connect to the running docker container.

![job ssh](imgs/web_job_details_ssh_info.png)

For distributed jobs, it's easy to connect from one to another container by environment variables. For example, `ssh $PAI_CURRENT_TASK_ROLE_NAME-$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX` is parsed to `ssh worker-0`.

Note, the SSH connection doesn't support in below cases,

- The task instance isn't running or ready.
- The task instance is completed, as environment is recycled. From v0.11.0, the task instance can be reserved for debugging, refer to [next section](#reserve-failed-docker-for-debugging).
- The docker image doesn't support SSH connection. To support SSH connection, *openssh-server* and *curl* should be installed in the docker image.

### Reserve failed docker for debugging

*It supports from OpenPAI v0.11.0*.

To reserve failed docker for debugging, it needs to set the following property in the jobEnv of jobConfig. If the job is failed by user's command, the container is kept for 1 week by default.

![webportal_submit_job](../pic/webportal-job-debugging.png)

**Note**, with debugging is enabled, the resource is reserved for several days. To save system resource, this feature should be limited used, and shouldn't be turned on by default. And once debug is completed, the job should be stopped manually.

### Ask helps

Administrators of the OpenPAI cluster may fix issues, if this guidance doesn't work unfortunately.

If it isn't fixed still, you are welcome to [submit issue or ask questions](../../README.md#get-involved) to us.
