# Installation FAQs and Troubleshooting

1. [Installation Guide](./installation-guide.md)
2. [Installation FAQs and Troubleshooting](./installation-faqs-and-troubleshooting.md) (this document)
    - [Installation FAQs](#installation-faqs)
    - [Troubleshooting](#troubleshooting)
3. [Basic Management Operations](./basic-management-operations.md)
4. [How to Manage Users and Groups](./how-to-manage-users-and-groups.md)
5. [How to Set Up Storage](./how-to-set-up-storage.md)
6. [How to Set Up Virtual Clusters](./how-to-set-up-virtual-clusters.md)
7. [How to Add and Remove Nodes](./how-to-add-and-remove-nodes.md)
8. [How to use CPU Nodes](./how-to-use-cpu-nodes.md)
9. [How to Customize Cluster by Plugins](./how-to-customize-cluster-by-plugins.md)
10. [Troubleshooting](./troubleshooting.md)
11. [How to Uninstall OpenPAI](./how-to-uninstall-openpai.md)
12. [Upgrade Guide](./upgrade-guide.md)

## Installation FAQs

#### How to include CPU-only worker nodes?

In current release, the support for CPU nodes is limited. Please refer to [How to Use CPU Nodes](./how-to-use-cpu-nodes.md) for details.

#### Which version of NVIDIA driver should I install?

First, check out the [NVIDIA site](https://www.nvidia.com/Download/index.aspx) to verify the newest driver version of your GPU card. Then, check out [this table](https://docs.nvidia.com/deploy/cuda-compatibility/index.html#binary-compatibility__table-toolkit-driver) to see the CUDA requirement of driver version.

Please note that, some docker images with new CUDA version cannot be used on machine with old driver. As for now, we recommend to install the NVIDIA driver 418 as it supports CUDA 9.0 to CUDA 10.1, which is used by most deep learning frameworks.

#### How to fasten deploy speed on large cluster?

By default, `Ansible` uses 5 forks to execute commands parallelly on all hosts. If your cluster is a large one, it may be slow for you.

To fasten the deploy speed, you can add `-f <parallel-number>` to all commands using `ansible` or `ansible-playbook`. See [ansible doc](https://docs.ansible.com/ansible/latest/cli/ansible.html#cmdoption-ansible-f) for reference.

#### How to remove k8s network plugin


After installation, if you use [weave](https://github.com/weaveworks/weave) as k8s network plugin and you encounter some errors about the network, such as some pods failed to connect internet, you could remove network plugin to solve this issue.

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

#### How to check whether the GPU driver is installed?

For Nvidia GPU, use command `nvidia-smi` to check.

#### How to install GPU driver?

For Nvidia GPU, please first determine which version of driver you want to install (see [this question](#which-version-of-nvidia-driver-should-i-install) for details). Then follow these commands:

```bash
sudo add-apt-repository ppa:graphics-drivers/ppa
sudo apt update
sudo apt install nvidia-418
sudo reboot
```

Here we use nvidia driver version 418 as an example. Please modify `nvidia-418` if you want to install a different version, and refer to the Nvidia community for help if encounter any problem.

#### How to install nvidia-container-runtime?

Please refer to the [official document](https://github.com/NVIDIA/nvidia-container-runtime#installation). Don't forget to set it as docker' default runtime in [docker-config-file](https://docs.docker.com/config/daemon/#configure-the-docker-daemon). Here is an example of `/etc/docker/daemon.json`:

```
{
  "default-runtime": "nvidia",
  "runtimes": {
      "nvidia": {
          "path": "/usr/bin/nvidia-container-runtime",
          "runtimeArgs": []
      }
  }
}
```

## Troubleshooting

#### Ansible playbook exits because of timeout.

Sometimes, if you assign a different hostname for a certain machine, any commands with `sudo` will be very slow on that machine. Because  the system DNS try to find the new hostname, but it will fail due to a timeout.

To fix this problem, on each machine, you can add the new hostname to its `/etc/hosts` by:

```bash
sudo chmod 666 /etc/hosts
sudo echo 127.0.0.1 `hostname` >> /etc/hosts
sudo chmod 644 /etc/hosts
```

#### Commands with `sudo` become very slow

The same as `1. Ansible playbook exits because of timeout.` .

#### Cannot download kubeadm or hyperkube

During installation, the script will download kubeadm and hyperkube from `storage.googleapis.com`. To be detailed, we use kubespray `2.11` release, the corresponding `kubeadm` and `hyperkube` is:

  - `kubeadm`: `https://storage.googleapis.com/kubernetes-release/release/v1.15.11/bin/linux/amd64/kubeadm`
  - `hyperkube`: `https://storage.googleapis.com/kubernetes-release/release/v1.15.11/bin/linux/amd64/hyperkube`

Please find alternative urls for downloading this two files and modify `kubeadm_download_url` and `hyperkube_download_url` in your `config` file.

#### Cannot download image

Please first check the log to see which image blocks the installation process, and modify `gcr_image_repo`, `kube_image_repo`, `quay_image_repo`, or `docker_image_repo` to a mirror repository correspondingly in `config` file.

For example, if you cannot pull images from `gcr.io`, you should fisrt find a mirror repository (We recommend you to use `gcr.azk8s.cn` if you are in China). Then, modify `gcr_image_repo` and `kube_image_repo`.

Especially for `gcr.io`, we find some image links in kubespray which do not adopt `gcr_image_repo` and `kube_image_repo`. You should modify them manually in `~/pai-deploy/kubespray`. Command `grep -r --color gcr.io ~/pai-deploy/kubespray` will be helpful to you.