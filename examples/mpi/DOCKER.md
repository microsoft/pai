# MPI on PAI docker env

## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)

## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

We need to build a Open MPI base image with GPU support to run Open MPI workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```

2. Build an Open MPI Docker image for PAI. We prepared a [mpi Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.mpi) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.mpi \
    >                   -t pai.build.mpi:openmpi1.10.4-hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```


## Advanced environment

You can build runtime TensorFlow or CNTK Docker images based on the MPI base image,
for example, we prepared [TensorFlow mpi Dockerfile](./Dockerfile.example.tensorflow-mpi) and [CNTK mpi Dockerfile](./Dockerfile.example.cntk-mpi) which can be refered to.

Push the Docker image to a Docker registry, we use TensorFlow mpi Docker image as an example:

```bash
$ sudo docker tag pai.example.tensorflow-mpi USER/pai.example.tensorflow-mpi
$ sudo docker push USER/pai.example.tensorflow-mpi
```
*Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*
