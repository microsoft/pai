# Tutorial: Booting up the cluster

This document introduces the detailed procedures to boot up PAI on an existing cluster.

Table of contents:
<!-- TOC depthFrom:2 depthTo:3 -->

- [Overview <a name="overview"></a>](#overview-a-nameoverviewa)
- [Step 1a. Prepare PAI configuration: Manual approach <a name="step-1a"></a>](#step-1a-prepare-pai-configuration-manual-approach-a-namestep-1aa)
- [Step 1b. Prepare PAI configuration: Using `paictl` tool <a name="step-1b"></a>](#step-1b-prepare-pai-configuration-using-paictl-tool-a-namestep-1ba)
- [Step 2. Boot up Kubernetes <a name="step-2"></a>](#step-2-boot-up-kubernetes-a-namestep-2a)
- [Step 3. Start all PAI services <a name="step-3"></a>](#step-3-start-all-pai-services-a-namestep-3a)
- [Appendix: Default values in auto-generated configuration files <a name="appendix"></a>](#appendix-default-values-in-auto-generated-configuration-files-a-nameappendixa)

<!-- /TOC -->

## Overview <a name="overview"></a>

We assume that the whole cluster has already been configured by the system maintainer to meet the following requirements:

- SSH service is enabled on each of the machines.
- All machines share the same username / password for the SSH service on each of them.
- The username that can be used to login to each machine should have sudo privilege.
- All machines to be set up as masters should be in the same network segment.
- A load balancer is prepared if there are multiple masters to be set up.

With the cluster being set up, the steps to bring PAI up on it are as follows:

- Step 1. Prepare PAI configuration.
    - (For advanced users) This step can either be done by writing the configuration files manually,
    - (For novice users) or be done using the `paictl` tool.
- Step 2. Boot up Kubernetes.
- Step 3. Start all PAI services.

## Step 1a. Prepare PAI configuration: Manual approach <a name="step-1a"></a>

This method is for advanced users. PAI configuration consists of 4 YAML files:

- `cluster-configuration.yaml` - Machine-lvel configurations, including login info, machine SKUs, labels of each machine, etc.
- `kubernetes-configuration.yaml` - Kubernetes-level configurations, part 1. This file contains basic configurations of Kuberntes, such as the version info, network configurations, etc.
- `k8s-role-definition.yaml` - Kubernetes-level configurations, part 2. This file contains the mappings of Kubernetes roles and machine labels.
- `serivices-configuration.yaml` - Service-level configurations. This file contains the definitions of cluster id, docker registry, and those of all individual PAI services.

There are two ways to prepare the above 4 PAI configuration files. The first one is to prepare them manually. The description of each field in these configuration files can be found in [A Guide For Cluster Configuration](how-to-write-pai-configuration.md).

## Step 1b. Prepare PAI configuration: Using `paictl` tool <a name="step-1b"></a>

The second way, which is designed for fast deployment, is to generate a set of default configuration files from a very simple stariting-point file using the `paictl` maintenance tool:

```
python paictl.py cluster generate-configuration \
  -i quick-start.yaml \
  -o /path/to/cluster-configuration/dir
```

The 4 configuration files will be stored into the `/path/to/cluster-configuration/dir` folder. Note that most of the fields in the 4 configuration fields are automatically generated using default values. See [Appendix](#appendix) for an incomplete list of these default values.

The `quick-start.yaml` file consits of the following sections:

- `machines` - The list of all machines. The first machine will be configured as the master, and all other machines will be configured as workers.
- `ssh-username` and `ssh-password`: Log-in info of all machines.
- (Optional, default=22) `ssh-port` - Port number of the SSH service on each machine.
- (Optional, default=DNS of the first machine) `dns` - Cluster DNS.
- (Optional, default=10.254.0.0/16) `service-cluster-ip-range` - IP range used by Kubernetes. Note that this IP range should NOT conflict with the current network.

Example:

```yaml
machines:
  - 192.168.1.11
  - 192.168.1.12
  - 192.168.1.13

ssh-username: pai-admin
ssh-password: pai-admin-password
```

## Step 2. Boot up Kubernetes <a name="step-2"></a>

After the configuration files are prepared, the Kubernetes services can be started using `paictl` tool:

```
paictl.py cluster start-kubernetes \
  -p /path/to/cluster-configuraiton/dir
```

The `paictl` tool does the following things:

- Install `kubectl` command in the current machine (the dev-box).
- Generate Kubernetes-related configuration files based on `cluster-configuration.yaml`, `kubernetes-configuration.yaml` and `k8s-role-definition.yaml`.
- Use `kubectl` to boot up Kubernetes on target machines.

After this step, the system maintainer can check the status of Kubernetes by accessing Kubernetes Dashboard:
```
http://<master>:9090
```
where `<master>` denotes the IP address of the load balancer of Kubernetes master nodes. In a special case when there is only one master node and a load balancer is not used, it is usually the IP address of the master node itself.

## Step 3. Start all PAI services <a name="step-3"></a>

When Kubernetes is up and running, PAI services can then be deployed to it using `paictl` tool:

```
paictl.py service start \
  -p /path/to/cluster-configuration/dir \
  [ -n service-name ]
```

If the `-n` parameter is specified, only the given service, e.g. `rest-server`, `webportal`, `watchdog`, etc., will be deployed. If not, all PAI services will be deployed. In this latter case, the above command does the following things:

- Generate Kubernetes-related configuration files based on `cluster-configuration.yaml`.
- Use `kubectl` to set up config maps and create pods on Kubernetes.

After this step, the system maintainer can check the status of PAI services by accessing PAI web portal:
```
http://<master>:9286
```
where `<master>` denotes the IP address of the load balancer of Kubernetes master nodes. In a special case when there is only one master node and a load balancer is not used, it is usually the IP address of the master node itself.

## Appendix: Default values in auto-generated configuration files <a name="appendix"></a>

The `paictl` tool sets the following default values in the 4 configuration files:

- The first machine in the machine list will be configured as the master node.
- If not explicitly specified, the SSH port is set to `22`.
- If not explicitly specified, the cluster DNS is set to the value of the `nameserver` field in `/etc/resolv.conf` file of the master node.
- If not explicitly specified, the IP range used by Kuberntes is set to `10.254.0.0/16`.
- The docker registry is set to `docker.io`, and the docker namespace is set to `openpai`. In another word, all PAI service images will be pulled from `docker.io/openpai` (see [this link](https://hub.docker.com/r/openpai/) on DockerHub for the details of all images).
- Cluster id is set to `pai-example`.
- Cluster id is set to `pai-example`.
- REST server's admin user is set to `admin`, and its password is set to `admin-password`
- There is only one VC in the system, `default`, which has 100% of the resource capacity.
