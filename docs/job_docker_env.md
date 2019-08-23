# Use Docker to Package the Job Environment Dependencies

The system launches a deep learning job in one or more Docker containers. A Docker image is required in advance.
The system provides a base Docker images with HDFS, CUDA and cuDNN support, based on which users can build their own custom Docker images.

To build a base Docker image, for example [Dockerfile.build.base](../examples/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base), run:
```sh
docker build -f Dockerfiles/Dockerfile.build.base -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 Dockerfiles/
```

Then a custom docker image can be built based on it by adding `FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04` in the Dockerfile.

As an example, we customize a TensorFlow Docker image using [Dockerfile.run.tensorflow](../examples/Dockerfiles/cuda8.0-cudnn6/Dockerfile.run.tensorflow):

```sh
docker build -f Dockerfiles/Dockerfile.run.tensorflow -t pai.run.tensorflow Dockerfiles/
```

Next, the built image is pushed to a docker registry for every node in the system to access that image:
```sh
docker tag pai.run.tensorflow your_docker_registry/pai.run.tensorflow
docker push your_docker_registry/pai.run.tensorflow
```

And the image is ready to serve. Note that above script assume the docker registry is deployed locally.
Actual script can vary depending on the configuration of Docker registry.

## Enable SSH for your Image

In OpenPAI, if a Docker image doesn't have *openssh-server* and *curl* packages, the SSH feature will not work for it. To enable SSH for your image, please follow the steps below.

First, create a file named "example.Dockerfile", and add the following commands to it. Here we use "ufoym/deepo:pytorch-py36-cu90" as an example. You can replace it with your own Docker images.
```bash
# replace "ufoym/deepo:pytorch-py36-cu90" with your own docker images
FROM ufoym/deepo:pytorch-py36-cu90
RUN apt-get update
RUN apt-get -y install openssh-server curl
```

Next, login to the Docker Hub (If you don't have a Docker ID, please check https://hub.docker.com/signup to signup one)
```bash
# follow the instructions to login
docker login
```

Finally, build and push the image with the following commands:
```bash
 docker build -f example.Dockerfile -t <Your Docker ID>/pytorch-py36-cu90-ssh .
 docker push <Your Docker ID>/pytorch-py36-cu90-ssh
```

Now you can use "\<Your Docker ID\>/pytorch-py36-cu90-ssh" in OpenPAI, and it is SSH enabled.
