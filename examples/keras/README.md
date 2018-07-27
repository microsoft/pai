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


# Keras on PAI

This guide introduces how to run [Keras](http://keras.io/) workload on PAI.
The following contents show some basic Keras examples, other customized Keras code can be run similarly.


## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)
3. [Keras examples](#keras-examples)
4. [Frequently asked questions](#faq)


## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

We need to build a Keras image to run Keras workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI Keras. We prepared a [base Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```

You can also directly use [cntk](../cntk/Dockerfile.example.cntk)/[tensorflow](../tensorflow/Dockerfile.example.tensorflow) base image as Keras backend.

2. Prepare Keras envoriment in a [Dockerfile](./Dockerfile.example.keras.tensorflow_backend) using tensorflow base image as Keras backend.

    Write a Keras Dockerfile and save it to `Dockerfile.example.Keras`:

    ```dockerfile
    # use tensorflow as Keras backend
    FROM openpai/pai.example.tensorflow

    # install git
    RUN apt-get -y update && apt-get -y install git

    # install Keras python package using pip
    RUN pip install keras

    WORKDIR /root
    
    # clone Keras examples
    RUN git clone https://github.com/keras-team/keras.git 

    # set tensorflow as keras backend
    ENV KERAS_BACKEND tensorflow

    # set work directory to keras examples
    WORKDIR /root/keras/examples
    ```

    Build the Docker image from `Dockerfile.example.Keras`:

    ```bash
    $ sudo docker build -f Dockerfile.example.keras -t pai.example.keras .
    ```

    Push the Docker image to a Docker registry:

    ```bash
    $ sudo docker tag pai.example.keras USER/pai.example.keras
    $ sudo docker push USER/pai.example.keras
    ```
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*


## Advanced environment

You can skip this section if you do not need to prepare other dependencies.

You can customize runtime Keras environment in Dockerfile, for example, adding other dependeces in Dockerfile:

```dockerfile
# install other packages using apt-get
RUN apt-get -y update && apt-get -y install git PACKAGE

# install other packages using pip
RUN pip install PACKAGE
```


# Keras examples

To run Keras examples in PAI, you need to prepare a job configuration file and submit it through webportal.

Please built your image and pushed it to your Docker registry, replace image `openpai/pai.example.keras.[cntk|tensorflow]` with your own.

Here're some configuration file examples:

### [mnist_tensorflow_backend](https://github.com/keras-team/keras/blob/master/examples/mnist_cnn.py)
```json
{
    "jobName": "keras_tensorflow_backend_mnist",
    "image": "openpai/pai.example.keras.tensorflow",
    "taskRoles": [
        {
            "name": "mnist",
            "taskNumber": 1,
            "cpuNumber": 4,
            "memoryMB": 8192,
            "gpuNumber": 1,
            "command": "python mnist_cnn.py"
        }
    ]
}
```

### [mnist_cntk_backend](https://github.com/keras-team/keras/blob/master/examples/mnist_cnn.py)
```json
{
    "jobName": "keras_tensorflow_backend_mnist",
    "image": "openpai/pai.example.keras.cntk",
    "taskRoles": [
        {
            "name": "mnist",
            "taskNumber": 1,
            "cpuNumber": 4,
            "memoryMB": 8192,
            "gpuNumber": 1,
            "command": "python mnist_cnn.py"
        }
    ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).


## FAQ

### Speed

Since PAI runs Keras jobs in Docker, the trainning speed on PAI should be similar to speed on host.
