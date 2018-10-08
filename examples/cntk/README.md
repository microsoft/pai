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


# CNTK on OpenPAI

This guide introduces how to run [CNTK](https://docs.microsoft.com/en-us/cognitive-toolkit/) job on OpenPAI.
The following contents show some basic CNTK examples, other customized CNTK code can be run similarly.

# CNTK grapheme-to-phoneme examples

### prepare
To run CNTK examples in OpenPAI, you need to do the following things:
1. Prepare the data by downloading all files in https://git.io/vbT5A(`wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/Data/cmudict-0.7b`) and put them up to HDFS:`hdfs dfs -put filename hdfs://ip:port/examples/cntk/data`.
2. Prepare the execable code(`wget https://github.com/Microsoft/pai/raw/master/examples/cntk/cntk-g2p.sh`) and config(`wget https://github.com/Microsoft/CNTK/raw/master/Examples/SequenceToSequence/CMUDict/BrainScript/G2P.cntk`). And upload them to HDFS:`hdfs dfs -put filename hdfs://ip:port/examples/cntk/code`.
3. Prepare a docker image and upload it to docker hub. You can get the tutorial below.
4. Prepare a job configuration file and submit it through webportal.
Note that you can simply run the prepare.sh to do the above preparing work, but you must make sure you can use HDFS client on your local mechine. If you can, just run the shell script with a parameter of your HDFS socket!`/bin/bash prepare.sh ip:port`


OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Docker Hub, replace our pre-built image `openpai/pai.example.caffe` with your own. 

Here're some configuration file examples, pay attention to the codeDir/dataDir/outputDir, they must be the same as the path that you upload your code and data to:

### [grapheme-to-phoneme](https://github.com/Microsoft/CNTK/tree/master/Examples/SequenceToSequence/CMUDict)
```js
{
  "jobName": "cntk-g2p",
  "image": "openpai/pai.example.cntk",

  // prepare cmudict corpus in CNTK format https://git.io/vbT5A and upload to hdfs
  "dataDir": "$PAI_DEFAULT_FS_URI/examples/cntk/data",
  // make a new dir for output on hdfs
  "outputDir": "$PAI_DEFAULT_FS_URI/examples/cntk/output",
  // prepare g2p training script cntk-example.sh and upload to hdfs
  "codeDir": "$PAI_DEFAULT_FS_URI/examples/cntk/code",

  "taskRoles": [
    {
      "name": "g2p_train",
      "taskNumber": 1,
      "cpuNumber": 8,
      "memoryMB": 16384,
      "gpuNumber": 1,
      "command": "cd code && /bin/bash cntk-g2p.sh"
    }
  ]
}
```

When the job finished and succeeded, you can get the output of the example from HDFS:`hdfs dfs -get hdfs://ip:port/examples/cntk/output`.

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).
