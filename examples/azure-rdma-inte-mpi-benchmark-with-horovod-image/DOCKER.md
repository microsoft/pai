## Basic environment

First of all, PAI runs all jobs in Docker container.

1: Install Docker CE

2: Get an account of docker hub to store your image.

# AzureRDMA && IntelMpi on PAI docker env

## Contents


We need to build a AzureRDMA&IntelMPI image to run intel benchmark workload on OpenPAI, this can be done with following steps:

- Write an AzureRDMA&IntelMPI Dockerfile and save it to `Dockerfile.example.horovod-intelmpi-az-rdma`:

You could refer to this [Dockerfile](./Dockerfile.example.horovod-intelmpi-az-rdma)

- Build the Docker image from `Dockerfile.example.horovod-intelmpi-az-rdma`:

```bash
$ sudo docker build -f Dockerfile.example.horovod-intelmpi-az-rdma -t USER/pai.example.horovod-intelmpi-az-rdma .
```

- Push the Docker image to a Docker registry:

```bash
$ sudo docker push USER/pai.example.horovod-intelmpi-az-rdma
```
*Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*
