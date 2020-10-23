# Docker镜像和任务示例

OpenPAI使用[Docker](https://www.docker.com/why-docker)提供一致且独立的环境。利用Docker，OpenPAI可以在同一服务器上处理多个任务请求。任务环境很大程度上依赖您选择的Docker镜像。

## 预构建的Docker镜像介绍

[快速开始](./快速开始.md) 教程使用一个预构建的TensorFlow镜像，`openpai/standard:python_3.6-tensorflow_1.15.0-gpu`。除此之外，OpenPAI还为不同的深度学习框架提供了许多现成的镜像。以下是镜像列表：

|       镜像      |                标签               | CUDA 版本 | 所需驱动版本 |
|:----------------:|:--------------------------------:|:------------:|:-----------------------:|
| openpai/standard |   python_3.6-pytorch_1.1.0-gpu   |     10.0     |        >= 410.48        |
| openpai/standard |   python_3.6-pytorch_1.2.0-gpu   |     10.0     |        >= 410.48        |
| openpai/standard |   python_3.6-pytorch_1.3.1-gpu   |     10.1     |        >= 418.39        |
| openpai/standard |   python_3.6-pytorch_1.4.0-gpu   |     10.1     |        >= 418.39        |
| openpai/standard | python_3.6-tensorflow_1.14.0-gpu |     10.0     |        >= 410.48        |
| openpai/standard | python_3.6-tensorflow_1.15.0-gpu |     10.0     |        >= 410.48        |
| openpai/standard |  python_3.6-tensorflow_2.0.0-gpu |     10.0     |        >= 410.48        |
| openpai/standard |  python_3.6-tensorflow_2.1.0-gpu |     10.1     |        >= 418.39        |
| openpai/standard |    python_3.6-mxnet_1.5.1-gpu    |     10.1     |        >= 418.39        |
| openpai/standard |      python_3.6-cntk_2.7-gpu     |     10.1     |        >= 418.39        |
| openpai/standard |   python_3.6-pytorch_1.1.0-cpu   |       -      |            -            |
| openpai/standard |   python_3.6-pytorch_1.2.0-cpu   |       -      |            -            |
| openpai/standard |   python_3.6-pytorch_1.3.1-cpu   |       -      |            -            |
| openpai/standard |   python_3.6-pytorch_1.4.0-cpu   |       -      |            -            |
| openpai/standard | python_3.6-tensorflow_1.14.0-cpu |       -      |            -            |
| openpai/standard | python_3.6-tensorflow_1.15.0-cpu |       -      |            -            |
| openpai/standard |  python_3.6-tensorflow_2.0.0-cpu |       -      |            -            |
| openpai/standard |  python_3.6-tensorflow_2.1.0-cpu |       -      |            -            |
| openpai/standard |    python_3.6-mxnet_1.5.1-cpu    |       -      |            -            |
| openpai/standard |      python_3.6-cntk_2.7-cpu     |       -      |            -            |

这些镜像的标签指示了内置深度学习框架的版本以及是否支持GPU。由于CUDA的需求，一些支持GPU的docker需要高版本的NVIDIA驱动。如果不确定集群的NVIDIA驱动版本，请询问管理员。

## 建立在预构建Docker镜像基础上的任务示例

[pytorch_cifar10](https://github.com/microsoft/pai/tree/pai-for-edu/contrib/edu-examples/pytorch_cifar10) 和 [tensorflow_cifar10](https://github.com/microsoft/pai/blob/pai-for-edu/contrib/edu-examples/tensorflow_cifar10) 提供了基于这些预构建镜像的CIFAR-10训练示例。具体来说，以下是基于PyTorch镜像的示例：

  - [Resnet18_1gpu.yaml](https://github.com/microsoft/pai/blob/pai-for-edu/contrib/edu-examples/pytorch_cifar10/yaml/Resnet18_1gpu.yaml): 使用PyTorch、单个GPU的CIFAR-10训练
  - [Resnet18_12cpu.yaml](https://github.com/microsoft/pai/blob/pai-for-edu/contrib/edu-examples/pytorch_cifar10/yaml/Resnet18_12cpu.yaml): 使用PyTorch、多个CPU的CIFAR-10训练
  - [Resnet18_4gpu.yaml](https://github.com/microsoft/pai/blob/pai-for-edu/contrib/edu-examples/pytorch_cifar10/yaml/Resnet18_4gpu.yaml): 使用PyTorch、多个GPU的CIFAR-10训练
  - [Restnet18_horovod.yaml](https://github.com/microsoft/pai/blob/pai-for-edu/contrib/edu-examples/pytorch_cifar10/yaml/Resnet18_horovod.yaml): 使用PyTorch、Horovod和多个GPU的CIFAR-10训练

还有TensorFlow的CPU/GPU/多GPU/Horovod任务示例。详细信息请查看[tensorflow_cifar10](https://github.com/microsoft/pai/blob/pai-for-edu/contrib/edu-examples/tensorflow_cifar10)。

## 使用您自己的镜像

如果不使用预构建镜像，想要构建自己的自定义镜像，建议基于Ubuntu系统构建，Ubuntu中包含bash、apt和其他必须的依赖项。然后，您可以在docker镜像中添加任务需要的其他依赖包，例如python、pip和TensorFlow等，添加时请注意潜在的冲突。

## 如何使用私有Registry的镜像

默认情况下，OpenPAI将从[官方 Docker Hub](https://hub.docker.com/)拉取镜像，这是一个公有Docker Registry，其中的镜像都是可以直接使用的。

如果要使用私有Registry，请拨动 `Custom` 按钮，然后点击 `Auth` 按钮，填入所需信息。如果您的授权信息无效，OpenPAI将会在提交任务后通知您授权失败。

   <img src="./imgs/docker-image-auth.png" width="60%" height="60%" />