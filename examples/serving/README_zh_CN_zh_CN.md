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

# Model Serving on OpenPAI

This guide introduces how to run model serving job on OpenPAI. Serving system for machine learning models is designed for production environments, which makes it easy to deploy new algorithms and experiments to users. The following contents show some basic model serving examples, other customized serving code can be run similarly.

# Serving a TensorFlow MNIST digit recognition model

To run TensorFlow model serving, you need to prepare a job configuration file and submit it through webportal.

OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.tensorflow-serving` with your own.

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

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/user/training.md).