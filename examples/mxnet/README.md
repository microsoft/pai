<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->


# Apache MXNet on PAI

This guide introduces how to run [Apache MXNet](https://mxnet.apache.org/) workload on PAI.
The following contents show some basic MXNet examples, other customized MXNet code can be run similarly.

## Contents

1. [MXNet autoencoder examples](#mxnet-autoencoder-examples)
2. [MXNet image classification examples](#mxnet-image-classification-examples)

## MXNet autoencoder examples

To run MXNet examples in PAI, you need to prepare a job configuration file and submit it through webportal.

OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.mxnet` with your own. 


Here're some configuration file examples:

### [autoencoder](https://github.com/apache/incubator-mxnet/tree/master/example/autoencoder)
```json
{
  "jobName": "mxnet-autoencoder",
  "image": "openpai/pai.example.mxnet",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": "pip install scipy scikit-learn && cd incubator-mxnet/example/autoencoder && python mnist_sae.py --gpu"
    }
  ]
}
```

## MXNet image classification examples

### [image classification](https://github.com/apache/incubator-mxnet/tree/master/example/image-classification)
```json
{
  "jobName": "mxnet-image-classification",
  "image": "openpai/pai.example.mxnet",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": "cd incubator-mxnet/example/image-classification && python train_mnist.py --network mlp"
    }
  ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).

### Note:

Since PAI runs MXNet jobs in Docker, the trainning speed on PAI should be similar to speed on host.

We provide a stable docker image by adding the data to the image. If you want to use it, add `stable` tag to the image name: `openpai/pai.example.mxnet:stable`.
