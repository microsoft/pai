# Installation FAQs and Troubleshooting

## Installation FAQs

#### How to include CPU-only worker nodes?

Currently, the support for CPU-only worker is limited in the installation script. If you have both GPU workers and CPU workers, please first set up PAI with GPU workers only. After PAI is successfully installed, you can attach CPU workers to it and set up a CPU-only virtual cluster. Please refer to [How to add and remove nodes](./how-to-add-and-remove-nodes.md) for details. If you only have CPU workers, we haven't had an official installation support yet. Please submit an issue for feature request.

#### Which version of NVIDIA driver should I install?

First, check out the [NVIDIA site](https://www.nvidia.com/Download/index.aspx) to verify the newest driver version of your GPU card. Then, check out [this table](https://docs.nvidia.com/deploy/cuda-compatibility/index.html#binary-compatibility__table-toolkit-driver) to see the CUDA requirement of driver version.

Please note that, some docker images with new CUDA version cannot be used on machine with old driver. As for now, we recommend to install the NVIDIA driver 418 as it supports CUDA 9.0 to CUDA 10.1, which is used by most deep learning frameworks.

#### How to fasten deploy speed on large cluster?

By default, `Ansible` uses 5 forks to execute commands parallelly on all hosts. If your cluster is a large one, it may be slow for you.

To fasten the deploy speed, you can add `-f <parallel-number>` to all commands using `ansible` or `ansible-playbook`. See [ansible doc](https://docs.ansible.com/ansible/latest/cli/ansible.html#cmdoption-ansible-f) for reference.

#### How to remove k8s network plugin


After installation, if you use [weave](https://github.com/weaveworks/weave) as k8s network plugin and you encounter some errors about the network, such as some pods failed to connect internet, you could remove network plugin to solve this issue.

Please run `kubectl delete ds weave-net -n kube-system` to remove `weave-net` daemon set first

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

    - name: clean ip table
      shell: |
        iptables -P INPUT ACCEPT
        iptables -P FORWARD ACCEPT
        iptables -P OUTPUT ACCEPT
        iptables -t nat -F
        iptables -t mangle -F
        iptables -F
        iptables -X

    - name: config-docker
      shell: |
        sed -i 's/--iptables=False/--iptables=True --ip-masq=True/g' /etc/systemd/system/docker.service.d/docker-options.conf
        systemctl daemon-reload
      args:
        executable: /bin/bash

    - name: restart kubelet
      shell: systemctl restart kubelet
      args:
        executable: /bin/bash

    - name: restart docker
      shell: systemctl restart docker
      args:
        executable: /bin/bash
```

After these steps you need to change the `coredns` to fix dns resolution issue.
Please run `kubectl edit cm coredns -n kube-system`, change `.:53` to `.:9053`
Please run `kubectl edit service coredns -n kube-system`, change `targetPort: 53` to `targetPort: 9053`
Please run `kubectl edit deployment coredns -n kube-system`, change `containerPort: 53` to `containerPort: 9053`. Add `hostNetwork: true` in pod spec.

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

#### How to deploy on [Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/) with [Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)?

Please refer to [this document](https://github.com/microsoft/pai/tree/master/contrib/aks-engine).

## Troubleshooting

#### Ansible reports `Failed to update apt cache` or `Apt install <some package>` fails

Please first check if there is any network-related issues. Besides network, another reason for this problem is: `ansible` sometimes runs a `apt update` to update the cache before the package installation. If `apt update` exits with a non-zero code, the whole command will be considered to be failed.

You can check this by running `sudo apt update; echo $?` on the corresponding machine. If the exit code is not 0, please fix it. Here are 2 normal causes of this problem:

If you find `sudo apt update` reports `the following signatures couldn’t be verified because the public key is not available`, you can use the following commands to fix it. Please replace `<key-number>` with yours.

```bash
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys <key-number>
sudo apt update
```

If you find `sudo apt update` reports some expired repo lists, you can use the following commands to fix it. Please replace `<repo-list-file>` with yours.

```bash
sudo rm -rf  /etc/apt/sources.list.d/<repo-list-file>
sudo apt update
```

#### Ansible playbook exits because of timeout.

Sometimes, if you assign a different hostname for a certain machine, any commands with `sudo` will be very slow on that machine. Because  the system DNS try to find the new hostname, but it will fail due to a timeout.

To fix this problem, on each machine, you can add the new hostname to its `/etc/hosts` by:

```bash
sudo chmod 666 /etc/hosts
sudo echo 127.0.0.1 `hostname` >> /etc/hosts
sudo chmod 644 /etc/hosts
```

#### Ansible exists because `sudo` is timed out.

The same as `1. Ansible playbook exits because of timeout.` .

#### Ansible reports `Could not import python modules: apt, apt_pkg. Please install python3-apt package.`

Sometimes it is not fixable even you have the `python3-apt` package installed. In this case, please manually add `-e ansible_python_interpreter=/usr/bin/python3` to [this line](https://github.com/microsoft/pai/blob/42bcfb985d0baf05313190a5ac8a237a35133d73/contrib/kubespray/script/kubernetes-boot.sh#L5) in your local code.

#### Network-related Issues

If you are a China user, please refer to [here](./configuration-for-china.md).

**Cannot download kubeadm or hyperkube**

During installation, the script will download kubeadm and hyperkube from `storage.googleapis.com`. To be detailed, we use kubespray `2.11` release, the corresponding `kubeadm` and `hyperkube` is:

  - `kubeadm`: `https://storage.googleapis.com/kubernetes-release/release/v1.15.11/bin/linux/amd64/kubeadm`
  - `hyperkube`: `https://storage.googleapis.com/kubernetes-release/release/v1.15.11/bin/linux/amd64/hyperkube`

Please find alternative urls for downloading this two files and modify `kubeadm_download_url` and `hyperkube_download_url` in your `config` file.

**Cannot download image**

Please first check the log to see which image blocks the installation process, and modify `gcr_image_repo`, `kube_image_repo`, `quay_image_repo`, or `docker_image_repo` to a mirror repository correspondingly in `config` file.

For example, if you cannot pull images from `gcr.io`, you should fisrt find a mirror repository (We recommend you to use `gcr.azk8s.cn` if you are in China). Then, modify `gcr_image_repo` and `kube_image_repo`.

Especially for `gcr.io`, we find some image links in kubespray which do not adopt `gcr_image_repo` and `kube_image_repo`. You should modify them manually in `~/pai-deploy/kubespray`. Command `grep -r --color gcr.io ~/pai-deploy/kubespray` will be helpful to you.