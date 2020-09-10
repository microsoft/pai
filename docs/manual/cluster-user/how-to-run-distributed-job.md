## How OpenPAI Deploy Distributed Jobs
### Taskrole and Instance
When we execute distributed programs on PAI, we can add different task roles for our job. For single server jobs, there is only one task role. For distributed jobs, there may be multiple task roles. For example, when TensorFlow is used to running distributed jobs, it has two roles, including the parameter server and the worker. In distributed jobs, each role may have one or more instances. For example, if it's 8 instances in a worker role of TensorFlow. It means there should be 8 Docker containers for the worker role. Please visit [here](./how-to-use-advanced-job-settings.md#multiple-task-roles) for specific operations.

### Environmental variables
In a distributed job, one task might communicate with others (When we say task, we mean a single instance of a task role). So a task need to be aware of other tasks' runtime information such as IP, port, etc. The system exposes such runtime information as environment variables to each task's Docker container. For mutual communication, users can write code in the container to access those runtime environment variables. Please visit [here](./how-to-use-advanced-job-settings.md#environmental-variables-and-port-reservation) for specific operations.

### Retry policy and Completion policy
If unknown error happens, PAI will retry the job according to user settings. To set a retry policy and completion policy for user's job，PAI asks user to switch to Advanced mode.  Please visit [here](./how-to-use-advanced-job-settings.md#job-exit-spec-retry-policy-and-completion-policy) for specific operations.
### Run PyTorch Distributed Jobs in OpenPAI
Example Name | Multi-GPU | Multi-Node | Backend |Apex| Job protocol |
---|---|---|---|---|---| 
Single-Node DataParallel CIFAR-10 | ✓| x | -|-| [cifar10-single-node-gpus-cpu-DP.yaml](https://github.com/microsoft/pai/tree/master/examples/Distributed-example/cifar10-single-node-gpus-cpu-DP.yaml)|
cifar10-single-mul-DDP-gloo.yaml | ✓|  ✓ | gloo|-| [cifar10-single-mul-DDP-gloo.yaml](https://github.com/microsoft/pai/tree/master/examples/Distributed-example/cifar10-single-mul-DDP-gloo.yaml)|
cifar10-single-mul-DDP-nccl | ✓| ✓ |nccl|-| [cifar10-single-mul-DDP-nccl.yaml](https://github.com/microsoft/pai/tree/master/examples/Distributed-example/cifar10-single-mul-DDP-nccl.yaml)|
cifar10-single-mul-DDP-gloo-Apex-mixed | ✓|  ✓ | gloo|✓ | [cifar10-single-mul-DDP-gloo-Apex-mixed.yaml](https://github.com/microsoft/pai/tree/master/examples/Distributed-example/cifar10-single-mul-DDP-gloo-Apex-mixed.yaml)|
cifar10-single-mul-DDP-nccl-Apex-mixed | ✓|  ✓ | nccl|  ✓ | [cifar10-single-mul-DDP-gloo-Apex-mixed.yaml](https://github.com/microsoft/pai/tree/master/examples/Distributed-example/cifar10-single-mul-DDP-gloo-Apex-mixed.yaml)|
imagenet-single-mul-DDP-gloo | ✓|  ✓| gloo|-| [imagenet-single-mul-DDP-gloo.yaml](https://github.com/microsoft/pai/tree/master/examples/Distributed-example/Lite-imagenet-single-mul-DDP-gloo.yaml)|

## DataParallel
The single node program is simple. The program executed in PAI is exactly the same as the program in our machine. It should be noted that an Worker can be applied in PAI and a Instance can be applied in Worker. In a worker, we can apply for GPUs that we need. We provide an [example](../../../examples/Distributed-example/cifar10-single-node-gpus-cpu-DP.py) of DP.

## DistributedDataParallel
DDP requires users set a master node ip and port for synchronization in PyTorch. For the port, you can simply set one certain port, such as `5000` as your master port. However, this port may conflict with others. To prevent port conflict, you can reserve a port in OpenPAI, as we mentioned [here](./how-to-use-advanced-job-settings.md#environmental-variables-and-port-reservation). The port you reserved is available in environmental variables like `PAI_PORT_LIST_$taskRole_$taskIndex_$portLabel`, where `$taskIndex` means the instance index of that task role. For example, if your task role name is `work` and port label is `SyncPort`, you can add the following code in your PyTorch DDP program:

```
os.environ['MASTER_ADDR'] = os.environ['PAI_HOST_IP_worker_0']
os.environ['MASTER_PORT'] = os.environ['PAI_worker_0_SynPort_PORT']
```
If you are using `gloo` as your DDP communication backend, please set correct network interface such as `export GLOO_SOCKET_IFNAME=eth0`.


We provide examples with [gloo](https://github.com/microsoft/pai/tree/master/examples/Distributed-example/cifar10-single-mul-DDP-gloo.yaml) and [nccl](https://github.com/microsoft/pai/tree/master/examples/Distributed-example/cifar10-single-mul-DDP-nccl.yaml) as backend.

