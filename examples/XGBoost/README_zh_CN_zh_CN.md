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

This guide introduces how to run [XGBoost](https://xgboost.readthedocs.io/en/latest/) workload on PAI. The following contents show some basic XGBoost examples, other customized XGBoost code can be run similarly.

## XGBoost covertype dataset classification example

To run XGBoost examples in PAI, you need to prepare a job configuration file and submit it through webportal.

OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.xgboost` with your own.

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

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/user/training.md).