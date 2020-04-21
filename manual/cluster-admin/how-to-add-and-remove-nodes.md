# How to Add and Remove Nodes

1. [Installation Guide](./installation-guide.md)
2. [Installation FAQs and Troubleshooting](./installation-faqs-and-troubleshooting.md)
3. [Basic Management Operations](./basic-management-operations.md)
4. [How to Manage Users and Groups](./how-to-manage-users-and-groups.md)
5. [How to Setup Kubernetes Persistent Volumes as Storage](./how-to-set-up-pv-storage.md)
6. [How to Set Up Virtual Clusters](./how-to-set-up-virtual-clusters.md)
7. [How to Add and Remove Nodes](./how-to-add-and-remove-nodes.md) (this document)
    - [How to Add Nodes](#how-to-add-nodes)
    - [How to Remove Nodes](#how-to-remove-nodes)
8. [How to use CPU Nodes](./how-to-use-cpu-nodes.md)
9. [How to Customize Cluster by Plugins](./how-to-customize-cluster-by-plugins.md)
10. [Troubleshooting](./troubleshooting.md)
11. [How to Uninstall OpenPAI](./how-to-uninstall-openpai.md)
12. [Upgrade Guide](./upgrade-guide.md)

OpenPAI doesn't support changing master nodes, thus, only the solution of adding/removing worker nodes is provided.

## How to Add Nodes

### Preparation

To add worker nodes, please check if the nodes meet the following requirements:

  - Ubuntu 16.04 (18.04 should work, but not fully tested.)
  - Assign each node a **static IP address**, and make sure nodes can communicate with each other. 
  - The nodes can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.
  - SSH service is enabled and share the same username/password and have sudo privilege.
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

Log in to your dev box machine, find [the pre-kept folder `~/pai-deploy`](./installation-guide.md#keep-a-folder).

### Add the Nodes into Kubernetes

Find the file `~/pai-deploy/kubespray/inventory/pai/host.yml`, and follow the steps below to modify it. 

Supposing you want to add 2 worker nodes into your cluster and their hostnames are `a` and `b`.  Add these 2 nodes into the `host.yml`. An example:

```yaml
all:
  hosts:
    origin1:
      ip: x.x.x.37
      access_ip: x.x.x.37
      ansible_host: x.x.x.37
      ansible_ssh_user: "username"
      ansible_ssh_pass: "your-password-here"
      ansible_become_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    origin2:
      ...
    origin3:
      ...
    origin4:
      ...

############# Example start ################### 
    a:
      ip: x.x.x.x
      access_ip: x.x.x.x
      ansible_host: x.x.x.x
      ansible_ssh_user: "username"
      ansible_ssh_pass: "your-password-here"
      ansible_become_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
    b:
      ip: x.x.x.x
      access_ip: x.x.x.x
      ansible_host: x.x.x.x
      ansible_ssh_user: "username"
      ansible_ssh_pass: "your-password-here"
      ansible_become_pass: "your-password-here"
      ansible_ssh_extra_args: '-o StrictHostKeyChecking=no'
#############  Example end  ###################

  children:
    kube-master:
      hosts:
        origin1:
    kube-node:
      hosts:
        origin1:
        origin2:
        origin3:
        origin4:

############# Example start ################### 
        a:
        b:
############## Example end #################### 

    gpu:
      hosts:
        origin4:

############# Example start ################### 
        a:
        b:
############## Example end #################### 

    etcd:
      hosts:
        origin1:
        origin2:
        origin3:
    k8s-cluster:
      children:
        kube-node:
        kube-master:
    calico-rr:
      hosts: {}
``` 

Go into folder `~/pai-deploy/kubespray/`, run:

```bash
ansible-playbook -i inventory/pai/hosts.yml upgrade-cluster.yml --become --become-user=root  --limit=a,b -e "@inventory/pai/openpai.yml"
```

### Update OpenPAI Service Configuration

Find your [service configuration file `layout.yaml` and `services-configuration.yaml`](./basic-management-operations.md#pai-ervice-management-and-paictl) in  `~/pai-deploy/cluster-cfg`.

- Add the new node into `layout.yaml`

```yaml
...

machine-list:

    ...

    - hostname: a
      hostip: x.x.x.x
      machine-type: sku
      nodename: a
      k8s-role: worker
      pai-worker: "true"


    - hostname: b
      hostip: x.x.x.x
      machine-type: sku
      nodename: b
      k8s-role: worker
      pai-worker: "true"
```

- You should modify the hived scheduler setting in `services-configuration.yaml` properly. Please refer to [how to set up virtual clusters](./how-to-set-up-virtual-clusters.md) and the [hived scheduler doc](https://github.com/microsoft/hivedscheduler/blob/master/doc/user-manual.md) for details. 

- Push the latest configuration by:

```bash
./paictl config push -p ~/pai-deploy/cluster-cfg -m service
```

- Now, restart services:

```bash
./paictl.py service stop -n rest-server hivedscheduler
./paictl.py service start -n cluster-configuartion
./paictl.py service start -n hivedscheduler rest-server
```

If you have configured any PV/PVC storage, please confirm the added worker node meets the PV's requirements. See [Confirm Worker Nodes Environment](./how-to-set-up-pv-storage.md#confirm-environment-on-worker-nodes) for details.

## How to Remove Nodes

Please refer to the operation of add nodes. They are very similar.

First, modify `host.yml` accordingly, then go into `~/pai-deploy/kubespray/`, run

```bash
ansible-playbook -i inventory/mycluster/hosts.yml upgrade-cluster.yml --become --become-user=root  --limit=a,b -e "@inventory/mycluster/openpai.yml"
``` 

Modify the `layout.yaml` and `services-configuration.yaml`, then push them to the cluster:

```bash
./paictl config push -p ~/pai-deploy/cluster-cfg -m service
```

Restart services:

```bash
./paictl.py service stop -n rest-server hivedscheduler
./paictl.py service start -n cluster-configuartion
./paictl.py service start -n hivedscheduler rest-server
```

