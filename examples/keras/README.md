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


# Keras on OpenPAI

This guide introduces how to run [Keras](http://keras.io/) job on OpenPAI.
The following contents show some basic Keras examples, other customized Keras code can be run similarly.

## Keras tensorflow backend MNIST digit recognition examples

To run Keras examples in OpenPAI, you need to prepare a job configuration file and submit it through webportal.

OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `pai.example.keras.tensorflow` with your own. 

Here're some configuration file examples:

### [mnist_tensorflow_backend](https://github.com/keras-team/keras/blob/master/examples/mnist_cnn.py)
```json
{
    "jobName": "keras_tensorflow_backend_mnist",
    "image": "openpai/pai.example.keras.tensorflow",
    "taskRoles": [
        {
            "name": "mnist",
            "taskNumber": 1,
            "cpuNumber": 4,
            "memoryMB": 8192,
            "gpuNumber": 1,
            "command": "python mnist_cnn.py"
        }
    ]
}
```

## Keras cntk backend MNIST digit recognition examples


### [mnist_cntk_backend](https://github.com/keras-team/keras/blob/master/examples/mnist_cnn.py)
```json
{
    "jobName": "keras_cntk_backend_mnist",
    "image": "openpai/pai.example.keras.cntk",
    "taskRoles": [
        {
            "name": "mnist",
            "taskNumber": 1,
            "cpuNumber": 4,
            "memoryMB": 8192,
            "gpuNumber": 1,
            "command": "python mnist_cnn.py"
        }
    ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).

### Note: 

Since PAI runs Keras jobs in Docker, the trainning speed on PAI should be similar to speed on host.

We provide two stable docker images by adding the data to the images. If you want to use them, add `stable` tag to the image name: `openpai/pai.example.keras.cntk:stable` or `openpai/pai.example.keras.tensorflow:stable`.
