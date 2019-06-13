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

# 诊断调试 Job

与其它远程平台一样，OpenPAI 中 Job 失败的诊断和调试上需要更多精力。 本文有助于诊断 OpenPAI 上发生的问题。

- [诊断调试 Job](#troubleshoot-jobs) 
  - [最佳实践](#best-practice) 
    - [在本机修复问题](#fix-issues-locally)
    - [编写易于理解的日志](#write-log-easy-to-understand)
    - [使用本机模拟机验证 Job](#validate-job-with-local-simulator)
    - [充分了解资源瓶颈](#know-resource-bottleneck-well)
  - [诊断问题](#diagnostic-issues) 
    - [Job 排队了数小时](#job-is-waiting-for-hours)
    - [Job 重试了很多次](#job-is-running-and-retried-many-times)
    - [Job 执行较慢](#job-runs-slowly)
    - [Job 失败](#job-is-failed)
  - [指南](#guideline) 
    - [查看 Job 指标](#how-to-view-job-metrics)
    - [查看 Job 日志](#how-to-check-job-log)
    - [使用 SSH 远程连接](#connect-to-running-environments-with-ssh)
    - [保留失败的 Docker 来调试](#reserve-failed-docker-for-debugging)
    - [寻求帮助](#ask-helps)

## 最佳实践

通过最佳实践，很多问题能被更早的发现，一些棘手的问题也能被更容易的解决。

### 在本机修复问题

远程诊断问题较困难，因此要考虑尽量在本机修复问题，而不是在远程服务器上就开始调研。

- 如果远程环境中发生了错误，首先要尝试在本地复现，然后再试着修复它。 这可能会在复现上花更多的时间，但大多数情况下，修复会更容易。
- 最大限度减少本地和远程代码逻辑的差异。 这样更多的逻辑问题能在本机找到。
- 某些问题可能是因为远程和本地环境的不同而造成的，因此无法在本地重现。 这时要尝试缩小发生问题的范围。 例如，用非常小的代码片段来重现问题。

### 编写易于理解的日志

在本地开发时，调试非常有用，但远程调试却很困难，而在生产环境中几乎无法进行调试。 日志可提供大量的信息，而且适用于各种环境。

要提高日志质量：

1. 更多的使用日志。 在开发阶段，更多的查看日志，避免调试或一次性的打印输出。 如果日志还没有足够的信息，就需要进一步改进。
2. 减少重复的日志。 重复的日志很容易将有用的信息掩盖住。 因此，重复的日志应该合并，或者完全禁用。
3. 不仅打印变量，还要讲故事。 查看日志的人可能永远不会看代码，或者已经忘记了代码逻辑。 除了打印变量值以外，日志还要解释变量在业务逻辑中的意义。 例如，日志应该说明为什么这个值被认为时异常值，它有多重要，如何修复。
4. 将相关日志关联起来。 在并行的情况下，并发线程、进程或服务都会同时保存日志。 需要用一个上下文的 ID 将日志关联起来。 如果是分布式的服务，还需要考虑时间的同步。
5. 什么应该在日志中？ 上文已经部分回答了这个问题。 如果某个内容对诊断问题，进一步分析有帮助，那就应该记录下来。 例如，完整的错误栈等等。

### 使用本机模拟机验证 Job

一些问题可能只在运行 OpenPAI Job 的时候才会发生，所以代码可能在本机能很好的运行，但在 Job 中却会失败。 使用本机模拟器，就能在本机找到更多环境相关的问题。

OpenPAI Visual Studio Code Client 可以解析 OpenPAI Job 配置文件，并在本机的 Docker 容器中运行 Job。 这样的模拟可以找到很多与配置相关的问题，比如 Docker 映像和代码中需要的依赖不相匹配，命令行写错了，环境变量等等。

虽然这样的模拟能覆盖大部分远程运行的情况，但仍然有其局限。 例如，配置文件中的资源请求数量会被忽略掉，因为本机通常不会像远端 GPU 服务器那样强大。 在本地模拟运行代码时，可能会非常慢，或者内存不够。 这时候，需要修改一下代码或命令行来避免这类问题，并减少训练时间来更快的发现更多问题。

在使用模拟器之前，需要先安装 [Docker](https://www.docker.com/get-started)。 参考如何[安装 Visual Studio Code Client](../../../contrib/pai_vscode/VSCodeExt_zh_CN.md) 以及[运行模拟 Job](../../../contrib/pai_vscode/README_zh_CN.md#本机模拟)。

注意，由于 Docker 在 Windows上不支持 GPU，因此在本机模拟时 TensorFlow 需要使用 CPU 版本的 Docker 映像。

### 充分了解资源瓶颈

To use OpenPAI, user needs to specify resource specification, including CPU, GPU and memory. If requested resource is low, the job may be much slower than expected or out of memory. But if a job is assigned too much resource, it's waste also. So, to be aware and understand bottleneck is important.

OpenPAI provides metrics of CPU, memory, and GPU, and it can be used to understand runtime consumption of resource. Learn [how to view job metrics](#how-to-view-job-metrics) for details.

## Diagnostic issues

### Job is waiting for hours

In general, jobs of OpenPAI stays in waiting status less than 1 minute. But if there is not enough resource, a job may stay in waiting status longer. When other jobs complete, waiting jobs have a chance getting resource.

One way to reduce waiting time, is to reduce requested resources.

Note, there may display more free resources in the dashboard of web portal, but resources are distributed on different servers, so server may not meet all resources requirements including CPU, memory, and GPU.

![waiting](imgs/web_job_list_waiting.png)

### Job is running and retried many times

If a job fails by system reasons, OpenPAI will try to run the job again, for example, system is upgraded during job running. If a job retries many times and not this case, administrators of OpenPAI may needs to check what happens.

![retry](imgs/web_job_detail_retry.png)

### Job runs slowly

The running speed of job is subjective, so it needs data to measure, before trying to 'fix' something. Below are several reasons that may make job slowly in OpenPAI.

1. GPU is not used. Some frameworks, like TensorFlow, need to install GPU edition to enable GPU computing. In most case, the log of framework shows if GPU is in use. Some frameworks, like PyTorch, need to write code explicitly to use GPU. Learn [how to check job log](#how-to-check-job-log) to confirm it in log.

2. Resource bottleneck. Computing resource is not only the potential bottleneck, sometime IO and memory capacity are also bottleneck. Metrics can be used to analyze bottleneck. Refer to [how to view job metrics](#how-to-view-job-metrics) for more information.

### Job is failed

Job failures can be caused by many reasons. In general, it can be categorized to two types due to it happens in different phases.

1. **Failures before running**, for example requested resources exceeded capacity. If a job requests resources over what the cluster can provide, the job fails soon. For example, if the cluster has only 24 cores of CPU, but user requests 48 cores in a job configuration, it causes job failure.
  
  For this kind of system failures, the error type is *System Error*.
  
  ![over requested 1](imgs/web_job_details_over1.png)
  
  Click *application summary* can see error details as below. It explains which resource is exceeded.
  
  ![over requested 1](imgs/web_job_details_over2.png)

2. **Failures during job running**. If the error type is *User Error*, stdout and stderr provide details of failure. Learn [how to check job log](#how-to-check-job-log) to get failure details.
  
  Note, OpenPAI determines job success or not by returned exit code of task instance. The exit code is from command in job configuration usually, which is written by user, but it may be caused by OpenPAI occasionally.
  
  The error code depends on the failed command, though there is [a document of exit codes](http://www.tldp.org/LDP/abs/html/exitcodes.html) in Linux.
  
  ![job user error](imgs/web_job_details_exitcode.png)

## Guideline

### How to view job metrics

- Click *Go to Job Metrics Page* in job details page.

![job link](imgs/web_job_details_metrics.png)

- A new page is opened and show metrics of this job.

![job link](imgs/web_job_metrics.png)

- The *memory usage*, and *disk bandwidth* uses absolute value. It's easy to understand.
- *network traffic* shouldn't be regarded as an accurate value, as the collection approach is optimized for performance. If a data connection is alive for a short time, it may not be counted.
- 100% of *CPU*, it means 100% usage of one virtual core. So, the value may be more than 100%. For example, 300% means 3 virtual cores are occupied fully.
- *GPU Utilization* and *GPU memory* are total number, so it's different with *CPU*. For example, if 4 GPU cards are assigned to an environment, 50% usage means 2 GPU cards are used.
- For distributed jobs, the value is average of all task instances. If a task role has multiple instances, it's average also.

The UI is implemented by [Grafana](https://grafana.com/), check its web site for more details.

### How to check job log

- Click *stdout* or *stderr* in job details page.
  
  ![job link](imgs/web_job_details_loglink.png)

- It shows log content like below and contains latest 4096 bytes. It refreshes every 10 seconds automatically.
  
  If it needs to view full log, click button *View Full Log*.
  
  ![job link](imgs/web_job_details_logview.png)
  
  The *stderr* and *stdout* is screen output of the task instance. All content, which prints to screen, displays there near real-time. Most errors during job running can be found in the two files.

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

To reserve failed docker for debugging, it needs to set the following property in the jobEnv field. If the job is failed by user's command, the container is kept for 1 week by default. The period may be configured by administrators. If the job is success, the container won't be reserved.

![debugging](./imgs/webportal-job-debugging.png)

Refer to [here](../job_tutorial.md) to enable isDebug in job configuration file.

**Note**, with debugging is enabled for a job, the resource of this job is reserved also. To save resources for other jobs, this feature should be limited used, and shouldn't be enabled by default. And once debug is completed, the job should be stopped manually to release resources.

### Ask helps

Administrators of the OpenPAI cluster may be able to fix issues if this guidance doesn't work unfortunately.

如果管理员无法修复此问题，或者你就是管理员，欢迎[提交问题或建议](../../../README_zh_CN.md#寻求帮助)。