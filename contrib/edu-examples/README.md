This folder provides some examples for submmitting jobs to OPEN PAI platform. 

The examples use VGG16 model on the CIFAR-10 task, trained with 
- Single CPU
- Single GPU (Tesla K80)
- 4 GPU (with tensorflow native distributed training)
- 4 GPU (with horovod)

The performance of the tasks with different hyper parameters (batch-size) are shown in the table below:


With batch-size=32:
|  mode | accuracy | run time | job level metrics |
| ------------- | ------------- | ------------- | ------------- |
| single CPU  | 97.29% | 5h 3m | [link](https://github.com/suiguoxin/pai/blob/edu-examples/contrib/edu-examples/metrics/1cpu_32.png) |
| Single GPU  | 97.44% | 48m | [link](https://github.com/suiguoxin/pai/blob/edu-examples/contrib/edu-examples/metrics/1gpu_32.png) |
| 4 GPU (with tensorflow distributed training) | 96.17% | 52m | [link](https://github.com/suiguoxin/pai/blob/edu-examples/contrib/edu-examples/metrics/4gpu_distributed_32.png) |
| 4 GPU (with horovod) | 97.28% | 1h 3m | [link](https://github.com/suiguoxin/pai/blob/edu-examples/contrib/edu-examples/metrics/4gpu_horovod_32.png) |

With batch-size=256:
|  mode | accuracy | run time | job level metrics |
| ------------- | ------------- | ------------- | ------------- |
| Single CPU  | 93.99% | 5h | [link](https://github.com/suiguoxin/pai/blob/edu-examples/contrib/edu-examples/metrics/1cpu_256.png) |
| Single GPU  | 93.99% | 42m | [link](https://github.com/suiguoxin/pai/blob/edu-examples/contrib/edu-examples/metrics/1gpu_256.png) |
| 4 GPU (with tensorflow distributed training) | 93.99% | 24m | [link](https://github.com/suiguoxin/pai/blob/edu-examples/contrib/edu-examples/metrics/4gpu_distributed_256.png) |
| 4 GPU (with horovod) | 90.00% | 28m | [link](https://github.com/suiguoxin/pai/blob/edu-examples/contrib/edu-examples/metrics/4gpu_horovod_256.png) |
