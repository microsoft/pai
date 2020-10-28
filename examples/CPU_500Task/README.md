# Examples for OpenPAI (500Task)
Here we provide a CPU-only job with 500 tasks on a taskrole. The example use ConvNet model on the MNIST task. We look for the optimal learning rate in the range from 0.0001 to 0.9981(Take 500 values at equal intervals). 

## Experiment Results
| Network | Hardware | Time |GPU & CPU Utilization | Accuracy (Some Examples) | Yaml Example|
| :----:| :----: | :----: | :----: | :----: | :----: |
| ConvNet | CPU | 6h30m10s (500*5 epoch) | [Details](metrics/ConvNet_CPU_500Task.JPG) | 95.15% (lr: 0.0101)  98.53% (lr: 0.1001)  98.95% (lr: 0.9981)| [CPU_500Task_MNIST.yaml](yaml/CPU_500Task_MNIST.yaml) |

## Usage
To quickly submit a training job to the OpenPAI cluster, users can directly submit the corresponding yaml file as mentioned above (in the yaml folder). 