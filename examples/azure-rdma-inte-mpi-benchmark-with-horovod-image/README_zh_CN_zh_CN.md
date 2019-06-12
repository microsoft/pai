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

Users should prepare their own intel mpi licences to build the docker image. When building docker image, please refer to [DOCKER.md](./DOCKER.md)

###### 

```json
{
  "jobName": "intel-mpi-benchmark",
  "image": "your/images/url",
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
      "command": "sleep 1000 &&  /opt/intel/impi/5.1.3.223/bin64/mpirun -d -hosts worker-0,master-0 -n 2 -ppn 1 -env I_MPI_FABRICS=shm:dapl -env I_MPI_DAPL_PROVIDER=ofa-v2-ib0 /opt/intel/impi/5.1.3.223/bin64/IMB-MPI1"
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
      "command": "sleep infinity"
    }
  ],
  "jobEnvs": {
    "paiAzRDMA": true
  }
}
```

- For more details on how to write a job configuration file, please refer to [job tutorial](../../docs/user/training.md).
- Sleep 1000 in ```master-0``` is a hack to ensure that all work containers are ready. You could optimize it in a better way. For example try to ssh all the work containers with the hostanme ```${taskname}-${taskid}``` until sccessful.
- If user wanna a AZ-RDMA capable container. The following parameter is necessary.

```bash
"jobEnvs": {
    "paiAzRDMA": true
  }
```