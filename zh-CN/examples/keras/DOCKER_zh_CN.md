# Keras on PAI docker env

## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)

## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

We need to build a Keras image to run Keras workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI Keras. We prepared a [base Dockerfile](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

```bash
    $ cd ../Dockerfiles/cuda8.0-cudnn6
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