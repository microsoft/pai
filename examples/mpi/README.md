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


# MPI on PAI

This guide introduces how to run [Open MPI](https://www.open-mpi.org/) workload on PAI.
The following contents show some basic Open MPI examples, other customized MPI code can be run similarly.


## Contents

1. [Open MPI examples](#open-mpi-examples)
2. [Customize Docker Env](#customize-docker-env)

# Open MPI examples

To run Open MPI examples in PAI, you need to prepare a job configuration file and submit it through webportal.

If you have built your image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.tensorflow-mpi` or `openpai/pai.example.cntk-mpi` with your own.

Here're some configuration file examples:

### [TensorFlow cifar10 benchmark](https://git.io/vF4wT)
```js
{
  "jobName": "tensorflow-mpi",
  "image": "openpai/pai.example.tensorflow-mpi",

  // download cifar10 dataset from http://www.cs.toronto.edu/~kriz/cifar.html and upload to hdfs
  "dataDir": "$PAI_DEFAULT_FS_URI/path/tensorflow-mpi/data",
  // make a new dir for output on hdfs
  "outputDir": "$PAI_DEFAULT_FS_URI/path/tensorflow-mpi/output",
  // download code from tensorflow benchmark https://git.io/vF4wT and upload to hdfs
  "codeDir": "$PAI_DEFAULT_FS_URI/path/tensorflow-mpi/code",

  "taskRoles": [
    {
      "name": "ps_server",
      "taskNumber": 2,
      "cpuNumber": 2,
      "memoryMB": 8192,
      "gpuNumber": 0,
      "command": "pip --quiet install scipy && python code/tf_cnn_benchmarks.py --local_parameter_device=cpu --batch_size=32 --model=resnet20 --variable_update=parameter_server --data_dir=$PAI_DATA_DIR --data_name=cifar10 --train_dir=$PAI_OUTPUT_DIR --ps_hosts=$PAI_TASK_ROLE_ps_server_HOST_LIST --worker_hosts=$PAI_TASK_ROLE_worker_HOST_LIST --job_name=ps --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX --server_protocol=grpc+mpi"
    },
    {
      "name": "worker",
      "taskNumber": 2,
      "cpuNumber": 2,
      "memoryMB": 16384,
      "gpuNumber": 4,
      "command": "pip --quiet install scipy && python code/tf_cnn_benchmarks.py --local_parameter_device=cpu --batch_size=32 --model=resnet20 --variable_update=parameter_server --data_dir=$PAI_DATA_DIR --data_name=cifar10 --train_dir=$PAI_OUTPUT_DIR --ps_hosts=$PAI_TASK_ROLE_ps_server_HOST_LIST --worker_hosts=$PAI_TASK_ROLE_worker_HOST_LIST --job_name=worker --task_index=$PAI_CURRENT_TASK_ROLE_CURRENT_TASK_INDEX --server_protocol=grpc+mpi",
      "minSucceededTaskCount": 2
    }
  ],
  "retryCount": 0
}
```

### [CNTK G2P example](https://github.com/Microsoft/CNTK/tree/master/Examples/SequenceToSequence/CMUDict/BrainScript)
```js
{
  "jobName": "cntk-mpi",
  "image": "openpai/pai.example.cntk-mpi",

  // prepare cmudict corpus in CNTK format https://git.io/vbT5A and upload to hdfs
  "dataDir": "$PAI_DEFAULT_FS_URI/path/cntk-mpi/data",
  // make a new dir for output on hdfs
  "outputDir": "$PAI_DEFAULT_FS_URI/path/cntk-mpi/output",
  // prepare g2p distributed training script cntk-mpi.sh and upload to hdfs
  "codeDir": "$PAI_DEFAULT_FS_URI/path/cntk-mpi/code",
  "virtualCluster": "default",

  "taskRoles": [
    {
      "name": "mpi",
      "taskNumber": 1,
      "cpuNumber": 8,
      "memoryMB": 16384,
      "gpuNumber": 0,
      "command": "cd code && mpirun --allow-run-as-root -np 2 --host worker-0,worker-1 /bin/bash cntk-mpi.sh",
      "minSucceededTaskCount": 1
    },
    {
      "name": "worker",
      "taskNumber": 2,
      "cpuNumber": 8,
      "memoryMB": 16384,
      "gpuNumber": 2,
      "command": "/bin/bash"
    }
  ],
  "retryCount": 0
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).

# Customize Docker Env

User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env.