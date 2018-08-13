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


# Apache Caffe2 on PAI

This guide introduces how to run [Caffe2](https://caffe2.ai/) workload on PAI.
The following contents show some basic Caffe2 examples, other customized Caffe2 code can be run similarly.

## Contents

1. [Caffe2 example](#caffe2-example)
2. [Customize Docker Env](#customize-docker-env)

# Caffe2 example

To run Caffe2 examples in PAI, you need to prepare a job configuration file and submit it through webportal.

If you have built your image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.caffe2` with your own.

Here's one configuration file example:

### [resnet50](https://github.com/pytorch/pytorch/blob/master/caffe2/python/examples/resnet50_trainer.py)
```json
{
  "jobName": "caffe2-resnet50",
  "image": "openpai/pai.example.caffe2",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": "python resnet50_trainer.py --train_data null"
    }
  ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).

# Customize Docker Env

User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env.
