This folder provides the examples of submmitting jobs to OPEN PAI platform. 
The examples used VGG16 on the VIFAR-10 task, trained with 
- Single CPU
- Single GPU
- 4 GPU (with tensorflow distributed training)
- 4 GPU (with horovod)

### TODO: record performance 
The performance of the tasks are shown in the table below:

|  mode | accuracy | run time |
| ------------- | ------------- | ------------- |
| single CPU  | 97.00% | 1h |
| Single GPU  | 97.00% | 1h |
| 4 GPU (with tensorflow distributed training) | 97.00% | 1h |
| 4 GPU (with horovod) | 97.00% | 1h |

