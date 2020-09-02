# How OpenPAI Models Distributed Jobs
## Taskrole and Instance
When we execute distributed programs on PAI, we can add different task roles for our job. For single server jobs, there is only one task role. For distributed jobs, there may be multiple task roles. For example, when TensorFlow is used to running distributed jobs, it has two roles, including the parameter server and the worker. In distributed jobs, it depends on how many instances are needed for a task role. For example, if it's 8 in a worker role of TensorFlow. It means there should be 8 Docker containers for the worker role.[Please visit this link for operations.](https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-use-advanced-job-settings.html#multiple-task-roles)

## Environmental variables
In a distributed job, one task might communicate with others (When we say task, we mean a single instance of a task role). So a task need to be aware of other tasks' runtime information such as IP, port, etc. The system exposes such runtime information as environment variables to each task's Docker container. For mutual communication, users can write code in the container to access those runtime environment variables.[Please visit this link for operations.](https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-use-advanced-job-settings.html#environmental-variables-and-port-reservation)

## Retry policy and Completion policy;
If unknown error happens, PAI will retry the job according to user settings. To set a retry policy and completion policy for your job.
[Please visit this link for operations.](https://openpai.readthedocs.io/en/latest/manual/cluster-user/how-to-use-advanced-job-settings.html#job-exit-spec-retry-policy-and-completion-policy)
## Run PyTorch Distributed Jobs in OpenPAI

Example Name | Multi-GPU | Multi-Node | Backend |Apex| Job protocol |
---|---|---|---|---|---| 
Single-Node DataParallel CIFAR-10 | ✓| x | -|-| [cifar10-single-node-gpus-cpu-DP.yaml](https://github.com/vvfreesoul/pai/blob/master/examples/Yaml/cifar10-single-node-gpus-cpu-DP.yaml)|
cifar10-single-mul-DDP-gloo.yaml | ✓|  ✓ | gloo|-| [cifar10-single-mul-DDP-gloo.yaml](https://github.com/vvfreesoul/pai/blob/master/examples/Yaml/cifar10-single-mul-DDP-gloo.yaml)|
cifar10-single-mul-DDP-nccl | ✓| ✓ |nccl|-| [cifar10-single-mul-DDP-nccl.yaml](https://github.com/vvfreesoul/pai/blob/master/examples/Yaml/cifar10-single-mul-DDP-nccl.yaml)|
cifar10-single-mul-DDP-gloo-Apex-mixed | ✓|  ✓ | gloo|✓ | [cifar10-single-mul-DDP-gloo-Apex-mixed.yaml](https://github.com/vvfreesoul/pai/blob/master/examples/Yaml/cifar10-single-mul-DDP-gloo-Apex-mixed.yaml)|
cifar10-single-mul-DDP-nccl-Apex-mixed | ✓|  ✓ | nccl|  ✓ | [cifar10-single-mul-DDP-gloo-Apex-mixed.yaml](https://github.com/vvfreesoul/pai/blob/master/examples/Yaml/cifar10-single-mul-DDP-gloo-Apex-mixed.yaml)|
imagenet-single-mul-DDP-gloo | ✓|  ✓| gl00|-| [imagenet-single-mul-DDP-gloo.yaml](https://github.com/vvfreesoul/pai/blob/master/examples/Yaml/Lite-imagenet-single-mul-DDP-gloo.yaml)|

## DataParallel
The single node program is simple. The program executed in PAI is exactly the same as the program in our machine. It should be noted that an Worker can be applied in PAI and a Instance can be applied in Worker. In a worker, we can apply for GPUs that we need.  [So let's give an example of DP here.]()

## DistributedDataParallel
Of course, running distributed programs, we can also use DDP, which is a little more complex than DP programs. When we need to use DDP, we need to consider the IP and Port of the master node, and ensure that all nodes can access the same host port for process synchronization. In Pai, we can apply for a Port dedicated for multi process synchronization in the job submission interface. The reason for this is that we try our best to avoid the occupation of our distributed programs that have been allocated to the Port for other tasks. Of course, we also need wordd-size in the DDP program, which represents the total number of our processes. In Pai, we can also get it by reading environment variables. If we want to implement DDP on multiple nodes, we can apply for an Worker and then apply for multiple Instances to correspond to multiple nodes. If we want to run DDP on a single node, we only need to apply for an Instance and a Worker.The specific code for reading environment variables in Pai is as follows:
1. os.environ['MASTER_ADDR'] = os.environ['PAI_HOST_IP_worker_0']
2. os.environ['MASTER_PORT'] = os.environ['PAI_worker_0_SynPort_PORT']

DDP communication back-end using GLOO, you need to add a command in yaml file, otherwise there will be communication errors.We must add export GLOO_SOCKET_IFNAME=eth0 for GLOO.

[So let's give an example of DDP(ncck) here.]()

[So let's give an example of DDP(gloo) here.]()

