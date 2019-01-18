# kube-runtime

This project aims provide pai similar runtime environment to [frameworkcontroller](https://github.com/Microsoft/frameworkcontroller).

It has two components: `rest-lit` & `kube-runtime`. The `rest-lit` is a server accepting pai jobs, and will translate job spec into a format frameworkcontroller can recognize. kube-runtime is a runtime system serve as default pai runtime for frameworkcontroller.

These two components will provide following environment variables to jobs:

| Environment Variable Name          | Description                              |
| :--------------------------------- | :--------------------------------------- |
| `PAI_JOB_NAME`                     | The name of job this task belongs to     |
| `PAI_DEFAULT_FS_URI`               | Cluster specific variable, usually `hdfs://ip`|
| `PAI_TASK_ROLE_COUNT`              | How many task roles this job has         |
| `PAI_TASK_ROLE_LIST`               | Comma separated role name                |
| `PAI_TASK_ROLE_TASK_COUNT_$role`   | How many task this take role has         |
| `PAI_PORT_LIST_$role_$taskIdx_$portLabel` | comma separated port labeled as `$portLabel` requested by `$role`:`$taskIdx` |
| `PAI_HOST_IP_$role_$taskIdx`       | Host IP of task `$role`:`$taskIdx`       |
| `PAI_RESOURCE_$role`               | Resource requirement for the task role in `cpu_count:xxx,memMB:xxx,shmMB:xxx,gpu_count:xxx` format |
| `PAI_MIN_FAILED_INSTANCE_$role`    | taskRole.minFailedTaskCount value        |
| `PAI_MIN_SUCCEEDED_INSTANCE_$role` | taskRole.minSucceededTaskCount value     |
| `PAI_CURRENT_TASK_ROLE_NAME`       | role name of current task                |
| `PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX` | task index of current task       |

# Example jobs

## Pytorch mnist

```json
{
  "jobName": "pytorch-mnist",
  "image": "openpai/pai.example.pytorch",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "command": "cd examples/mnist && python main.py",
      "env": {"PAI_SSH_PUB_KEY": "xxxx"}
    }
  ]
}
```

## Distributed tensorflow

```json
{
  "jobName": "tfDemo",
  "image": "xudifsd/tf-example",

  "taskRoles": [
    {
      "name": "ps",
      "taskNumber": 2,
      "cpuNumber": 2,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "portList": [{
          "label": "main",
          "beginAt": 0,
          "portNumber": 1
      }],
      "command": "python /example/mnist_replica.py --job_name=ps --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX --ps_hosts=$PAI_HOST_IP_ps_0:$PAI_PORT_LIST_ps_0_main,$PAI_HOST_IP_ps_1:$PAI_PORT_LIST_ps_1_main --worker_hosts=$PAI_HOST_IP_worker_0:$PAI_PORT_LIST_worker_0_main,$PAI_HOST_IP_worker_1:$PAI_PORT_LIST_worker_1_main"
    },
    {
      "name": "worker",
      "taskNumber": 2,
      "cpuNumber": 2,
      "memoryMB": 16384,
      "gpuNumber": 4,
      "portList": [{
          "label": "main",
          "beginAt": 0,
          "portNumber": 1
      }],
      "command": "python /example/mnist_replica.py --job_name=worker --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX --ps_hosts=$PAI_HOST_IP_ps_0:$PAI_PORT_LIST_ps_0_main,$PAI_HOST_IP_ps_1:$PAI_PORT_LIST_ps_1_main --worker_hosts=$PAI_HOST_IP_worker_0:$PAI_PORT_LIST_worker_0_main,$PAI_HOST_IP_worker_1:$PAI_PORT_LIST_worker_1_main",
      "minSucceededTaskCount": 2
    }
  ],
  "retryCount": 0
}
```

Here is the Dockerfile used to build `xudifsd/tf-example` image:
```
From tensorflow/tensorflow:latest-gpu

WORKDIR /example

RUN apt-get update && \
        apt-get install -y wget && \
        wget https://raw.githubusercontent.com/tensorflow/tensorflow/master/tensorflow/tools/dist_test/python/mnist_replica.py
```
