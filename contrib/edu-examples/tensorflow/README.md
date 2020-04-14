This folder includes some configuration examples for submmitting jobs to OPEN PAI platform. 

Here we provides 4 examples, the examples use VGG16 model on the CIFAR-10 task, trained with 
- Single CPU: cifar10_vgg16_tf_cpu.yaml
- Single GPU (Tesla K80): cifar10_vgg16_tf_gpu.yaml
- 4 GPU (with tensorflow native distributed training): cifar10_vgg16_tf_gpu.yaml
- 4 GPU (with horovod): cifar10_vgg16_tf_gpu.yaml 

The performance of the tasks with different hyper-parameters (batch-size) are shown in the table below:

With batch-size=32:
|  mode | accuracy | run time | job level metrics |
| ------------- | ------------- | ------------- | ------------- |
| single CPU  | 97.29% | 5h 3m | [link](https://github.com/microsoft/pai/bolb/pai-for-edu/contrib/edu-examples/tensorflow/metrics/1cpu_32.png) |
| Single GPU  | 97.44% | 48m | [link](https://github.com/microsoft/pai/bolb/pai-for-edu/contrib/edu-examples/tensorflow/metrics/1gpu_32.png) |
| 4 GPU (with tensorflow distributed training) | 96.17% | 52m | [link](https://github.com/microsoft/pai/bolb/pai-for-edu/contrib/edu-examples/tensorflow/metrics/4gpu_distributed_32.png) |
| 4 GPU (with horovod) | 97.28% | 1h 3m | [link](https://github.com/microsoft/pai/bolb/pai-for-edu/contrib/edu-examples/tensorflow/metrics/4gpu_horovod_32.png) |

With batch-size=256:
|  mode | accuracy | run time | job level metrics |
| ------------- | ------------- | ------------- | ------------- |
| Single CPU  | 95.62% | 5h 15m | [link](https://github.com/microsoft/pai/bolb/pai-for-edu/contrib/edu-examples/tensorflow/metrics/1cpu_256.png) |
| Single GPU  | 95.57% | 42m | [link](https://github.com/microsoft/pai/bolb/pai-for-edu/contrib/edu-examples/tensorflow/metrics/1gpu_256.png) |
| 4 GPU (with tensorflow distributed training) | 93.99% | 24m | [link](https://github.com/microsoft/pai/bolb/pai-for-edu/contrib/edu-examples/tensorflow/metrics/4gpu_distributed_256.png) |
| 4 GPU (with horovod) | 90.00% | 28m | [link](https://github.com/microsoft/pai/bolb/pai-for-edu/contrib/edu-examples/tensorflow/metrics/4gpu_horovod_256.png) |
