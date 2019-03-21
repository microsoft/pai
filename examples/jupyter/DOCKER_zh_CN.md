# Jupyter on PAI docker env

## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)

## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

We need a docker image to run it on PAI, this can be done under following instructions:

1. Build a base Docker image to run jobs on PAI. We prepared a [base Dockerfile](../Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

```bash
    $ cd ../Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.example.jupyter .
    $ cd -
    ```
2. Push the Docker image to a Docker registry:

    ```bash
    $ sudo docker tag pai.example.jupyter USER/pai.example.jupyter
    $ sudo docker push USER/pai.example.jupyter
    ```
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*
## Advanced environment

You can skip this section if you do not need to prepare other dependencies.

You can customize runtime Jupyter Notebook environment in your own docker image based on our base image, for example, adding other dependeces in Dockerfile:

```dockerfile
FROM openpai/pai.example.jupyter

# install other packages using apt-get
RUN apt-get -y update && apt-get -y install git PACKAGE

# install other packages using pip
RUN pip install PACKAGE
```