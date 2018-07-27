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

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)
3. [MXNet examples](#mxnet-examples)
4. [Frequently asked questions](#faq)


## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

You can also jump to [MXNet examples](#mxnet-examples) using [pre-built images](https://hub.docker.com/r/openpai/pai.example.mxnet/) on Docker Hub.

We need to build a MXNet image with GPU support to run MXNet workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```

2. Prepare MXNet envoriment in a [Dockerfile](./Dockerfile.example.mxnet) using the base image.

    Write a MXNet Dockerfile and save it to `Dockerfile.example.mxnet`:

    ```dockerfile
    FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

    # install git
    RUN apt-get -y update && apt-get -y install git

    # install MXNet dependeces using pip
    RUN pip install mxnet-cu80

    # clone MXNet examples
    RUN git clone https://github.com/apache/incubator-mxnet.git
    ```

    Build the Docker image from `Dockerfile.example.mxnet`:

    ```bash
    $ sudo docker build -f Dockerfile.example.mxnet -t pai.example.mxnet .
    ```

    Push the Docker image to a Docker registry:

    ```bash
    $ sudo docker tag pai.example.mxnet USER/pai.example.mxnet
    $ sudo docker push USER/pai.example.mxnet
    ```
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*


## Advanced environment

You can skip this section if you do not need to prepare other dependencies.

You can customize runtime MXNet environment in [Dockerfile.example.mxnet](./Dockerfile.example.mxnet), for example, adding other dependeces in Dockerfile:

```dockerfile
FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install other packages using apt-get
RUN apt-get -y update && apt-get -y install git PACKAGE

# install other packages using pip
RUN pip install mxnet-cu80 PACKAGE

# clone MXNet examples
RUN git clone https://github.com/apache/incubator-mxnet.git
```


# MXNet examples

To run MXNet examples in PAI, you need to prepare a job configuration file and submit it through webportal.

If you have built your image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.mxnet` with your own.

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


## FAQ

### Speed

Since PAI runs MXNet jobs in Docker, the trainning speed on PAI should be similar to speed on host.
