# How to Add and Remove Nodes

OpenPAI doesn't support changing master nodes, thus, only the solution of adding/removing worker nodes is provided. You can add CPU workers, GPU workers, and other computing device (e.g. TPU, NPU) into the cluster.

## How to Add Nodes

### Preparation

To add worker nodes, please check if the nodes meet [the worker requirements](./installation-guide.md##installation-requirements).

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
#### If the worker doesn't have GPU, please don't add them here.
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
ansible-playbook -i inventory/pai/hosts.yml scale.yml -b --become-user=root -e "node=a,b" -e "@inventory/pai/openpai.yml"
```

The nodes to remove are specified with `-e` flag.

### Update OpenPAI Service Configuration

Find your [service configuration file `layout.yaml` and `services-configuration.yaml`](./basic-management-operations.md#pai-service-management-and-paictl) in  `~/pai-deploy/cluster-cfg`.

- Add the new node into `machine-list` field in `layout.yaml`

```yaml
machine-list:
  - hostname: a
    hostip: x.x.x.x
    machine-type: xxx-sku
    pai-worker: "true"

  - hostname: b
    hostip: x.x.x.x
    machine-type: xxx-sku
    pai-worker: "true"
```

- If you are using hived scheduler, you should modify its setting in `services-configuration.yaml` properly. Please refer to [how to set up virtual clusters](./how-to-set-up-virtual-clusters.md) and the [hived scheduler doc](https://github.com/microsoft/hivedscheduler/blob/master/doc/user-manual.md) for details. If you are using Kubernetes default scheduler, you can skip this step.

- Stop the service, push the latest configuration, and then start services:

```bash
./paictl.py service stop -n cluster-configuration hivedscheduler rest-server
./paictl.py config push -p <config-folder> -m service
./paictl.py service start -n cluster-configuration hivedscheduler rest-server
```

If you have configured any PV/PVC storage, please confirm the added worker node meets the PV's requirements. See [Confirm Worker Nodes Environment](./how-to-set-up-storage.md#confirm-environment-on-worker-nodes) for details.

## How to Remove Nodes

Please refer to the operation of add nodes. They are very similar.

To remove nodes from the cluster, there is no need to modify `hosts.yml`. 
Go into `~/pai-deploy/kubespray/`, run

```bash
ansible-playbook -i inventory/pai/hosts.yml remove-node.yml -b --become-user=root -e "node=a,b" -e "@inventory/pai/openpai.yml"
``` 

The nodes to remove are specified with `-e` flag.

Modify the `layout.yaml` and `services-configuration.yaml`.

Stop the service, push the latest configuration, and then start services:

```bash
./paictl.py service stop -n cluster-configuration hivedscheduler rest-server
./paictl.py config push -p <config-folder> -m service
./paictl.py service start -n cluster-configuration hivedscheduler rest-server
```
