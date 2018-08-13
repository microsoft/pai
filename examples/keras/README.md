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


# Keras on PAI

This guide introduces how to run [Keras](http://keras.io/) workload on PAI.
The following contents show some basic Keras examples, other customized Keras code can be run similarly.


## Contents

1. [Keras examples](#keras-examples)
2. [Frequently asked questions](#faq)
3. [Customize Docker Env](#customize-docker-env)

# Keras examples

To run Keras examples in PAI, you need to prepare a job configuration file and submit it through webportal.

Please built your image and pushed it to your Docker registry, replace image `openpai/pai.example.keras.[cntk|tensorflow]` with your own.

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

### [mnist_cntk_backend](https://github.com/keras-team/keras/blob/master/examples/mnist_cnn.py)
```json
{
    "jobName": "keras_tensorflow_backend_mnist",
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


## FAQ

### Speed

Since PAI runs Keras jobs in Docker, the trainning speed on PAI should be similar to speed on host.

# Customize Docker Env

User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env.