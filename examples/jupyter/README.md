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


# Jupyter on PAI

This guide introduces how to run [Jupyter Notebook](http://jupyter.org/) on PAI.
The following contents show some basic examples, other customized examples can be run similarly.


## Contents

1. [Basic environment](#basic-environment)
2. [Advanced environment](#advanced-environment)
3. [Jupyter Notebook example](#jupyter-notebook-example)


## Basic environment

First of all, PAI runs all jobs in Docker container.

[Install Docker-CE](https://docs.docker.com/install/linux/docker-ce/ubuntu/) if you haven't. Register an account at public Docker registry [Docker Hub](https://hub.docker.com/) if you do not have a private Docker registry.

We need a docker image to run it on PAI, this can be done under following instructions:

1. Build a base Docker image to run jobs on PAI. We prepared a [base Dockerfile](../../job-tutorial/Dockerfiles/cuda8.0-cudnn6/Dockerfile.build.base) which can be built directly.

    ```bash
    $ cd ../job-tutorial/Dockerfiles/cuda8.0-cudnn6
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

## Jupyter Notebook example

To run Jupyter Notebook in PAI, you need to prepare a job configuration file and submit it through webportal.

Here's one configuration file example to use Jupyter Notebook as a tutorial to run a tensorflow mnist example:

Please built your image and pushed it to your Docker registry, replace image `openpai/pai.example.tensorflow` with your own and modify the command if needed.

### Job configuration file

```json
{
    "jobName": "jupyter_example",
    "image": "openpai/pai.example.tensorflow",
    "taskRoles": [
        {
            "name": "jupyter",
            "taskNumber": 1,
            "cpuNumber": 4,
            "memoryMB": 8192,
            "gpuNumber": 1,
            "portList": [
                {
                    "label": "jupyter",
                    "beginAt": 0,
                    "portNumber": 1
                }
            ],
            "command": "python3 -m pip install -q jupyter matplotlib && wget -O mnist.ipynb https://raw.githubusercontent.com/ianlewis/tensorflow-examples/master/notebooks/TensorFlow%20MNIST%20tutorial.ipynb && jupyter notebook --allow-root --no-browser --ip 0.0.0.0 --port=$PAI_CONTAINER_HOST_jupyter_PORT_LIST --NotebookApp.token=\"\" --NotebookApp.allow_origin=\"*\" --NotebookApp.base_url=\"/jupyter\""
        }
    ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).

### Access Jupyter Notebook

Once the job is successfully submitted to PAI, you can view job info in webportal, and access your Jupyter Notebook via http://${container_ip}:${container_port}/jupyter/notebooks/mnist.ipynb. 
![avatar](example.png)
for example, from the above job info page, you can access your Jupyter Notebook via http://10.151.40.202:4836/jupyter/notebooks/mnist.ipynb
