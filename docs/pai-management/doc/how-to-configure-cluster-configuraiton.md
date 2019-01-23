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

## Customize Your Cluster-Cofiguration.yaml

### Index

- [Configuration Example](#example)
- [Field 1. default-machine-properties](#defaultMachineProperties)
- [Field 2. machine-sku](#machineSku)
- [Field 3. machine-list](#machineList) 


### Example <a name="example"></a>

An example cluster-configuration.yaml is available [here](../../../examples/cluster-configuration/cluster-configuration.yaml). In the following we explain the fields in the yaml file one by one.

### Field 1. default-machine-properties <a name="defaultMachineProperties"></a>

```YAML
default-machine-properties:
  # A Linux host account with sudo permission
  username: username
  password: password
  #keyfile-path: /the/path/to/your/ssh/key
  sshport: port
```

Set the default value of ```username```, ```password```, ```keyfile-path``` and ```sshport``` in ```default-machine-properties.``` OpenPAI will use these default values to access cluster machines. User can override the default access information for each machine in [machine-list](#machineList).

Note: Please only write one of ```keyfile-path``` and ```password```

### Field 2. machine-sku <a name="machineSku"></a>

```YAML
machine-sku:
  NC24R:
    mem: 224
    gpu:
      type: teslak80
      count: 4
    cpu:
      vcore: 24
    #Note: Up to now, the only supported os version is Ubuntu16.04. Please do not change it here.
    os: ubuntu16.04
```

In this field, you could define several sku with different name. And in the ```machine-list``` you should refer your machine to one of them.

| Configuration Property | Meaning |
| --- | --- |
| mem| Memory|
| os| Now we only supported ubuntu, and pai is only tested on the version 16.04LTS.|
| gpu <a name="gpu_driver"></a>| If there is no gpu on this sku, you could remove this field.If user config gpu at sku, OpenPAI will label this node as type of gpu and will try to install gpu driver if no driver at this host.|

### Field 3. machine-list <a name="machineList"></a>

```
machine-list:

    - hostname: hostname (echo `hostname`)
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid1
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: master
      dashboard: "true"
      zkid: "1"
      pai-master: "true"
      #docker-data: /var/lib/docker

    - hostname: hostname
      hostip: IP
      machine-type: D8SV3
      etcdid: etcdid2
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: master
      node-exporter: "true"
      #docker-data: /var/lib/docker

    - hostname: hostname
      hostip: IP
      machine-type: NC24R
      #sshport: PORT (Optional)
      #username: username (Optional)
      #password: password (Optional)
      k8s-role: worker
      pai-worker: "true"
      #docker-data: /var/lib/docker
```

User could config each service deploy at which node by labeling node with service tag as below:

| Configuration Property | Meaning |
| --- | --- |
| ```hostname``` | Required. You could get the hostname by the command ```echo `hostname` ``` on the host.|
| ```hostip```| Required. The ip address of the corresponding host.
| ```machine-type``` | Required. The sku name defined in the ```machine-sku```.|
| ```sshport, username, password, keyfile-path``` | Optional. Used if this machine's account and port is different from the default properties. Or you can remove them.|
| ```etcdid``` | K8s-Master Required. The etcd is part of kubernetes master. If you assign the k8s-role=master to a node, you should set this filed. This value will be used when starting and fixing k8s.|
| ```k8s-role``` | Required. You could set this value to ```master```, ```worker``` or ```proxy```. If you want to configure more than 1 k8s-master, please refer to [Kubernetes High Availability Configuration](./kubernetes-ha.md).|
| ```dashboard``` | Select one node to set this field. And set the value as ``` "true" ```.|
| ```pai-master``` | Optional. hadoop-name-node, hadoop-resource-manager, frameworklauncher, restserver, webportal, grafana, prometheus and node-exporter.|
| ```zkid``` | Unique zookeeper id required by ```pai-master``` node(s). You can set this field from ```1``` to ```n```.|
| ```pai-worker``` | Optional. hadoop-data-node, hadoop-node-manager, and node-exporter will be deployed on a pai-work|
 ```node-exporter``` | Optional. You can assign this label to nodes to enable hardware and service monitoring.|
 ```docker-data``` | Optional. You configure this path before k8s deployment. When deploying k8s, the docker's data root will be changed to the path configured in this field. The default value is ```/var/lib/docker```. And it's same with the docker's default value. |
 
Note: To deploy PAI in a single box, users should set pai-master and pai-worker labels for the same machine in machine-list section, or just follow the quick deployment approach described in this section.
