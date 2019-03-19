# XGBoost on PAI docker env

## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)

## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

You can also jump to [XGBoost example](#xgboost-example) using [pre-built images](https://hub.docker.com/r/openpai/pai.example.xgboost/) on Docker Hub.

We need to build a XGBoost image with GPU support to run XGBoost workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

```bash
    $ cd ../Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```

2. Prepare XGBoost envoriment in a [Dockerfile](./Dockerfile.example.xgboost) using the base image.

    Write a XGBoost Dockerfile and save it to `Dockerfile.example.xgboost`:

    Push the Docker image to a Docker registry:

    ```bash
    $ sudo docker tag pai.example.xgboost USER/pai.example.xgboost
    $ sudo docker push USER/pai.example.xgboost
    ```
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*


## Advanced environment

You can skip this section if you do not need to prepare other dependencies.

You can customize runtime XGBoost environment in [Dockerfile.example.xgboost](./Dockerfile.example.xgboost), for example, adding other dependeces in Dockerfile:

```dockerfile
FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install other packages using apt-get
RUN apt-get -y update && apt-get -y install PACKAGE

# install other packages using pip
RUN pip install PACKAGE
```