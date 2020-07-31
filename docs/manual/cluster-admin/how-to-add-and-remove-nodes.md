# How to Add and Remove Nodes

OpenPAI doesn't support changing master nodes, thus, only the solution of adding/removing worker nodes is provided.

## How to Add Nodes

### Preparation

To add worker nodes, please check if the nodes meet the following requirements:

  - Ubuntu 16.04 (18.04 should work, but not fully tested.)
  - Assign each node a **static IP address**, and make sure nodes can communicate with each other. 
  - The nodes can access internet, especially need to have access to the docker hub registry service or its mirror. Deployment process will pull Docker images.
  - SSH service is enabled and share the same username/password with current master/worker machines and have sudo privilege.
  - **Have GPU and GPU driver is installed.**  You may use [a command](./installation-faqs-and-troubleshooting.md#how-to-check-whether-the-gpu-driver-is-installed) to check it. Refer to [the installation guidance](./installation-faqs-and-troubleshooting.md#how-to-install-gpu-driver) in FAQs if the driver is not successfully installed. If you are wondering which version of GPU driver you should use, please also refer to [FAQs](./installation-faqs-and-troubleshooting.md#which-version-of-nvidia-driver-should-i-install).
  - **Docker is installed.**  You may use command `docker --version` to check it. Refer to [docker's installation guidance](https://docs.docker.com/engine/install/ubuntu/) if it is not successfully installed.
  - **[nvidia-container-runtime](https://github.com/NVIDIA/nvidia-container-runtime) or other device runtime is installed. And be configured as the default runtime of docker. Please configure it in [docker-config-file](https://docs.docker.com/config/daemon/#configure-the-docker-daemon), because kubespray will overwrite systemd's env.**
    - You may use command `sudo docker run nvidia/cuda:10.0-base nvidia-smi` to check it. This command should output information of available GPUs if it is setup properly.
    - Refer to [the installation guidance](./installation-faqs-and-troubleshooting.md#how-to-install-nvidia-container-runtime) if the it is not successfully set up.
  - OpenPAI reserves memory and CPU for service running, so make sure there are enough resource to run machine learning jobs. Check hardware requirements for details.
  - Dedicated servers for OpenPAI. OpenPAI manages all CPU, memory and GPU resources of servers. If there is any other workload, it may cause unknown problem due to insufficient resource.

Log in to your dev box machine, find [the pre-kept folder `~/pai-deploy`](./installation-guide.md#keep-a-folder).

### Add the Nodes into Kubernetes

Find the file `~/pai-deploy/kubespray/inventory/pai/hosts.yml`, and follow the steps below to modify it. 

Supposing you want to add 2 worker nodes into your cluster and their hostnames are `a` and `b`.  Add these 2 nodes into the `hosts.yml`. An example:

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

Find your [service configuration file `layout.yaml` and `services-configuration.yaml`](./basic-management-operations.md#pai-service-management-and-paictl) in  `~/pai-deploy/cluster-cfg`.

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

- Stop the service, push the latest configuration, and then start services:

```bash
./paictl.py service stop -n rest-server
./paictl.py service stop -n hivedscheduler
./paictl.py config push -p ~/pai-deploy/cluster-cfg -m service
./paictl.py service start -n cluster-configuration
./paictl.py service start -n hivedscheduler
./paictl.py service start -n rest-server
```

If you have configured any PV/PVC storage, please confirm the added worker node meets the PV's requirements. See [Confirm Worker Nodes Environment](./how-to-set-up-storage.md#confirm-environment-on-worker-nodes) for details.

## How to Remove Nodes

Please refer to the operation of add nodes. They are very similar.

First, modify `hosts.yml` accordingly, then go into `~/pai-deploy/kubespray/`, run

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
./paictl.py service start -n cluster-configuration
./paictl.py service start -n hivedscheduler rest-server
```

