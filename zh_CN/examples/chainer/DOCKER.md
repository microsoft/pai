## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

# Chainer on PAI docker env

## Contents

1. \[Basic environment\](#basic-environment

We need to build a Chainer image with GPU support to run Chainer workload on PAI, this can be done with two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.
    
    ```bash
    $ cd ../Dockerfiles/cuda8.0-cudnn6
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