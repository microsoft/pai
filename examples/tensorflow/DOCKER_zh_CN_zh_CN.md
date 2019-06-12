# TensorFlow on PAI docker env

## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)

## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

You can also jump to [TensorFlow examples](#tensorflow-examples) using [pre-built images](https://hub.docker.com/r/openpai/pai.example.tensorflow/) on Docker Hub.

We need to build a TensorFlow image with GPU support to run TensorFlow workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

```bash
    $ cd ../Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```

2. Prepare TensorFlow envoriment in a [Dockerfile](./Dockerfile.example.tensorflow) using the base image.

    Write a TensorFlow Dockerfile and save it to `Dockerfile.example.tensorflow`:

    ```dockerfile
    FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

    ENV TENSORFLOW_VERSION=1.4.0

    # For how to run TensorFlow on Hadoop,
    # please refer to https://www.tensorflow.org/deploy/hadoop
    RUN pip install tensorflow-gpu==${TENSORFLOW_VERSION} && \
        pip3 install tensorflow-gpu==${TENSORFLOW_VERSION}

    WORKDIR /root
    ```

    Build the Docker image from `Dockerfile.example.tensorflow`:

    ```bash
    $ sudo docker build -f Dockerfile.example.tensorflow -t pai.example.tensorflow .
    ```

    Push the Docker image to a Docker registry:

    ```bash
    $ sudo docker tag pai.example.tensorflow USER/pai.example.tensorflow
    $ sudo docker push USER/pai.example.tensorflow
    ```
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*


## Advanced environment

You can skip this section if you do not need to prepare other dependencies.

You can customize runtime TensorFlow environment in [Dockerfile.example.tensorflow](./Dockerfile.example.tensorflow), for example, adding other dependeces in Dockerfile:

```dockerfile
FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

ENV TENSORFLOW_VERSION=1.4.0

# install other packages using apt-get
RUN apt-get -y update && apt-get -y install git PACKAGE

# install other packages using pip
RUN pip install tensorflow-gpu==${TENSORFLOW_VERSION} PACKAGE

WORKDIR /root
```