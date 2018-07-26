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


# XGBoost on PAI

This guide introduces how to run [XGBoost](https://xgboost.readthedocs.io/en/latest/) workload on PAI.
The following contents show some basic XGBoost examples, other customized XGBoost code can be run similarly.


## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)
3. [XGBoost example](#xgboost-example)


## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

You can also jump to [XGBoost example](#xgboost-example) using [pre-built images](https://hub.docker.com/r/openpai/pai.example.xgboost/) on Docker Hub.

We need to build a XGBoost image with GPU support to run XGBoost workload on PAI, this can be done in two steps:

1. Build a base Docker image for PAI. We prepared a [base Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
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


# XGBoost example

To run XGBoost examples in PAI, you need to prepare a job configuration file and submit it through webportal.

If you have built your image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.xgboost` with your own.

Here's one configuration file example to train a model on the [forest cover type](https://archive.ics.uci.edu/ml/datasets/covertype) dataset using GPU acceleration:

### [gpu_hist](https://github.com/dmlc/xgboost/blob/master/demo/gpu_acceleration/cover_type.py)
```json
{
  "jobName": "xgboost_gpu_hist",
  "image": "openpai/pai.example.xgboost",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": "pip install -q sklearn && python demo/gpu_acceleration/cover_type.py"
    }
  ]
}
```
For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).
