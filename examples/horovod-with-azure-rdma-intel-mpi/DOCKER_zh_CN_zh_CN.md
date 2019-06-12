## Basic environment

First of all, PAI runs all jobs in Docker container.

1: Install Docker CE

2: Get an account of docker hub to store your image.

# horovod-with-azure-rdma-intel-mpi on PAI docker env

## Contents

We need to build an horovod-with-azure-rdma-intel-mpi image to run horovod with rdma&&mpi on OpenPAI@Azure, and this can be done with following steps:

- Get a license for your intel mpi. And then modify the ```ACTIVATION_TYPE``` in the [silent.cfg](./silent.cfg)

- Write a horovod-with-azure-rdma-intel-mpi Dockerfile and save it to `Dockerfile.example.horovod-with-azure-rdma-intel-mpi`:
    
    - You could refer to this [Dockerfile](./Dockerfile.example.horovod-with-azure-rdma-intel-mpi)
    - If your intel MPI is activated by a license file. You should copy it to the docker image, when building it.
    - You'd better keep the image in a private registry. Because you build the license in the image. 

- Build the Docker image from `Dockerfile.example.horovod-with-azure-rdma-intel-mpi`:

```bash
$ sudo docker build -f Dockerfile.example.horovod-with-azure-rdma-intel-mpi -t USER/pai.example.horovod-with-azure-rdma-intel-mpi .
```

- Push the Docker image to a Docker registry:

```bash
$ sudo docker push USER/pai.example.horovod-with-azure-rdma-intel-mpi
```

Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.