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


# scikit-learn on OpenPAI

This guide introduces how to run [scikit-learn](http://scikit-learn.org/stable/) job on OpenPAI.
The following contents show some basic scikit-learn examples, other customized scikit-learn code can be run similarly.


## Contents

1. [scikit-learn MNIST digit recognition example](#scikit-learn-mnist-digit-recognition-example)
2. [scikit-learn text-vectorizers example](#scikit-learn-text-vectorizers-example)

## scikit-learn MNIST digit recognition example

To run scikit-learn examples in OpenPAI, you need to prepare a job configuration file and submit it through webportal.

OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.sklearn` with your own. 

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

## scikit-learn text-vectorizers example

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

### Note:

Since PAI runs PyTorch jobs in Docker, the trainning speed on PAI should be similar to speed on host.

We provide a stable docker image by adding the data to the image. If you want to use it, add `stable` tag to the image name: `openpai/pai.example.sklearn:stable`.
