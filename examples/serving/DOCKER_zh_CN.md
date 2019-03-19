# Model Serving on PAI docker env

## Contents

1. [Basic environment](#basic-environment)

## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

We use TensorFlow model serving as an example, for how to serve a TensorFlow model, please refer to its [serving tutorial](https://www.tensorflow.org/serving/serving_basic).

You can also jump to [Serving a TensorFlow model](#serving-a-tensorflow-model) using [pre-built images](https://hub.docker.com/r/openpai/pai.example.tensorflow-serving/) on Docker Hub.

We need to build a TensorFlow serving image with GPU support to serve a TensorFlow model on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../Dockerfiles/cuda9.0-cudnn7/Dockerfile.build.base) which can be built directly.
    
    ```bash
    $ cd ../Dockerfiles/cuda9.0-cudnn7
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda9.0-cudnn7-devel-ubuntu16.04 .
    $ cd -
    ```

2. Build the TensorFlow serving Docker image for PAI. We use the [TensorFlow serving Dockerfile](./Dockerfile.example.tensorflow-serving) provided in its tutorial.
    
        $ sudo docker build -f Dockerfile.example.tensorflow-serving .
        
    
    Then push the Docker image to a Docker registry:
    
    ```bash
    $ sudo docker tag pai.example.tensorflow-serving USER/pai.example.tensorflow-serving
    $ sudo docker push USER/pai.example.tensorflow-serving
    ```
    
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*