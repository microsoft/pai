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

# Note
Now(27th September, 2018), the mpi examples are still unready. Ignore them!

# MPI on OpenPAI

This guide introduces how to run [Open MPI](https://www.open-mpi.org/) workload on OpenPAI.
The following contents show some basic Open MPI examples, other customized MPI code can be run similarly.

## Contents

1. [Open MPI TensorFlow CIFAR-10 example](#open-mpi-tensorflow-cifar-10-example)
2. [Open MPI CNTK grapheme-to-phoneme conversion example](#open-mpi-cntk-grapheme-to-phoneme-conversion-example)


# Open MPI TensorFlow / CNTK CIFAR-10 example

### Prepare work
1. Prepare the data:
* TensorFlow: Just go to the [official website](http://www.cs.toronto.edu/~kriz/cifar.html) and download the python version data by the [url](http://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz). `wget http://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz && tar zxvf cifar-10-python.tar.gz && rm cifar-10-python.tar.gz`
After you downloading the data, upload them to HDFS:`hdfs dfs -put filename hdfs://ip:port/examples/mpi/tensorflow/data` or `hdfs dfs -put filename hdfs://ip:port/examples/tensorflow/distributed-cifar-10/data`
Note that we use the same data as tensorflow distributed cifar-10 example. So, if you have already run that example, just use that data path.
* CNTK: Download all files in https://git.io/vbT5A `wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b` and put them up to HDFS:`hdfs dfs -put filename hdfs://ip:port/examples/cntk/data` or `hdfs dfs -put filename hdfs://ip:port/examples/mpi/cntk/data`.
Note that we use the same data as cntk example. So, if you have already run that example, just use that data path.
2. Prepare the execable code:
* Tensorflow: We use the same code as tensorflow distributed cifar-10 example. You can follow [that document](https://github.com/Microsoft/pai/blob/master/examples/tensorflow/README.md).
* cntk: Download the script example from [github](https://github.com/Microsoft/pai/blob/master/examples/mpi/cntk-mpi.sh)`wget https://github.com/Microsoft/pai/raw/master/examples/mpi/cntk-mpi.sh`. Then upload them to HDFS:`hdfs dfs -put filename hdfs://ip:port/examples/mpi/cntk/code/`
3. Prepare a docker image and upload it to docker hub.  OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image  `openpai/pai.example.tensorflow-mpi`, `openpai/pai.example.cntk-mp` with your own.
4. Prepare a job configuration file and submit it through webportal. The config examples are following.

**Note** that you can simply run the prepare.sh to do the above preparing work, but you must make sure you can use HDFS client on your local mechine. If you can, just run the shell script with a parameter of your HDFS socket! `/bin/bash prepare.sh ip:port`

Here're some configuration file examples:

## Open MPI TensorFlow CIFAR-10 example

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

## Open MPI CNTK grapheme-to-phoneme conversion example

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
