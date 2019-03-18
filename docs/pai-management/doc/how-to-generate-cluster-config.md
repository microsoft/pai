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

## Generate configuration from template

### Index

- [Step 1. Write Quick Start Configuration](#Quick)
- [Step 2. Generate OpenPAI configuration files](#Generate)
- [Optional Step 3. Customize configure OpenPAI](#Customize)




### Step 1. Write Quick start <a name="Generate"></a>

There is a example file in the [link](./../../../deployment/quick-start/quick-start-example.yaml) .

An example yaml file is shown below. Note that you should change the IP address of the machine and ssh information accordingly.

```YAML
# quick-start.yaml

# (Required) Please fill in the IP address of the server you would like to deploy OpenPAI
machines:
  - 192.168.1.11
  - 192.168.1.12
  - 192.168.1.13

# (Required) Log-in info of all machines. System administrator should guarantee
# that the username/password pair or username/key-filename is valid and has sudo privilege.
ssh-username: pai
ssh-password: pai-password

# (Optional, default=None) the key file that ssh client uses, that has higher priority then password.
#ssh-keyfile-path: <keyfile-path>

# (Optional, default=22) Port number of ssh service on each machine.
#ssh-port: 22

# (Optional, default=DNS of the first machine) Cluster DNS.
#dns: <ip-of-dns>

# (Optional, default=10.254.0.0/16) IP range used by Kubernetes. Note that
# this IP range should NOT conflict with the current network.
#service-cluster-ip-range: <ip-range-for-k8s>
```

### Step 2. Generate OpenPAI configuration files <a name="Generate"></a>

##### (1) generate configuration files

```bash
cd /pai

# cmd should be executed under pai directory in the dev-box.

python paictl.py config generate -i /pai/deployment/quick-start/quick-start.yaml -o ~/pai-config -f
```

##### (2) update docker tag to release version

```bash
vi ~/pai-config/services-configuration.yaml
```
For example: v0.x.y branch, user should change docker-tag to v0.x.y.
```bash
docker-tag: v0.x.y
```

##### (3) changing gpu count and type

Quick start will generate node with 1 gpu with type generic, this may not suit your situation, for example, if you have two types of machines, and one type has 4 Tesla K80 gpu cards, and another has 2 Tesla P100 cards, you should modify your ~/pai-config/layout.yaml as following:

```YAML
machine-sku:
  k80-node:
    mem: 40G
    gpu:
      type: Tesla K80
      count: 4
    cpu:
      vcore: 24
    os: ubuntu16.04
  p100-node:
    mem: 20G
    gpu:
      type: Tesla P100
      count: 2
    cpu:
      vcore: 24
    os: ubuntu16.04

machine-list:
  - hostname: xxx
    hostip: yyy
    machine-type: k80-node
  - hostname: xxx
    hostip: yyy
    machine-type: p100-node
```

##### (4) The default value in the generated configuration
The `paictl` tool sets the following default values in the 4 configuration files:

| Configuration Property | Default value |
| --- | --- |
| ```master node``` | The first machine in the machine list will be configured as the master node. |
| ```SSH port``` | If not explicitly specified, the SSH port is set to `22`. |
| ```cluster DNS``` | If not explicitly specified, the cluster DNS is set to the value of the `nameserver` field in `/etc/resolv.conf` file of the master node. |
| ```IP range used by Kubernetes``` | If not explicitly specified, the IP range used by Kubernetes is set to `10.254.0.0/16`. |
| ```docker registry``` | The docker registry is set to `docker.io`, and the docker namespace is set to `openpai`. In another word, all PAI service images will be pulled from `docker.io/openpai` (see [this link](https://hub.docker.com/r/openpai/) on DockerHub for the details of all images). |
| ```Cluster id``` | Cluster id is set to `pai-example` |
| ```REST server's admin user``` | REST server's admin user is set to `admin`, and its password is set to `admin-password` |
| ```VC``` | There is only one VC in the system, `default`, which has 100% of the resource capacity. |

<a name="Customize"></a>
### Optional Step 3. Customize configure OpenPAI
This method is for advanced users.

The description of each field in these configuration files can be found in [A Guide For Cluster Configuration](./customized-configuration.md).

If user want to customize configuration, please see the table below
- Configure OpenPAI from scenarios
    - placement
      - [configure node placement of service](./how-to-configure-layout.md#machineList)
      - [configure install gpu driver on which server](./how-to-configure-layout.md#gpu_driver)
    - scheduling
      - [configure virtual cluster capacity](./how-to-congiure-service-config.md#configure_vc_capacity)
    - account
      - [configure customize docker repository](./how-to-congiure-service-config.md#ref_cluster_config)
      - [configure OpenPAI admin user account](./how-to-congiure-service-config.md#ref_rest_server)
    - port / data folder etc.
      - [configure service entry](./how-to-congiure-service-config.md#optional)
      - [configure HDFS data / OpenPAI temp data folder](./how-to-congiure-service-config.md#ref_cluster_config)
    - component version
      - [configure K8s component version](./how-to-configure-k8s-config.md#kubernetes)
      - [configure nvidia gpu driver version](./how-to-congiure-service-config.md#ref_drivers)
    - HA
      - [Kubernetes High Availability Configuration](./kubernetes-ha.md)

- [Configure OpenPAI from files](./customized-configuration.md)
  - Cluster related configuration: [configuration of layout.yaml](./how-to-configure-layout.md)
  - Kubernetes role related configuration: It will be deprecated
  - Kubernetes related configuration: [configuration of kubernetes-configuration.yaml](./how-to-configure-k8s-config.md)
  - Service related configuration: [configuration of services-configuration.yaml](./how-to-congiure-service-config.md)

- [Configure OpenPAI services](./how-to-congiure-service-config.md#optional) [Note: This part is for advanced user who wants to customize OpenPAI each service]
