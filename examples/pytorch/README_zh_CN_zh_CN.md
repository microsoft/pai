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

# PyTorch on OpenPAI

This guide introduces how to run [PyTorch](http://pytorch.org/) job on OpenPAI. The following contents show some basic PyTorch examples, other customized PyTorch code can be run similarly.

## Contents

- [PyTorch on OpenPAI](#pytorch-on-openpai) 
  - [Contents](#contents)
  - [PyTorch MNIST digit recognition examples](#pytorch-mnist-digit-recognition-examples) 
    - [mnist](#mnist)
  - [PyTorch regression examples](#pytorch-regression-examples) 
    - [regression](#regression)
  - [Note:](#note)

## PyTorch MNIST digit recognition examples

To run PyTorch examples in OpenPAI, you need to prepare a job configuration file and submit it through webportal.

OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.pytorch` with your own.

Here're some configuration file examples:

### [mnist](https://github.com/pytorch/examples/tree/master/mnist)

```json
{
  "jobName": "pytorch-mnist",
  "image": "openpai/pai.example.pytorch",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 1,
      "command": "cd examples/mnist && python main.py"
    }
  ]
}
```

## PyTorch regression examples

### [regression](https://github.com/pytorch/examples/tree/master/regression)

```json
{
  "jobName": "pytorch-regression",
  "image": "openpai/pai.example.pytorch",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 8192,
      "gpuNumber": 0,
      "command": "cd examples/regression && python main.py"
    }
  ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/user/training.md).

## Note:

Since PAI runs PyTorch jobs in Docker, the training speed on PAI should be similar to speed on host.