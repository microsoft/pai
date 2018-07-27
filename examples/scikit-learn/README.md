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


# scikit-learn on PAI

This guide introduces how to run [scikit-learn](http://scikit-learn.org/stable/) workload on PAI.
The following contents show some basic scikit-learn examples, other customized scikit-learn code can be run similarly.


## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)
3. [scikit-learn examples](#scikit-learn-examples)
4. [Frequently asked questions](#faq)


## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

You can also jump to [scikit-learn examples](#scikit-learn-examples) using [pre-built images](https://hub.docker.com/r/openpai/pai.example.sklearn/) on Docker Hub.

We need to build a scikit-learn image to run scikit-learn workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
    $ sudo docker build -f Dockerfile.build.base \
    >                   -t pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04 .
    $ cd -
    ```

2. Prepare scikit-learn envoriment in a [Dockerfile](./Dockerfile.example.sklearn) using the base image.

    Write a scikit-learn Dockerfile and save it to `Dockerfile.example.sklearn`:

    ```dockerfile
    FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

    # install git
    RUN apt-get -y update && apt-get -y install git

    # install scikit-learn using pip
    RUN pip install numpy pandas scipy scikit-learn

    # clone scikit-learn examples
    RUN git clone https://github.com/scikit-learn/scikit-learn.git
    ```

    Build the Docker image from `Dockerfile.example.sklearn`:

    ```bash
    $ sudo docker build -f Dockerfile.example.sklearn -t pai.example.sklearn .
    ```

    Push the Docker image to a Docker registry:

    ```bash
    $ sudo docker tag pai.example.sklearn USER/pai.example.sklearn
    $ sudo docker push USER/pai.example.sklearn
    ```
    *Note: Replace USER with the Docker Hub username you registered, you will be required to login before pushing Docker image.*


## Advanced environment

You can skip this section if you do not need to prepare other dependencies.

You can customize runtime scikit-learn environment in [Dockerfile.example.sklearn](./Dockerfile.example.sklearn), for example, adding other dependeces in Dockerfile:

```dockerfile
FROM pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04

# install other packages using apt-get
RUN apt-get -y update && apt-get -y install git PACKAGE

# install other packages using pip
RUN pip install numpy pandas scipy scikit-learn PACKAGE

# clone scikit-learn examples
RUN git clone https://github.com/scikit-learn/scikit-learn.git
```


# scikit-learn examples

To run scikit-learn examples in PAI, you need to prepare a job configuration file and submit it through webportal.

If you have built your image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.sklearn` with your own.

Here're some configuration file examples:

### [mnist](https://github.com/scikit-learn/scikit-learn/blob/master/benchmarks/bench_mnist.py)
```json
{
  "jobName": "sklearn-mnist",
  "image": "openpai/pai.example.sklearn",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 0,
      "command": "cd scikit-learn/benchmarks && python bench_mnist.py"
    }
  ]
}
```

### [text-vectorizers](https://github.com/scikit-learn/scikit-learn/blob/master/benchmarks/bench_text_vectorizers.py)
```json
{
  "jobName": "sklearn-text-vectorizers",
  "image": "openpai/pai.example.sklearn",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 0,
      "command": "pip install memory_profiler && cd scikit-learn/benchmarks && python bench_text_vectorizers.py"
    }
  ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).


## FAQ

### Speed

Since PAI runs PyTorch jobs in Docker, the trainning speed on PAI should be similar to speed on host.
