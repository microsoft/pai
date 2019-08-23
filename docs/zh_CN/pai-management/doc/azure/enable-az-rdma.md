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

#### Knowledge <a name="knowledge"></a>

The RDMA-capable instances (Important): https://docs.microsoft.com/en-us/azure/virtual-machines/linux/sizes-hpc#rdma-capable-instances

The cluster configuraiton options to enable rdma (Important): https://docs.microsoft.com/en-us/azure/virtual-machines/linux/sizes-hpc#cluster-configuration-options

The network topology considerations(Important): https://docs.microsoft.com/en-us/azure/virtual-machines/linux/sizes-hpc#network-topology-considerations

#### Steps

######     1. Mark the RDMA capable machines with label

根据[相关知识章节](#knowledge)，要在 [layout.yaml](../../../../../examples/cluster-configuration/layout.yaml) 文件中为 RDMA-capable 的服务器加上特殊标签。 Of course, you could customize the label as what you like.

For example, in this tutorial, the following label will be used.

```YAML
machine-list:
    - hostname: example-hosts
      hostip: x.x.x.x
      machine-type: example
      k8s-role: worker
      pai-worker: "true"
      # The lable of RDMA capable machines in this example
      rdma: "true"
```

######     2. Copy the Azure RDMA enable to the target path

```bash
<br />cd pai/
sudo ./paictl.py utility sftp-copy -p /path/to/cluster/config -n Azure-RDMA-enable.sh -s src/azure-rdma -d /tmp -f rdma=true

```

######     3. Enable Azure RDMA with the script

```bash
<br />cd pai/
sudo ./paictl.py utility ssh -p /path/to/cluster/config -f rdma=true -c "sudo /bin/bash /tmp/Azure-RDMA-enable.sh"

```

######     4. Restart all your rdma capable machines in azure portal

Please communicate with your cluster owner to reboot the rdma machines after the following steps.

######     5. Open the switch configuration for az-rdma whose default value is false

In the [services-configuration.yaml](../../../../../examples/cluster-configuration/services-configuration.yaml), please uncomment the configuration field ```cluster.common.az-rdma``` and set its value as ```"true""```.

For example, you should modify it as following.

```YAML
cluster:
#
  common:
#    cluster-id: pai
#    cluster-type: yarn
#
#    # HDFS, zookeeper data path on your cluster machine.
#    data-path: "/datastorage"
#
#    # Enable QoS feature or not. Default value is "true"
#    qos-switch: "true"
#
#    # If your cluster is created by Azure and the machine is rdma enabled.
#    # Set this configuration as  "true", the rdma environment will be set into your container.
    az-rdma: "true"
```

###### Note

- If you wanna enable azure rdma feature in your cluster, please ensure all the worker machines in your cluster is azure rdma capable! 
    - TODO: YARN should only schedule the rdma job to the machine with azure rdma machine.
- After enabling azure rdma feature in your cluster, everytime adding new machine or remove machine from the cluster, you should restart restserver to refresh the machinelist in it. 
    - TODO: Make restserver able to update the machinelist through configmap in a loop.