# Use docker to package the job environment dependencies

The system launches a deep learning job in one or more Docker containers. A Docker images is required in advance. 
The system provides a base Docker images with HDFS, CUDA and cuDNN support, based on which users can build their own custom Docker images.

To build a base Docker image, for example [Dockerfile.build.base](../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base), run:
```sh
docker build -f Dockerfiles/Dockerfile.build.base -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 Dockerfiles/
```

Then a custom docker image can be built based on it by adding `FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04` in the Dockerfile.

As an example, we customize a TensorFlow Docker image using [Dockerfile.run.tensorflow](../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.run.tensorflow):

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