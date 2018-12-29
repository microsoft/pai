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

# Horovod with mpi on OpenPAI

This guide introduces how to run [Open MPI](https://www.open-mpi.org/) workload on OpenPAI.
We use [tensorflow benchmark](https://github.com/tensorflow/benchmarks/tree/cnn_tf_v1.10_compatible/scripts/tf_cnn_benchmarks) as the example. It seems impossible to run it just with openmpi and tensorflow.
So, we use [horovod](https://github.com/uber/horovod) as the runtime environment to run the example.
Other customized MPI code can be run similarly.

# Open MPI TensorFlow CIFAR-10 example

### Prepare work
1. Prepare the data:
* TensorFlow: Just go to the [official website](http://www.cs.toronto.edu/~kriz/cifar.html) and download the python version data by the [url](http://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz). `wget http://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz && tar zxvf cifar-10-python.tar.gz && rm cifar-10-python.tar.gz`
After you downloading the data, upload them to HDFS:`hdfs dfs -put filename hdfs://ip:port/examples/mpi/tensorflow/data` or `hdfs dfs -put filename hdfs://ip:port/examples/tensorflow/distributed-cifar-10/data`
Note that we use the same data as [tensorflow distributed cifar-10 example](https://github.com/Microsoft/pai/tree/master/examples/tensorflow). So, if you have already run that example, just use that data path.
2. Prepare the executable code:
* Tensorflow: We use [tensorflow benchmark](https://github.com/tensorflow/benchmarks/tree/cnn_tf_v1.10_compatible) as the example code. Pay attention to the version, the example here uses v1.10 code.
3. Prepare a docker image and upload it to docker hub. We use the [horovod official image](https://hub.docker.com/r/uber/horovod/tags/), tag `0.14.1-tf1.10.0-torch0.4.0-py2.7`. If you want to use a customized image, just refer to the [official Docker file](https://github.com/uber/horovod/blob/master/Dockerfile) and make your own. Then, build it and push the image onto docker hub.
4. Prepare a script in order to detest whether the containers are ready before run the mpi job. [Here](./start.sh) is an example.
5. Prepare a job configuration file and submit it through webportal. The config examples are following.

**Note:** you can run the `prepare.sh` to do the above preparing work, make sure you have installed HDFS client before. 
```
export HADOOP_USER_NAME=root
bash prepare.sh {hdfs_uri} {pai_username}
```

Here is a configuration file example:

## Open MPI TensorFlow CIFAR-10 example

### [TensorFlow cifar10 benchmark](https://git.io/vF4wT)

```js
{
  "jobName": "horovod-mpi-cifar10",
  "image": "openpai/example.horovod.mpi",
  "dataDir": "$PAI_DEFAULT_FS_URI/$PAI_USERNAME/examples/tensorflow/distributed-cifar-10/data",
  "outputDir": "$PAI_DEFAULT_FS_URI/$PAI_USERNAME/examples/horovod/output",
  "codeDir": "$PAI_DEFAULT_FS_URI/$PAI_USERNAME/examples/horovod/code",
  "taskRoles": [
    {
      "name": "main",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 16384,
      "gpuNumber": 2,
      "minSucceededTaskCount": 1,
      "command": "/bin/bash code/start.sh"
    },
    {
      "name": "worker",
      "taskNumber": 1,
      "cpuNumber": 4,
      "memoryMB": 16384,
      "gpuNumber": 2,
      "command": "sleep infinity"
    }
  ]
}
```

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).
