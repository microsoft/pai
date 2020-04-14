This folder includes some configuration examples for submmitting jobs to OpenPAI platform. 

Here we provides 4 examples. The examples use VGG16 model on the CIFAR-10 task, trained with 
- 4 CPU (Intel(R) Xeon(R) CPU E5-2690 v3): cifar10_vgg16_tf_cpu.yaml
- 1 GPU (Tesla K80): cifar10_vgg16_tf_gpu.yaml
- 4 GPU (with tensorflow native distributed training): cifar10_vgg16_tf_gpu.yaml
- 4 GPU (with horovod): cifar10_vgg16_tf_gpu.yaml 

The performance of the tasks with different hyper-parameters (batch-size) are shown in the table below:

With batch-size=32:
|  Mode | Accuracy | Run Time | Job Level Metrics |
| ------------- | ------------- | ------------- | ------------- |
| 4 CPU  | 97.29% | 5h 3m | [Details](./metrics/4cpu_32.png) |
| 1 GPU  | 97.44% | 48m | [Details](./metrics/1gpu_32.png) |
| 4 GPU (with tensorflow distributed training) | 96.17% | 52m | [Details](./metrics/4gpu_distributed_32.png) |
| 4 GPU (with horovod) | 97.28% | 1h 3m | [Details](./metrics/4gpu_horovod_32.png) |

With batch-size=256:
|  Mode | Accuracy | Run Time | Job Level Metrics |
| ------------- | ------------- | ------------- | ------------- |
| 4 CPU  | 95.62% | 5h 15m | [Details](./metrics/4cpu_256.png) |
| 1 GPU  | 95.57% | 42m | [Details](./metrics/1gpu_256.png) |
| 4 GPU (with tensorflow distributed training) | 93.99% | 24m | [Details](./metrics/4gpu_distributed_256.png) |
| 4 GPU (with horovod) | 90.00% | 28m | [Details](./metrics/4gpu_horovod_256.png) |
