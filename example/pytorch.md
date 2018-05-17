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


# PyTorch on PAI

This guide introduces how to run [PyTorch](http://pytorch.org/) workload on PAI.
The following contents show some basic PyTorch examples, other custom PyTorch code can be run similarly.


## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)
3. [PyTorch examples](#pytorch-examples)
4. [Frequently asked questions](#faq)


## Basic environment

First of all, PAI runs all jobs in Docker container. [Install Docker-CE] (https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't.

We need to build a PyTorch image with GPU support to run PyTorch workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [Dockerfile](../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

  ```bash
  $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
  $ sudo docker build -f Dockerfile.build.base -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
  $ cd -
  ```

2. Prepare PyTorch envoriments in a Dockerfile using the base image.

  Write a PyTorch Dockerfile and save it to `Dockerfile.run.pytorch`:
  ```
  FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

  # install PyTorch dependeces using pip
  RUN pip install torch torchvision

  # clone PyTorch examples
  RUN git clone https://github.com/pytorch/examples.git
  ```

  Build the Docker image from `Dockerfile.run.pytorch`:
  ```bash
  $ sudo docker build -f Dockerfile.run.pytorch -t USER/pai.run.pytorch .
  ```

  Push the Docker image to a Docker registry:
  ```bash
  $ sudo docker push USER/pai.run.pytorch
  ```


## Advanced environment

You can customize runtime PyTorch environment in `Dockerfile.run.pytorch`, for example, adding other dependeces in Dockerfile:
```
FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install other packages using apt-get
RUN apt-get -y update && apt-get -y install PACKAGE

# install other packages using pip
RUN pip install torch torchvision PACKAGE

# clone PyTorch examples
RUN git clone https://github.com/pytorch/examples.git
```


# PyTorch examples

To run PyTorch examples in PAI, you need to prepare a job configuration file and submit it through webportal.
Here're some configuration file examples:

### [mnist](https://github.com/pytorch/examples/tree/master/mnist)
```json
{
  "jobName": "pytorch-mnist",
  "image": "USER/pai.run.pytorch",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": "cd examples/mnist && python main.py"
    }
  ]
}
```

### [regression](https://github.com/pytorch/examples/tree/master/regression)
```json
{
  "jobName": "pytorch-regression",
  "image": "USER/pai.run.pytorch",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 0,
      "command": "cd examples/regression && python main.py"
    }
  ]
}
```


## FAQ

### Speed

Since PAI runs PyTorch jobs in Docker, the trainning speed on PAI should be similar to speed on host.
