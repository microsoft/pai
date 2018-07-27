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


# Chainer on PAI

This guide introduces how to run [Chainer](https://chainer.org/) workload on PAI.
The following contents show a basic Chainer example, other customized Chainer code can be run similarly.


## Contents

1. [Basic environment](#basic-environment)
2. [Chainer examples](#chainer-example)


## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

We need to build a Chainer image with GPU support to run Chainer workload on PAI, this can be done with two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```

2. Prepare Chainer envoriment in a [Dockerfile](./Dockerfile.example.chainer) using the base image.

    Write a Chainer Dockerfile and save it to `Dockerfile.example.chainer`:

    ```dockerfile   
    FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

    #set LC_ALL
    ENV LC_ALL C

    # install git
    RUN apt-get -y update && apt-get -y install git

    # install Chainer and cupy using pip
    RUN pip install chainer && pip install cupy-cuda80

    # clone Chainer official code
    RUN git clone https://github.com/chainer/chainer.git

    ```

    Build the Docker image from `Dockerfile.example.chainer`:

    ```bash
    $ sudo docker build -f Dockerfile.example.chainer -t USER/pai.example.chainer .
    ```

    Push the Docker image to a Docker registry:

    ```bash
    $ sudo docker push USER/pai.example.chainer
    ```
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*

## Chainer examples

To run Chainer examples in PAI, you need to prepare a job configuration file and submit it through webportal.

If you have built your image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.chainer` with your own.

Here're some configuration file examples:

### [cifar](https://github.com/chainer/chainer/tree/master/examples/cifar)
```json
  "jobName": "chainer-cifar",
  "image": "openpai/pai.example.chainer",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": "python ./chainer/examples/cifar/train_cifar.py"
    }
  ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).
