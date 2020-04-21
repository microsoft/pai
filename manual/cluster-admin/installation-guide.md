# Installation Guide

1. [Installation Guide](./installation-guide.md) (this document)
    - [From Scratch](#from-scratch)
    - [From Previous Deployment](#from-previous-deployment)
2. [Installation FAQs and Troubleshooting](./installation-faqs-and-troubleshooting.md)
3. [Basic Management Operations](./basic-management-operations.md)
4. [How to Manage Users and Groups](./how-to-manage-users-and-groups.md)
5. [How to Setup Kubernetes Persistent Volumes as Storage](./how-to-set-up-pv-storage.md)
6. [How to Set Up Virtual Clusters](./how-to-set-up-virtual-clusters.md)
7. [How to Add and Remove Nodes](./how-to-add-and-remove-nodes.md)
8. [How to use CPU Nodes](./how-to-use-cpu-nodes.md)
9. [How to Customize Cluster by Plugins](./how-to-customize-cluster-by-plugins.md)
10. [Troubleshooting](./troubleshooting.md)
11. [How to Uninstall OpenPAI](./how-to-uninstall-openpai.md)
12. [Upgrade Guide](./upgrade-guide.md)

There are breaking changes since OpenPAI `v0.18.0`. Before `v0.18.0`, OpenPAI was based on Yarn and Kubernetes, and data was managed by HDFS. Since `v0.18.0` (we might want to change this to v1.0 later after release), OpenPAI has switched to a pure Kubernetes-based architecture. Many new features, such as `AAD authorization`, `Hivedscheduler`, `Kube Runtime`, `Marketplace`, etc., are also included. If you want to install the Yarn-based OpenPAI, please stay with `v0.14.0`.

Here we provide installation guides of two situations: 1. [Installation from fresh new machines](#from-scratch) 2. [Installation from old OpenPAI version](#from-previous-deployment).

## From Scratch

We recommend to use kubespray to deploy OpenPAI cluster. You should have at least 3 separate machines: one dev box machine, one master machine, and one worker machine. 

Dev box machine controls masters and workers through SSH during installation, maintainence, and uninstallation. There should be one, and only one dev box. Master machine is used to run core Kubernetes components and core OpenPAI services. In most cases, one master machine is enough. You may set multiple masters if you want the cluster to be highly-available. We recommend you to use CPU-only machines for dev box and master. For worker machines, all of them should have GPUs, and have GPU driver correctly installed. **Also, they must have the same hardware, e.g. CPU type and number, GPU type and number, memory size. Please refer to [FAQs](./installation-faqs-and-troubleshooting.md#installation-faqs) if you have any question.**

### Create Configurations

After you have decided all of the machines, please create a `master.csv`, a `worker.csv`, and a `config` file on the dev box. The following is the format and example of these 3 files.

###### `master.csv` format
```
hostname(Node Name in k8s),host-ip
```
###### `master.csv` example
```
openpai-master-01,10.1.0.1
```
###### `worker.csv` format
```
hostname(Node Name in k8s),host-ip
```
###### `worker.csv` example
```
openpai-001,10.0.0.1
openpai-002,10.0.0.2
openpai-003,10.0.0.3
openpai-004,10.0.0.4
```

###### `config` example

```yaml
branch-name: pai-0.18.y
docker-image-tag: v0.18.0
user: forexample
password: forexample

# Optional
# docker-registry-domain: docker.io
# docker-registry-namespace: openpai
# docker-registry-username: exampleuser
# docker-registry-password: examplepasswd

# docker-data-root: /mnt/docker
# docker-iptables-enabled: false
# gcr-image-repo: "gcr.io"
# kube-image-repo: "gcr.io/google-containers"
# quay-image-repo: "quay.io"
# docker-image-repo: "docker.io"
```

`branch-name` and `docker-image-tag` stands for OpenPAI version you want to install. The `user` and `password` is the SSH username and password from dev box machine to master machines and worker machines. In other words, you should make sure all masters and workers share the same SSH username and password. As for optional configurations, customize them if you know exactly what they are.

### Check environment requirement

To prevent problems during installation, you should check your environment first. OpenPAI uses kubespray to deploy Kubernetes. Thus some requirements are from kubespray, while others are from OpenPAI services.

Your checklist:

- Dev Box Machine
    - Kubespray Requirement
        - Ubuntu 16.04 (18.04 should work, but not fully tested.)
        - Server can communicate with all other machine (master and worker machines)
        - SSH service is enabled and share the same username/password and have sudo privilege
        - Passwordless ssh to all other machines (master and worker machines)
        - Be separate from cluster which contains infra machines and worker machines   
    - OpenPAI Requirement
        - Docker is installed, and it is used to start up dev-box container for service deployment.
    
- Master Machines:
    - Kubespray Requirement
        - Assign each server a **static IP address**, and make sure servers can communicate each other. 
        - Server can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.
        - SSH service is enabled and share the same username/password and have sudo privilege.
        - NTP service is enabled, and etcd is depended on it.
    - OpenPAI Requirement
        - Ubuntu 16.04 (18.04 should work, but not fully tested.)
        - OpenPAI reserves memory and CPU for service running, so make sure there are enough resource to run machine learning jobs. Check hardware requirements for details.
        - Dedicated servers for OpenPAI. OpenPAI manages all CPU, memory and GPU resources of servers. If there is any other workload, it may cause unknown problem due to insufficient resource.

- Worker Machines:
    - Kubespray Requirement
        - Assign each server a **static IP address**, and make sure servers can communicate with each other. 
        - Server can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.
        - SSH service is enabled and share the same username/password and have sudo privilege.
    - OpenPAI Requirement
        - Ubuntu 16.04 (18.04 should work, but not fully tested.)
        - **GPU driver is installed.** 
        - **Docker is installed.**
        - **Nvidia docker runtime or other device runtime is installed. And be configured as the default runtime of docker. Please configure it in [docker-config-file](https://docs.docker.com/config/daemon/#configure-the-docker-daemon), because kubespray will overwrite systemd's env.**
            - An example of ```/etc/docker/daemon.json``` to configure nvidia-runtime as default runtime.
                <pre>
                {
                  "default-runtime": "nvidia",
                  "runtimes": {
                      "nvidia": {
                          "path": "/usr/bin/nvidia-container-runtime",
                          "runtimeArgs": []
                      }
                  }
                }
                </pre>
        - OpenPAI reserves memory and CPU for service running, so make sure there are enough resource to run machine learning jobs. Check hardware requirements for details.
        - Dedicated servers for OpenPAI. OpenPAI manages all CPU, memory and GPU resources of servers. If there is any other workload, it may cause unknown problem due to insufficient resource.

To simplify the pre-checks, you can use a script on the **dev box machine** to help you verify the environment:

```bash
git clone https://github.com/microsoft/pai.git
git checkout pai-0.18.y  # change to a different branch if you want to deploy a different version
cd pai/contrib/kubespray
/bin/bash requirement.sh -m /path/to/master.csv -w /path/tp/worker.csv -c /path/to/config
```

Since all worker machines should have GPU driver installed, you might wonder which version of GPU driver you should install. Please refer to [FAQs](./installation-faqs-and-troubleshooting.md#installation-faqs) for this question.

### Start Installation

On the dev box machine, use the following commands to clone the OpenPAI repo if you have not done it yet:

```bash
git clone https://github.com/microsoft/pai.git
git checkout pai-0.18.y  # change to a different branch if you want to deploy a different version
cd pai/contrib/kubespray
```

The folder `pai/contrib/kubespray` contains installation scripts, both for kubespray and OpenPAI services. Please run the following script to deploy Kubernetes first:

```bash
/bin/bash quick-start-kubespray.sh -m /path/to/master.csv -w /path/tp/worker.csv -c /path/to/config
```

After Kubernetes is successfully started, run the following script to start OpenPAI services:

```bash
/bin/bash quick-start-service.sh -m /path/to/master.csv -w /path/tp/worker.csv -c /path/to/config
```

If everything goes well, you will get a message as follows:

```
Kubernetes cluster config :     ~/pai-deploy/kube/config
OpenPAI cluster config    :     ~/pai-deploy/cluster-cfg
OpenPAI cluster ID        :     pai
Default username          :     admin
Default password          :     admin-password

You can go to http://<your-master-ip>, then use the default username and password to log in.
```

As the message says, you can use `admin` and `admin-password` to login to the webportal, then submit a job to validate your installation.

### Keep a Folder

We highly recommend you to keep the folder `~/pai-deploy` for future operations such as upgrade, maintainence, and uninstallation. The most important contents in this folder are:

  - Kubernetes cluster config (the default is `~/pai-deploy/kube/config`): K8s config file. It is used to connect to K8s api server.
  - OpenPAI cluster config (the default is  `~/pai-deploy/cluster-cfg`): It is a folder containing machine layout and OpenPAI service configurations.

If it is possible, you can make a backup of `~/pai-deploy` in case it is deleted unexpectly.

Apart from the folder, you should remember your openPAI cluster ID, which is used to indicate your OpenPAI cluster. The default value is `pai`. Some manegement operation needs a confirmation of this cluster ID.

## From Previous Deployment

### Save your Data to a Different Place

If you have installed OpenPAI before `v0.18.0`, please notice that the upgrade from older version to version >= `v0.18.0` cannot preserve any useful data: all jobs, user information, dataset will be lost inevitably and irreversibly. Thus, if you have any useful data in previous deployment, please make sure you have saved them to a different place.

#### HDFS Data

Before `v0.18.0`, PAI will deploy an HDFS server for you. After `v0.18.0`, the HDFS server won't be deployed and previous data will be removed in upgrade. The following commands could be used to transfer your HDFS data:

```bash
# check data structure
hdfs dfs -ls hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/

hdfs dfs -copyToLocal hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/ <local-folder>
```

`<hdfs-namenode-ip>` and `<hdfs-namenode-port>` is the ip of PAI master and `9000` if you did't modify the default setting. Please make sure your local folder has enough capacity to hold the data you want to save.

#### Metadata of Jobs and Users

Metadata of jobs and users will also be lost, including job records, job log, user name, user password, etc. We do not have an automatical tool for you to backup these data. Please transfer the data manually if you find some are valuable.

#### Other Resources on Kubernetes

If you have deployed any other resources on Kubernetes, please make a proper backup for them, because the Kubernetes cluster will be destroyed, too.

### Remove Previous PAI deployment

To remove the previous deployment, please use the commands below:

```bash
git clone https://github.com/Microsoft/pai.git
cd pai
#  checkout to a different branch if you have a different version
git checkout pai-0.14.y

# delete all pai service and remove all service data
./paictl.py service delete

# delete k8s cluster
./paictl.py cluster k8s-clean -f -p <path-to-your-old-config>
```

If you cannot find the old config, the following command can help you to retrieve it:

```bash
./paictl.py config pull -o <path-to-your-old-config>
```

You should also remove the GPU driver installed by OpenPAI, by executing the following commands on every GPU node, using a `root` user:

```bash
#!/bin/bash

lsmod | grep -qE "^nvidia" &&
{
    DEP_MODS=`lsmod | tr -s " " | grep -E "^nvidia" | cut -f 4 -d " "`
    for mod in ${DEP_MODS//,/ }
    do
        rmmod $mod ||
        {
            echo "The driver $mod is still in use, can't unload it."
            exit 1
        }
    done
    rmmod nvidia ||
    {
        echo "The driver nvidia is still in use, can't unload it."
        exit 1
    }
}

rm -rf /var/drivers
reboot
```

After the removal, you can now install OpenPAI >= `v0.18.0` [from scratch](#from-scratch).