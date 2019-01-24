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


### Enable the capability of RDMA for your VM in azure

#### Knowledge 
The RDMA-capable instances
 (Important): https://docs.microsoft.com/en-us/azure/virtual-machines/linux/sizes-hpc#rdma-capable-instances

The cluster configuraiton options to enable rdma (Important): https://docs.microsoft.com/en-us/azure/virtual-machines/linux/sizes-hpc#cluster-configuration-options

The network topology considerations(Important): https://docs.microsoft.com/en-us/azure/virtual-machines/linux/sizes-hpc#network-topology-considerations

#### Steps

###### Cluster

```-f [k1=v1 k2=v2]``` means that only execute the command on the machine which match the rule ```k1=v1 k2=v2```. Please only perform the command on the RDMA-capable machine.

```bash

```








