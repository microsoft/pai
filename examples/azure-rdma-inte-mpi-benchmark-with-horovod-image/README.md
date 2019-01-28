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

## Intel MPI benchmark in OpenPAI based on Azure's RDMA Capable machines.

#### Prerequisites

Please contact with your cluster admin to ensure that whether azure rdma is enabled in your cluster or not.

#### Prepare build an image with necessary library.

To run AzureRDMA&IntelMPI benchmark in OpenPAI, you need to prepare a job configuration file and submit it through webportal.

OpenPAI packaged the docker env required by the job for user to use. User could refer to [DOCKER.md](./DOCKER.md) to customize this example docker env. If user have built a customized image and pushed it to Dcoker Hub, replace our pre-build image ```openpai/pai.example.horovod-intelmpi-az-rdma```with your own.

###### 
```json
{
  "jobName": "intel-mpi-benchmark",
  "image": "openpai/pai.example.horovod-intelmpi-az-rdma",
  "virtualCluster": "default",
  "taskRoles": [
    {
      "name": "master",
      "taskNumber": 1,
      "cpuNumber": 2,
      "memoryMB": 10240,
      "shmMB": 256,
      "gpuNumber": 1,
      "minFailedTaskCount": 1,
      "minSucceededTaskCount": 1,
      "command": "/opt/intel/impi/5.1.3.223/bin64/mpirun -d -hosts worker-0,master-0 -n 2 -ppn 1 -env I_MPI_FABRICS=shm:dapl -env I_MPI_DAPL_PROVIDER=ofa-v2-ib0 /opt/intel/impi/5.1.3.223/bin64/IMB-MPI1 >> mpirun.contianer",
      "portList": []
    },
    {
      "name": "worker",
      "taskNumber": 1,
      "cpuNumber": 2,
      "memoryMB": 10240,
      "shmMB": 256,
      "gpuNumber": 1,
      "minFailedTaskCount": 1,
      "minSucceededTaskCount": 1,
      "command": "while true; do sleep 1000; done",
      "portList": []
    }
  ],
  "jobEnvs": {
    "paiAzRDMA": true
  }
}
```  

For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/job_tutorial.md#json-config-file-for-job-submission).