# Examples for OpenPAI (Pytorch)
This project provides the examples to run on the [OpenPAI](https://github.com/microsoft/pai). The sample program supports CPU, GPU, multiple GPU, [Horovod](https://github.com/horovod/horovod) modes to train a classification model for cifar10. Through this project, users can quickly and easily run an OpenPAI instance, which can be used to learn and understand the OpenPAI, or test the performance of the OpenPAI.

## Experiment Results
| Network | Hardware | Time |GPU & CPU Utilization | Accuracy (Avg of 3 runs) | Yaml Example|
| :----:| :----: | :----: | :----: | :----: | :----: |
| Resnet18 | V100 * 1 | 59m(200 epoch) | [Details](metrics/Resnet18_1gpu.jpg) | 95.2% | [Resnet18_1gpu.yaml](yaml/Resnet18_1gpu.yaml) |
| Resnet18 | V100 * 4 | 30m(200 epoch) | [Details](metrics/Resnet18_4gpus.jpg) | 94.9% | [Resnet18_4gpu.yaml](yaml/Resnet18_4gpu.yaml) |
| Resnet18 | Xeon E5 CPU  * 12| 21h 33m(200 epoch) | [Details](metrics/Resnet18_12cpu.jpg) | 95.15% | [Resnet18_12cpu.yaml](yaml/Resnet18_12cpu.yaml)
| Resnet18 | V100 * 4(Horovod) | 23m(200 epoch) | [Details](metrics/Resnet18_horovod.jpg) | 93.6% | [Restnet18_horovod.yaml](yaml/Resnet18_horovod.yaml)

## Usage
To quickly submit a CPU/GPU/Horovod training job to the OpenPAI cluster, users can directly submit the corresponding yaml file as mentioned above (in the yaml folder). However, we cannot show all possible resource allocations and networks in the example yaml files. Therefore, users can customize the training jobs accoding to the following two steps.


Step-1: 

First of all, user should run 'init.sh' to download the models designed for cifar10 ([pytorch-cifar](https://github.com/kuangliu/pytorch-cifar)) before starting training. The models in torchvison.models are designed for Imagenet, and pytorch-cifar implements several vision classification network for cifar10.

Step-2:

To run the training task on cpu:
```
python cifar.py --arch ResNet18 --cpu
```

To run the training task on one single gpu:
```
python cifar.py --arch ResNet18 --gpuid 0
```

To run the training task on 4 gpus (Dataparallel):
```
python cifar.py --arch ResNet18 --gpuid 0,1,2,3
```

To run the training task on 4 gpus by Horovod:
```
horovodrun -np 4 python horovod_cifar.py --arch ResNet18
```

