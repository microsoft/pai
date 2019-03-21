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

# MPI on OpenPAI

This guide introduces how to run [Open MPI](https://www.open-mpi.org/) workload on OpenPAI. The following contents show some basic Open MPI examples, other customized MPI code can be run similarly.

## Contents

- [Note](#note)
- [MPI on OpenPAI](#mpi-on-openpai) 
  - [Contents](#contents)
- [CNTK CIFAR-10 example](#cntk-cifar-10-example) - [Prepare work](#prepare-work) 
  - [Open MPI CNTK grapheme-to-phoneme conversion example](#open-mpi-cntk-grapheme-to-phoneme-conversion-example) 
    - [CNTK G2P example](#cntk-g2p-example)

# CNTK CIFAR-10 example

### Prepare work

1. Prepare the data:

- CNTK: Download all files in https://git.io/vbT5A `wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b` and put them up to HDFS:`hdfs dfs -put filename hdfs://ip:port/examples/cntk/data` or `hdfs dfs -put filename hdfs://ip:port/examples/mpi/cntk/data`. Note that we use the same data as cntk example. So, if you have already run that example, just use that data path. 2. Prepare the executable code: * cntk: Download the script example from [github](https://github.com/Microsoft/pai/blob/master/examples/mpi/cntk-mpi.sh)`wget https://github.com/Microsoft/pai/raw/master/examples/mpi/cntk-mpi.sh`. Then upload them to HDFS:`hdfs dfs -put filename hdfs://ip:port/examples/mpi/cntk/code/` 3. Prepare a docker image and upload it to docker hub. OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.cntk` with your own. 4. Prepare a job configuration file and submit it through webportal. The config examples are following.

**Note** that you can simply run the prepare.sh to do the above preparing work, but you must make sure you can use HDFS client on your local machine. If you can, just run the shell script with a parameter of your HDFS socket! `/bin/bash prepare.sh ip:port`

Here's a configuration file examples:

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

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/user/training.md).