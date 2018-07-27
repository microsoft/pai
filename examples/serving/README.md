<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->


# Model Serving on PAI

This guide introduces how to run model serving workload on PAI.
Serving system for machine learning models is designed for production environments, which makes it easy to deploy new algorithms and experiments to users.
The following contents show some basic model serving examples, other customized serving code can be run similarly.


## Contents

1. [Basic environment](#basic-environment)
2. [Serving a TensorFlow model](#serving-a-tensorflow-model)


## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

We use TensorFlow model serving as an example, for how to serve a TensorFlow model, please refer to its [serving tutorial](https://www.tensorflow.org/serving/serving_basic).

You can also jump to [Serving a TensorFlow model](#serving-a-tensorflow-model) using [pre-built images](https://hub.docker.com/r/openpai/pai.example.tensorflow-serving/) on Docker Hub.

We need to build a TensorFlow serving image with GPU support to serve a TensorFlow model on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```

2. Build the TensorFlow serving Docker image for PAI. We use the [TensorFlow serving Dockerfile](https://github.com/tensorflow/serving/blob/master/tensorflow_serving/tools/docker/Dockerfile.devel-gpu) provided in its tutorial.

    Download the Dockerfile and built it from the base Docker image.

    ```bash
    $ wget --no-check-certificate -O Dockerfile.example.tensorflow-serving https://raw.githubusercontent.com/tensorflow/serving/master/tensorflow_serving/tools/docker/Dockerfile.devel-gpu
    $ sed -i "/FROM/c\FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04" Dockerfile.example.tensorflow-serving
    $ sudo docker build -f Dockerfile.example.tensorflow-serving .
    ```

    Then push the Docker image to a Docker registry:

    ```bash
    $ sudo docker tag pai.example.tensorflow-serving USER/pai.example.tensorflow-serving
    $ sudo docker push USER/pai.example.tensorflow-serving
    ```
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*


# Serving a TensorFlow model

To run TensorFlow model serving, you need to prepare a job configuration file and submit it through webportal.

If you have built your image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.tensorflow-serving` with your own.

Here're some configuration file examples:

### [serving](https://www.tensorflow.org/serving/serving_basic)
```json
{
  "jobName": "tensorflow-serving",
  "image": "openpai/pai.example.tensorflow-serving",
  "taskRoles": [
    {
      "name": "serving",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "portList": [
        {
          "label": "model_server",
          "beginAt": 0,
          "portNumber": 1
        }
      ],
      "command": "bazel-bin/tensorflow_serving/example/mnist_saved_model /tmp/mnist_model && while :; do tensorflow_model_server --port=$PAI_CONTAINER_HOST_model_server_PORT_LIST --model_name=mnist --model_base_path=/tmp/mnist_model; done"
    }
  ],
  "retryCount": -2
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).
