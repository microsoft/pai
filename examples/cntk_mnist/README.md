# Examples for OpenPAI (CNTK)
Here we provides 1 example. The example use ConvNet model on the MNIST task.

## Experiment Results
| Network | Hardware | Time |GPU & CPU Utilization | Accuracy (Avg of 3 runs) | Yaml Example|
| :----:| :----: | :----: | :----: | :----: | :----: |
| ConvNet | K80 * 1 | 4m35s(40 epoch) | [Details](metrics/ConvNet_1gpu.JPG) | 99.41% | [ConvNet_gpu1.yaml](yaml/ConvNet_gpu1.yaml) |

To quickly submit a training job to the OpenPAI cluster, users can directly submit the corresponding yaml file as mentioned above (in the yaml folder).