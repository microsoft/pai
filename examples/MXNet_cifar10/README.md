# Examples for OpenPAI (MXNet)
Here we provides 1 example. The example use Resnet20 model on the CIFAR-10 task.

## Experiment Results
| Network | Hardware | Time |GPU & CPU Utilization | Accuracy (Avg of 3 runs) | Yaml Example|
| :----:| :----: | :----: | :----: | :----: | :----: |
| Resnet20 | K80 * 1 | 1h33m(240 epoch) | [Details](metrics/Resnet20_1gpu.JPG) | 91.6% | [cifar10_resnet20_1gpu.yaml](yaml/cifar10_resnet20_1gpu.yaml) |

## More Details
To quickly submit a training job to the OpenPAI cluster, users can directly submit the corresponding yaml file as mentioned above (in the yaml folder). 
The detailed explanation of the code is in [Tutorials](https://cv.gluon.ai/build/examples_classification/demo_cifar10.html).

