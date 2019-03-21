# Apache MXNet on PAI docker env

## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)

## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

You can also jump to [MXNet examples](#mxnet-examples) using [pre-built images](https://hub.docker.com/r/openpai/pai.example.mxnet/) on Docker Hub.

We need to build a MXNet image with GPU support to run MXNet workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

```bash
    $ cd ../Dockerfiles/cuda8.0-cudnn6
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