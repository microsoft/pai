# Tutorial: Booting up the cluster

This document introduces the detailed procedures to boot up PAI on a cluster. Please refer to this [section](../README.md) if user need the complete information on cluster deployment and maintenance.

Please refer to Section [single box deployment](./single-box-deployment.md) if user would like to deploy PAI on a single server.


Table of contents:
<!-- TOC depthFrom:2 depthTo:3 -->

- [Overview](#overview)
- [Quick deploy with default settings](#quickdeploy)
- [Customized deploy](#customizeddeploy)
- [Appendix: Default values in auto-generated configuration files](#appendix)

<!-- /TOC -->

## Overview <a name="overview"></a>

We assume that the whole cluster has already been configured by the system maintainer to meet the [Prerequisites](../../README.md#how-to-deploy).

With the cluster being set up, the steps to bring PAI up on it are as follows:

- Step 0. Prepare dev-box
- Step 1. Prepare PAI configuration.
    - (For advanced users) This step can either be done by writing the configuration files manually,
    - (For novice users) or be done using the `paictl` tool.
- Step 2. Boot up Kubernetes.
- Step 3. Start all PAI services.

## Quick deploy with default settings <a name="quickdeploy"></a>
### Step 0. Prepare the dev-box

It is recommended to perform the operations below in a dev box.
Please refer to this [section](../pai-management/doc/how-to-setup-dev-box.md) for the details of setting up a dev-box.

### Step 1. Prepare the quick-start.yaml file <a name="step-1a"></a>

An example yaml file is shown below. Note that you should change the IP address of the machine and ssh information accordingly.

```yaml
# quick-start.yaml

# (Required) Please fill in the IP address of the server you would like to deploy OpenPAI
machines:
  - 192.168.1.11
  - 192.168.1.12
  - 192.168.1.13

# (Required) Log-in info of all machines. System administrator should guarantee
# that the username/password pair is valid and has sudo privilege.
ssh-username: pai
ssh-password: pai-password

# (Optional, default=22) Port number of ssh service on each machine.
#ssh-port: 22

# (Optional, default=DNS of the first machine) Cluster DNS.
#dns: <ip-of-dns>

# (Optional, default=10.254.0.0/16) IP range used by Kubernetes. Note that
# this IP range should NOT conflict with the current network.
#service-cluster-ip-range: <ip-range-for-k8s>

```

### Step 2. Generate OpenPAI configuration files

After the quick-start.yaml is ready, use it to generate four configuration yaml files as follows.

```
python paictl.py cluster generate-configuration -i ~/quick-start.yaml -o ~/pai-config -f
```

The command will generate the following four yaml files.

```
cluster-configuration.yaml
k8s-role-definition.yaml
kubernetes-configuration.yaml
serivices-configuration.yaml
```
Please refer to this [section](../pai-management/doc/how-to-write-pai-configuration.md) for the details of the configuration files.

### Step 3. Boot up Kubernetes

Use the four yaml files to boot up k8s.
Please refer to this [section](../pai-management/doc/cluster-bootup.md#step-2) for details.

### Step 4. Start all OpenPAI services

After k8s starts, boot up all OpenPAI services.
Please refer to this [section](../pai-management/doc/cluster-bootup.md#step-3) for details.

## Customized deploy <a name="customizeddeploy"></a>
### Step 0. Prepare the dev-box

It is recommended to perform the operations below in a dev box.
Please refer to this [section](../pai-management/doc/how-to-setup-dev-box.md) for the details of setting up a dev-box.

### Step 1. Prepare PAI configuration: Manual approach <a name="step-1a"></a>

This method is for advanced users. PAI configuration consists of 4 YAML files:

- [`cluster-configuration.yaml`](./how-to-write-pai-configuration.md#cluster_configuration) - Machine-level configurations, including login info, machine SKUs, labels of each machine, etc.
- [`kubernetes-configuration.yaml`](./how-to-write-pai-configuration.md#kubernetes_configuration) - Kubernetes-level configurations, part 1. This file contains basic configurations of Kubernetes, such as the version info, network configurations, etc.
- [`k8s-role-definition.yaml`](./how-to-write-pai-configuration.md#k8s_role_definition) - Kubernetes-level configurations, part 2. This file contains the mappings of Kubernetes roles and machine labels.
- [`serivices-configuration.yaml`](./how-to-write-pai-configuration.md#services_configuration) - Service-level configurations. This file contains the definitions of cluster id, docker registry, and those of all individual PAI services.

There are two ways to prepare the above 4 PAI configuration files. The first one is to prepare them manually. The description of each field in these configuration files can be found in [A Guide For Cluster Configuration](how-to-write-pai-configuration.md).

If you want to deploy PAI in single box environment, please refer to [Single Box Deployment](single-box-deployment.md) to edit configuration files.

### Step 2. Boot up Kubernetes <a name="step-2"></a>

After the configuration files are prepared, the Kubernetes services can be started using `paictl` tool:

```
python paictl.py cluster k8s-bootup \
  -p /path/to/cluster-configuration/dir
```

The `paictl` tool does the following things:

- Install `kubectl` command in the current machine (the dev-box).
- Generate Kubernetes-related configuration files based on `cluster-configuration.yaml`, `kubernetes-configuration.yaml` and `k8s-role-definition.yaml`.
- Use `kubectl` to boot up Kubernetes on target machines.

After this step, the system maintainer can check the status of Kubernetes by accessing Kubernetes Dashboard:
```
http://<master>:9090
```
where `<master>` denotes the IP address of the load balancer of Kubernetes master nodes. When there is only one master node and a load balancer is not used, it is usually the IP address of the master node itself.

### Step 3. Start all PAI services <a name="step-3"></a>

When Kubernetes is up and running, PAI services can then be deployed to it using `paictl` tool:

```
python paictl.py service start \
  -p /path/to/cluster-configuration/dir \
  [ -n service-name ]
```

If the `-n` parameter is specified, only the given service, e.g. `rest-server`, `webportal`, `watchdog`, etc., will be deployed. If not, all PAI services will be deployed. In the latter case, the above command does the following things:

- Generate Kubernetes-related configuration files based on `cluster-configuration.yaml`.
- Use `kubectl` to set up config maps and create pods on Kubernetes.

After this step, the system maintainer can check the status of PAI services by accessing PAI web portal:
```
http://<master>:9286
```
where `<master>` is the same as in the previous [section](#step-2).

## Appendix: Default values in auto-generated configuration files <a name="appendix"></a>

The `paictl` tool sets the following default values in the 4 configuration files:

- The first machine in the machine list will be configured as the master node.
- If not explicitly specified, the SSH port is set to `22`.
- If not explicitly specified, the cluster DNS is set to the value of the `nameserver` field in `/etc/resolv.conf` file of the master node.
- If not explicitly specified, the IP range used by Kubernetes is set to `10.254.0.0/16`.
- The docker registry is set to `docker.io`, and the docker namespace is set to `openpai`. In another word, all PAI service images will be pulled from `docker.io/openpai` (see [this link](https://hub.docker.com/r/openpai/) on DockerHub for the details of all images).
- Cluster id is set to `pai-example`.
- Cluster id is set to `pai-example`.
- REST server's admin user is set to `admin`, and its password is set to `admin-password`
- There is only one VC in the system, `default`, which has 100% of the resource capacity.
