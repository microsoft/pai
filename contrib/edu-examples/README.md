This folder provides the examples of submmitting jobs to OPEN PAI platform. 

The examples use VGG16 model on the CIFAR-10 task, trained with 
- Single CPU
- Single GPU (Tesla K80)
- 4 GPU (with tensorflow distributed training)
- 4 GPU (with horovod)

### TODO: record performance 
The performance of the tasks are shown in the table below:

|  mode | accuracy | run time |
| ------------- | ------------- | ------------- |
| single CPU  | --% | 3h ++ |
| Single GPU  | 95.35% | 48m 3s |
| 4 GPU (with tensorflow distributed training) | 94.10% | 50m 4s |
| 4 GPU (with horovod) | 89.99% | 1h 53m 54s|

The job level metrics is shown in 

![1GPU](metrics/1gpu.png)

![4GPU](metrics/4gpu_distributed.png)
