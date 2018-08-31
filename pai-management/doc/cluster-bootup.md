# OpenPAI deployment

This document introduces the detailed procedures to boot up PAI on a cluster. Please refer to this [section](../README.md), if user need the complete information on cluster deployment and maintenance.

## Table of contents:
<!-- TOC depthFrom:2 depthTo:3 -->

- [OpenPAI deployment](#overview)
  - [Customized deploy](#customizeddeploy)
  - [Single Box deploy](#singlebox)
- [Troubleshooting](#problem)
  - [Troubleshooting OpenPAI services](#troubleshooting_1)
  - [Troubleshooting Kubernetes Clusters](#troubleshooting_2)
  - [Getting help](#troubleshooting_3)
- [OpenPAI Maintenance](#maintenance)

<!-- /TOC -->

## OpenPAI deploy <a name="overview"></a>

We assume that the whole cluster has already been configured by the system maintainer to meet the [Prerequisites](../../README.md#how-to-deploy).

## Table of contents

- [Customized deploy](#customizeddeploy)
- [Single Box deploy](#singlebox)

With the cluster being set up, the steps to bring PAI up on it are as follows:

## Customized deploy <a name="customizeddeploy"></a>

### Steps:
- [Step 0. Prepare the dev-box](#c-step-0)
- [Step 1. Prepare the quick-start.yaml file](#c-step-1)
- [Step 2. Generate OpenPAI configuration files](#c-step-2)
- [Step 3(Optional). Customize configure OpenPAI](#c-step-3)
- [Step 4. Boot up Kubernetes](#c-step-4)
- [Step 5. Start all PAI services](#c-step-5)

### Step 0. Prepare the dev-box <a name="c-step-0"></a>

It is recommended to perform the operations below in a dev box.

```Dev-box``` is a docker container used to boot up or/and maintain a PAI cluster. For convenience, we provide a prebuild Docker image on Docker Hub.

Please refer to this [section](./how-to-setup-dev-box.md) for the customize setting up a dev-box.

#### Use prebuild dev-box image

##### (1) Run your dev-box

```bash

# Pull the dev-box image from Docker Hub
sudo docker pull docker.io/openpai/dev-box

# Run your dev-box
# Assume the path of custom-hadoop-binary-path in your service-configuration is /pathHadoop,
#   and the path of your cluster-configuration is /pathConfiguration.
# By now, you can leave it as it is, we only mount those two directories into docker container for later usage.
sudo docker run -itd \
        -e COLUMNS=$COLUMNS -e LINES=$LINES -e TERM=$TERM \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /pathHadoop:/pathHadoop \
        -v /pathConfiguration:/cluster-configuration  \
        --pid=host \
        --privileged=true \
        --net=host \
        --name=dev-box \
        docker.io/openpai/dev-box
```
##### (2) Working in your dev-box

```bash
sudo docker exec -it dev-box /bin/bash
```

##### (3) Go to pai-management working dir

```bash
cd /pai/pai-management
```

Now you are free to configure your cluster and run PAI commands...

#### How to check

- exec cmd:

```bash
sudo docker ps
```

- sucessful result:
```bash
24c286d888f5        openpai/dev-box                                       "/container-setup.sh"    3 days ago          Up 3 days                                    dev-box
```

### Step 1. Prepare the quick-start.yaml file <a name="c-step-1"></a>

Prepare the file under dev-box folder: /pai/pai-management/quick-start 

There is a example file under path: /pai/pai-management/quick-start/quick-start-example.yaml 

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

#### How to check

Check all configruation items of the quick-start.yaml are correct.

### Step 2. Generate OpenPAI configuration files <a name="c-step-2"></a>

After the quick-start.yaml is ready, use it to generate four configuration yaml files as follows.

```bash
cd /pai/pai-management

# cmd should be executed under /pai/pai-management directory in the dev-box.

python paictl.py cluster generate-configuration -i /pai/pai-management/quick-start/quick-start.yaml -o ~/pai-config -f
```

[Appendix: Default values in auto-generated configuration files](./how-to-write-pai-configuration.md#appendix)

#### How to check
The command will generate the following four yaml files.

```
cluster-configuration.yaml
k8s-role-definition.yaml
kubernetes-configuration.yaml
serivices-configuration.yaml
```

Please refer to this [section](./how-to-write-pai-configuration.md) for the details of the configuration files.

### Step 3(Optional). Customize configure OpenPAI <a name="c-step-3"></a>

This method is for advanced users. 

The description of each field in these configuration files can be found in [A Guide For Cluster Configuration](how-to-write-pai-configuration.md).

If user want to customize configuration, please see the table below
- Configure OpenPAI from scenarios
    - placement
      - [configure node placement of service](./how-to-write-pai-configuration.md#service_placement)
      - [configure install gpu driver on which server](./how-to-write-pai-configuration.md#gpu_driver)
    - scheduling
      - [configure virtual cluster capacity](./how-to-write-pai-configuration.md#configure_vc_capacity)
    - account
      - [configure customize docker repository](./how-to-write-pai-configuration.md#docker_repo)
      - [configure OpenPAI admin user account](./how-to-write-pai-configuration.md#configure_user_acc)
    - port / data folder etc.
      - [configure service entry](./how-to-write-pai-configuration.md#configure_service_entry) 
      - [configure HDFS data / OpenPAI temp data folder](./how-to-write-pai-configuration.md#data_folder)
    - component version 
      - [configure K8s component version](./how-to-write-pai-configuration.md#k8s_component)
      - [configure docker version](./how-to-write-pai-configuration.md#docker_repo)
      - [configure nvidia gpu driver version](./how-to-write-pai-configuration.md#driver_version)
    - HA
      - [Kubernetes High Availability Configuration](./how-to-write-pai-configuration.md#k8s-high-availability-configuration)

- [Configure OpenPAI from files](./how-to-write-pai-configuration.md)
  - Cluster related configuration: [configuration of cluster-configuration.yaml](./how-to-write-pai-configuration.md#cluster_configuration)
  - Kubernetes role related configuration: [configuration of k8s-role-definition.yaml](./how-to-write-pai-configuration.md#k8s_role_definition)
  - Kubernetes related configuration: [configuration of kubernetes-configuration.yaml](./how-to-write-pai-configuration.md#kubernetes_configuration)
  - Service related configuration: [configuration of services-configuration.yaml](./how-to-write-pai-configuration.md#services_configuration)

- [Configure OpenPAI services](./how-to-write-pai-service-configuration.md) [Note: This part is for advanced user who wants to customize OpenPAI each service]
    - [Kubernetes](./how-to-write-pai-service-configuration.md#kubernetes)
    - Webportal
      - [Webportal](./how-to-write-pai-service-configuration.md#webportal)
      - [Pylon](./how-to-write-pai-service-configuration.md#pylon)
    - FrameworkLauncher
      - [FrameworkLauncher](./how-to-write-pai-service-configuration.md#frameworklauncher)
      - [Rest-server](./how-to-write-pai-service-configuration.md#restserver)
    - Hadoop
      - [YARN / HDFS](./how-to-write-pai-service-configuration.md#hadoop)
      - [Zookeeper](./how-to-write-pai-service-configuration.md#zookeeper)
    - Monitor
      - [Prometheus / Exporter](./how-to-write-pai-service-configuration.md#prometheus) 
      - [Grafana](./how-to-write-pai-service-configuration.md#grafana)
- [Appendix: Default values in auto-generated configuration files](./how-to-write-pai-configuration.md#appendix)

#### How to check

Check all configruation items are correct.


### Step 4. Boot up Kubernetes <a name="c-step-4"></a>

After the configuration files are prepared, the Kubernetes services can be started using `paictl` tool:

```
cd /pai/pai-management

# cmd should be executed under /pai/pai-management directory in the dev-box.

python paictl.py cluster k8s-bootup \
  -p ~/pai-config
```

The `paictl` tool does the following things:

- Install `kubectl` command in the current machine (the dev-box).

- Generate Kubernetes-related configuration files based on `cluster-configuration.yaml`, `kubernetes-configuration.yaml` and `k8s-role-definition.yaml`.

- Use `kubectl` to boot up Kubernetes on target machines.


#### How to check

After this step, the system maintainer can check the status of Kubernetes by accessing Kubernetes Dashboard:

```
http://<master>:9090
```

Where `<master>` denotes the IP address of the load balancer of Kubernetes master nodes. When there is only one master node and a load balancer is not used, it is usually the IP address of the master node itself.

### Step 5. Start all PAI services <a name="c-step-5"></a>

When Kubernetes is up and running, PAI services can then be deployed to it using `paictl` tool:

```
cd /pai/pai-management

# cmd should be executed under /pai/pai-management directory in the dev-box.

python paictl.py service start \
  -p ~/pai-config \
  [ -n service-name ]
```

If the `-n` parameter is specified, only the given service, e.g. `rest-server`, `webportal`, `watchdog`, etc., will be deployed. If not, all PAI services will be deployed. In the latter case, the above command does the following things:

- Generate Kubernetes-related configuration files based on `cluster-configuration.yaml`.

- Use `kubectl` to set up config maps and create pods on Kubernetes.

#### How to check

After this step, the system maintainer can check the status of OpenPAI services by accessing OpenPAI kubernetes web portal:

```
http://<master>:9090/#!/pod?namespace=default
```

Where `<master>` is the same as in the previous [section](#step-2).

## Singlebox deploy <a name="singlebox"></a> 

### Steps:

- [Step 0. Prepare the dev-box](#c-step-0)

- Step 1. Prepare the quick-start.yaml file

Prepare the file under dev-box folder: /pai/pai-management/quick-start 

There is a example file under path: /pai/pai-management/quick-start/quick-start-example.yaml 

An example yaml file is shown below. Note that you should change the IP address of the machine and ssh information accordingly.

```yaml
# quick-start.yaml

# (Required) Please fill in the IP address of the server you would like to deploy PAI
# For single box deployment, user only need configure 1 ip address
machines:
  - 192.168.1.11

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

- [Step 2. Generate OpenPAI configuration files](#c-step-2)
- [Step 4. Boot up Kubernetes](#c-step-4)
- [Step 5. Start all PAI services](#c-step-5)

## Troubleshooting <a name="problem"></a>

### Table of contents:

- [1 Troubleshooting OpenPAI services](#troubleshooting_1)

  - [1.1 Diagnosing the problem](#troubleshooting_1.1)

  - [1.2 Fix problem](#troubleshooting_1.2)

  - [1.3 Reboot service](#troubleshooting_1.3)

- [2 Troubleshooting Kubernetes Clusters](#troubleshooting_2)
- [3 Getting help](#troubleshooting_3)

### 1 Troubleshooting OpenPAI services <a name="troubleshooting_1"></a>
 
#### 1.1 Diagnosing the problem  <a name="troubleshooting_1.1"></a>

- Monitor

```From kubernetes webportal```:

Dashboard:

```
http://<master>:9090
```

![PAI_deploy_log](./images/PAI_deploy_pod.png)

```From OpenPAI watchdog```:

[OpenPAI watchdog](../../prometheus/doc/watchdog-metrics.md)

- Log

```From kubernetes webportal```:

![PAI_deploy_pod](./images/PAI_deploy_log.png)

```From each node container / pods log file```:

View containers log under folder:

```bash
ls /var/log/containers
```

View pods log under folder:

```bash
ls /var/log/pods
```

- Debug

As OpenPAI services are deployed on kubernetes, please refer [debug kubernetes pods](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-pod-replication-controller/)

#### 1.2 Fix problem  <a name="troubleshooting_1.2"></a>
- Update OpenPAI Configuration
  
Check and refine 4 yaml files:

```
    - cluster-configuration.yaml
    - kubernetes-configuration.yaml
    - k8s-role-definition.yaml
    - serivices-configuration.yaml
```

- Customize config for specific service 

If user want to customize single service, you could find service config file at [pai-management/bootstrap](../bootstrap) and find image dockerfile at [pai-management/src](../src).

- Update Code & Image

  - Customize image dockerfile or code

User could find service's image dockerfile at [pai-management/src](#pai-management/src) and customize them. 

  - Rebuild image

User could execute the following cmds:

Build docker image

```bash
    paictl.py image build -p /path/to/configuration/ [ -n image-x ]
```

Push docker image

```bash
    paictl.py image push -p /path/to/configuration/ [ -n image-x ]
```

If the `-n` parameter is specified, only the given image, e.g. `rest-server`, `webportal`, `watchdog`, etc., will be build / push.

#### 1.3 Reboot service  <a name="troubleshooting_1.3"></a>

1. ```Stop single or all services.```

```bash
python paictl.py service stop \
  -p /path/to/cluster-configuration/dir \
  [ -n service-name ]
```

If the -n parameter is specified, only the given service, e.g. rest-server, webportal, watchdog, etc., will be stopped. If not, all PAI services will be stopped. 

2. ```Boot up single all OpenPAI services.```

Please refer to this [section](./cluster-bootup.md#step-3) for details.

### 2 Troubleshooting Kubernetes Clusters  <a name="troubleshooting_2"></a>

Please refer [Kubernetes Troubleshoot Clusters](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-cluster/)

### 3 Getting help  <a name="troubleshooting_3"></a>

- [StackOverflow:](../../docs/stackoverflow.md) If you have questions about OpenPAI, please submit question at Stackoverflow under tag: openpai
- [Report an issue:](https://github.com/Microsoft/pai/wiki/Issue-tracking) If you have issue/ bug/ new feature, please submit it at Github 

## Maintenance <a name="maintenance"></a>
####  [Service Upgrading](./machine-maintenance.md#service-maintain.md)
####  [Machine Add & Delete](./service-maintain.md#machine-maintenance.md)


