# Installation FAQs and Troubleshooting

## How to Write Hived Scheduler Configuration for a Heterogeneous Cluster

### Include CPU-only Nodes

To config CPU nodes in cluster using hived scheduler, you need to mock one GPU for each CPU in `gpuTypes`. Here's an example of a 3 CPU nodes cluster:

```yaml
hivedscheduler:
config: |
  physicalCluster:
    gpuTypes:
      CPU:
        gpu: 1
        cpu: 1
        memory: 2048Mi
    cellTypes:
      CPU-NODE:
        childCellType: CPU
        childCellNumber: 24
        isNodeLevel: true
      CPU-NODE-POOL:
        childCellType: CPU-NODE
        childCellNumber: 3
    physicalCells:
    - cellType: CPU-NODE-POOL
      cellChildren:
      - cellAddress: 192.168.0.1
      - cellAddress: 192.168.0.2
      - cellAddress: 192.168.0.3
  virtualClusters:
    default:
      virtualCells:
      - cellType: CPU-NODE-POOL
        cellNumber: 1
    cpu:
      virtualCells:
      - cellType: CPU-NODE-POOL
        cellNumber: 2
```

## Include Multi-type GPUs

To config multiple types GPU nodes in cluster using hived scheduler, you need to specify all types in `gpuTypes` and config virtual clusters accordingly. Here's an example of 2 P100 nodes and 1 V100 node cluster:

```yaml
hivedscheduler:
config: |
  physicalCluster:
    gpuTypes:
      P100:
        gpu: 1
        cpu: 4
        memory: 8192Mi
      V100:
        gpu: 1
        cpu: 6
        memory: 12288Mi
    cellTypes:
      P100-NODE:
        childCellType: P100
        childCellNumber: 8
        isNodeLevel: true
      V100-NODE:
        childCellType: V100
        childCellNumber: 8
        isNodeLevel: true
      P100-NODE-POOL:
        childCellType: P100-NODE
        childCellNumber: 2
      V100-NODE-POOL:
        childCellType: P100-NODE
        childCellNumber: 1
    physicalCells:
    - cellType: P100-NODE-POOL
      cellChildren:
      - cellAddress: 192.168.1.1
      - cellAddress: 192.168.1.2
    - cellType: V100-NODE-POOL
      cellChildren:
      - cellAddress: 192.168.2.1
  virtualClusters:
    default:
      virtualCells:
      - cellType: P100-NODE-POOL
        cellNumber: 1
    vc1:
      virtualCells:
      - cellType: P100-NODE-POOL
        cellNumber: 1
    vc2:
      virtualCells:
      - cellType: V100-NODE-POOL
        cellNumber: 1
```

## Other Questions about Installation

**1. Which NVIDIA driver should I install?**

First, check out the [NVIDIA site](https://www.nvidia.com/Download/index.aspx) to verify the newest driver version of your GPU card. Then, check out [this table](https://docs.nvidia.com/deploy/cuda-compatibility/index.html#binary-compatibility__table-toolkit-driver) to see the CUDA requirement of driver version.

Please note that, some docker images with new CUDA version cannot be used on machine with old driver. As for now, we recommend to install the NVIDIA driver 418 as it supports CUDA 9.0 \~ CUDA 10.1, which is used by most deep learning frameworks.

**2. How to fasten deploy speed on large cluster?**

By default, `Ansible` uses 5 forks to execute commands parallelly on all hosts. If your cluster is a large one, it may be slow for you.

To fasten the deploy speed, you can add `-f <parallel-number>` to all commands using `ansible` or `ansible-playbook`. See [ansible doc](https://docs.ansible.com/ansible/latest/cli/ansible.html#cmdoption-ansible-f) for reference.

**3. How to remove k8s network plugin**

By default, we use [weave](https://github.com/weaveworks/weave) as k8s network plugin. After installation, if you encounter some errors about the network, such as some pods failed to connect internet, you could remove network plugin to solve this issue.

To remove the network plugin, you could use following `ansible-playbook`:
```yaml
---
- hosts: all
  tasks:
    - name: remove cni
      shell: |
        sed -i '/KUBELET_NETWORK_PLUGIN/d' /etc/kubernetes/kubelet.env
        echo KUBELET_NETWORK_PLUGIN=\"\" >> /etc/kubernetes/kubelet.env
      args:
        executable: /bin/bash

    - name: remove weave
      shell: ip link delete weave
      args:
        executable: /bin/bash

    - name: restart network
      shell: systemctl restart networking
      args:
        executable: /bin/bash

    - name: stop kubelet
      shell: systemctl stop kubelet
      args:
        executable: /bin/bash

    - name: start kubelet
      shell: systemctl start kubelet
      args:
        executable: /bin/bash
```

After this step, if your pod still can not access internet, please change the pod spec to use `hostNetwork`.

## Troubleshooting

**1. Ansible playbook exits because of timeout.**

Sometimes, if you assign a different hostname for a certain machine, any commands with `sudo` will be very slow on that machine. Because  the system DNS try to find the new hostname, but it will fail due to a timeout.

To fix this problem, on each machine, you can add the new hostname to its `/etc/hosts` by:

```bash
sudo chmod 666 /etc/hosts
sudo echo 127.0.0.1 `hostname` >> /etc/hosts
sudo chmod 644 /etc/hosts
```

**2. Commands with `sudo` become very slow**

The same as `1. Ansible playbook exits because of timeout.` .