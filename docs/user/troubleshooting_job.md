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

Like other platforms, the job failures in OpenPAI need more effort to find and fix than local code. This document helps troubleshooting issues on OpenPAI.

- [Troubleshoot job](#troubleshoot-job)
  - [Best practice](#best-practice)
    - [Fix issues locally](#fix-issues-locally)
    - [Make log clear](#make-log-clear)
    - [Validate job with local simulator](#validate-job-with-local-simulator)
    - [Know resource bottleneck well](#know-resource-bottleneck-well)
  - [Diagnostic issues](#diagnostic-issues)
    - [Job is waiting for hours](#job-is-waiting-for-hours)
    - [Job is running, but no IP address, ports, and GPU assigned](#job-is-running-but-no-ip-address-ports-and-gpu-assigned)
    - [Job is running and retried many times](#job-is-running-and-retried-many-times)
    - [Job runs slowly](#job-runs-slowly)
    - [Job is failed](#job-is-failed)
  - [Guidance](#guidance)
    - [How to view job metrics](#how-to-view-job-metrics)
    - [How to check job log](#how-to-check-job-log)
    - [Connect to running environments with SSH](#connect-to-running-environments-with-ssh)
    - [Reserve failed docker for debugging](#reserve-failed-docker-for-debugging)
    - [Ask helps](#ask-helps)

## Best practice

With best practice, many issues could be addressed earlier with low cost, and some tough issues can be found easily also.

### Fix issues locally

Troubleshooting issues remotely is hard, so keep in mind to consider fix an issue at local, not to investigate it at remote server immediately.

- If some error happens in remote environment, try to reproduce it at local firstly, and then try to fix it. It may spend more time on reproducing, but the time returns later mostly.
- Minimize code difference between local and remote. That makes it's easy to reproduce problems locally.
- Some issues may be caused by difference between local and remote environments, try to narrow down the difference where it happens. For example, to write a very small code snippet to reproduce it remotely.

### Make log clear

Debug is very useful at local development, but it's hard to use remotely, and most impossible in production environment. Log provides lots of information and works well in most environments.

To use log better,

1. Use log more when developing. In development phase, avoid debugging, or printing output for one-time use. The log should be improved if it doesn't have enough information to understand an issue. Some issue may be fixed locally or happens seldom, but it may happen at remote environment. Once it happens, the log can help locating.
2. Reduce duplicated content. The duplicated or repeated content is easy to bury useful information. So, duplicated content should be merged or disable.
3. Tell story in log, not just dump variables. People, who look log, may never see code, or forget it. Besides dump variable's value, the log needs to explain what variables mean in business logic. For example, when some variable is abnormal, the log should include why it's considered as abnormal, how it's critical, how to fix it.
4. Associate related log with context. In some parallel cases, log is dumped by concurrent threads, processes, or servers in same time. A context id is necessary to associate log together. And time synchronization is needed for distributed servers.
5. What should be logged? It's answered above partially. If something is helpful for troubleshooting, or further analyzing, it should be logged. For example, full error with call stack, and so on.

### Validate job with local simulator

Some bugs may happen within OpenPAI jobs only, so the code may run well at local, but failed remotely. With local simulator, more environment issues can be found locally.

OpenPAI VS Code Client can consume OpenPAI job configuration file and run in Docker container locally. This simulation can find problems that related to job configuration files, mismatched docker image with code dependencies, command line errors, environment variables and so on.

OpenPAI VS Code Client covers most situations at remote, but still limited, like the resource specification in configuration is ignored, as in most case, the local workstation is not powerful as a GPU server. When code is running locally, it may be much slower, and may be out of memory. The code or command can be modified to avoid this kind of issues and reduce training times at local to disclose more remote issues.

Before using the simulator, [Docker](https://www.docker.com/get-started) needs to be installed. Refer to [here](../../contrib/pai_vscode/VSCodeExt.md) to install and learn how to [simulate Job Running](../../contrib/pai_vscode/README.md#simulate-job-running).

Note, as Docker on Windows doesn't support GPU, so TensorFlow may need a docker image with CPU package for local simulation.

### Know resource bottleneck well

To use OpenPAI, user needs to specify resource specification, including CPU, GPU and memory. If requested resource is too low, the job may be much slower than expected or out of memory. But if a job is assigned too much resource, it's waste also. So, to be aware and understand bottleneck is important.

OpenPAI provides metrics of CPU, memory, and GPU, and it can be used to understand runtime consumption of resource. Learn [how to check job metrics](#how-to-check-job-metrics) for details.

## Diagnostic issues

### Job is waiting for hours

In general, jobs of OpenPAI stays in waiting status less than 1 minute before running. But if there is not enough resource, a job may stay in waiting status longer. In this case, waiting jobs are in queue, and will be executed later.

![waiting](imgs/web_job_list_waiting.png)

### Job is running, but no IP address, ports, and GPU assigned

As the design of OpenPAI, there are two phases to request resources. In first phase, job is in waiting status. In second phase, job is running, but the task role(s) may be requesting resources yet. When a job is running, it doesn't mean task roles of the job are assigned resource. If there is no IP address displayed, it means the task roles are requesting resource. If there is enough resource, the task container can start in seconds. If there is not enough resource available, the task roles keep like below status.

![no IP](imgs/web_job_detail_noip.png)

When some jobs complete, the task roles of waiting jobs have a chance to get resource. One way to start waiting jobs earlier, is to reduce requested resources, so this job may get enough resource easier.

Note, there may have more free resources than requested in dashboard of web portal. But resources are distributed on different servers, there may be no one server meet all resources requirement of CPU, memory, and GPU.

### Job is running and retried many times

If a job fails by system reasons, OpenPAI retries to run the job again.

For example, as OpenPAI has two phases to request resources, it may be timeout in second phase. OpenPAI retries the job to request resources again. Check above [job is running, but no IP address, ports, and GPU assigned](#job-is-running-but-no-ip-address-ports-and-gpu-assigned) to check if it's caused by limited resource. If a job retries many times, and isn't caused by limited resource, administrators of OpenPAI may needs to check why it happens.

![retry](imgs/web_job_detail_retry.png)

### Job runs slowly

The running speed of job is subjective sometime, so it needs more fact and data to measure, before trying to fix something. Below are several reasons that may make job slowly in OpenPAI.

1. GPU is not enabled. Some frameworks, like TensorFlow, need to install GPU package to enable GPU computing. In most case, the log of framework shows if GPU is in use. Some frameworks, like PyTorch, need to write code to use GPU explicitly. Learn [how to check job log](#how-to-check-job-log) to validate it in log.

2. Resource bottleneck. Computing resource is not the only potential bottleneck, IO and memory capacity are also bottleneck sometime. When job is running in OpenPAI, metrics can be used to analyze bottleneck. Refer to [how to check job metrics](#how-to-check-job-metrics) for more information.

### Job is failed

Job failures can be caused by many reasons. In general, it can be categorized to two types due to in different phases.

1. **Failures before running**, for example requested resources over capacity. If a job requests resources over the OpenPAI cluster can provide, the job fails soon. For example, if the cluster has only 24 cores of CPU, but user requests 48 cores in a job configuration, it causes job failure.

   For this kind of system failures, there is no resource assigned, no IP, ports and GPUs as below.

   ![over requested 1](imgs/web_job_details_over1.png)

   Click *View Application Summary*, there is an exception like below. it specifies which resource is over than maximum number.

   ![over requested 1](imgs/web_job_details_over2.png)

   Note, there may be other kinds of failures happening. If no resource assigned, click *View Application Summary* to get details of failures.

2. **Failures during job running**. If IP address and GPU are assigned, it means task instance is running. In this case, log provides details of failure. Learn [how to check job log](#how-to-check-job-log) to get failure details.

   Note, OpenPAI detects job failure by returned non-zero exit code of task instance. The exit code is from specified command in job configuration usually, and it may be caused by OpenPAI errors occasionally.

   The error code depends on the failed command, though there is [a document for exit codes](http://www.tldp.org/LDP/abs/html/exitcodes.html) of Linux.

   ![job link](imgs/web_job_details_exitcode.png)

## Guidance

### How to view job metrics

- Click *Go to Job Metrics Page* as below in job details page, if some tasks are assigned IP, and ports.

![job link](imgs/web_job_details_metrics.png)

- A new page is opened and show metrics of this job.

![job link](imgs/web_job_metrics.png)

- The *memory usage*, and *disk bandwidth* uses absolute value. It's easy to understand.
- *network traffic* shouldn't be regarded as an accurate value, as the collection approach is optimized for performance. If a data connection is alive for a short time, it may not be counted.
- 100% of *CPU*, it means 100% of one virtual core. So, the value may be more than 100%. For example, 300% means 3 virtual cores are occupied fully.
- *GPU Utilization* and *GPU memory* are total value. It's different with *CPU*. For example, if 4 GPU cards are assigned to an environment, 50% usage means 2 GPU cards are used.
- For distributed jobs, the value is average of all task instances. If a task role has multiple instances, it's average also.

The UI is implemented by [Grafana](https://grafana.com/), check its web site for more details.

### How to check job log

- Click *Go to Tracking Page* in job details page, if IP address,  ports and GPU are assigned.

   ![job link](imgs/web_job_details_loglink.png)

- A new page is opened and shows log of yarn platform.

   It may show like below, with file name only. Click file names, it shows last 4096 bytes of that file.

   ![job link](imgs/web_log_list1.png)

   Or it shows like below with last lines directly. Scroll down can find other files.

   ![job link](imgs/web_log_list2.png)

   In both cases, the page includes 4 files for a task instance, *DockerContainerDebug.log*, *YarnContainerDebug.log*, *stderr*, and *stdout*. Click *refresh* button of browser can show latest last 4k bytes. Click *here* shows the full log.

   *stderr* and *stdout* is screen output of the task instance. So, all content, that user prints to screen, displays there near real-time. Hints of most errors can be found in the two files. *DockerContainerDebug.log*, *YarnContainerDebug.log* can find some errors like out of memory for GPU, if there is no hint in *stderr* and *stdout*.

Note, if a task instance has no resource assigned, there is no log file.

### Connect to running environments with SSH

With SSH, any command can be run in an environment, and it provides familiar ways for terminal users.

For a running task instance, if it supports SSH connection, Click the link *View SSH Info*.

![job SSH](imgs/web_job_detail_ssh.png)

It pops up information as below. Follow steps in the dialog, can connect to the running docker container.

![job SSH info](imgs/web_job_details_ssh_info.png)

For distributed jobs, it's easy to connect from one to another container by environment variables. For example, `ssh $PAI_CURRENT_TASK_ROLE_NAME-$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX` is parsed to `ssh worker-0` in a docker container.

Note, the **SSH connection doesn't support in below cases**,

- The task instance isn't running or ready.
- The task instance is completed, as environment is recycled. From v0.11.0, the task instance can be reserved for debugging, refer to [reserve failed docker for debugging](#reserve-failed-docker-for-debugging).
- The docker image doesn't support SSH connection. To support SSH connection, *openssh-server* and *curl* must be installed in the docker image.

### Reserve failed docker for debugging

*It supports from OpenPAI v0.11.0*.

To reserve failed docker for debugging, it needs to set the following property in the jobEnv field. If the job is failed by user's command, the container is kept for 1 week by default. The period may be configured by administrators. If the job is success, the container won't be reserved.

![debugging](./imgs/webportal-job-debugging.png)

Refer to [here](../job_tutorial.md) to enable isDebug in job configuration file.

**Note**, with debugging is enabled for a job, the resource of this job is reserved also. To save resources for other jobs, this feature should be limited used, and shouldn't be enabled by default. And once debug is completed, the job should be stopped manually to release resources.

### Ask helps

Administrators of the OpenPAI cluster may be able to fix issues if this guidance doesn't work unfortunately.

If it isn't fixed by administrators, or you are administrator, you are welcome to [ask questions or submit issues](../../README.md#get-involved) to us.
