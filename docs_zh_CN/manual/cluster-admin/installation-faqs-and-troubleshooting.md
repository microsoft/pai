# 安装常见问题解答和故障排查

## 安装常见问题

#### <div id="which-version-of-nvidia-driver-should-i-install">我应该安装什么版本的NVIDIA显卡驱动？</div>

首先，请参阅[英伟达官网上的文档](https://www.nvidia.com/Download/index.aspx)来确认适合您显卡的驱动版本。接着，您可以参考[这个表格](https://docs.nvidia.com/deploy/cuda-compatibility/index.html#binary-compatibility__table-toolkit-driver)来确认不同版本CUDA对显卡驱动的要求。

请注意，在老显卡驱动的环境下，有些包含新CUDA版本的Docker镜像将无法被使用。目前，我们推荐您安装418版本的显卡驱动。418显卡驱动支持CUDA 9.0到10.1（目前大多数深度学习框架使用的是这几个版本的CUDA）。

#### 如何加快在大集群上的部署速度？

默认情况下，`Ansible`使用5个进程在所有机器并行执行命令。如果您的集群比较大，那么5个进程可能会比较慢。

如果您想要加速，可以在源码的`ansible`和`ansible-playbook`命令中加入参数`-f <并发数>`。关于细节，请参考[ansible的相关文档](https://docs.ansible.com/ansible/latest/cli/ansible.html#cmdoption-ansible-f)。

#### 如何移除K8S的网络插件？

在安装后，如果您使用的是[weave](https://github.com/weaveworks/weave)插件，并且在使用过程中碰到了一些网络相关的问题，例如：一些pod无法连接互联网。此时，您可以移除网络插件来解决这个问题。

请先运行`kubectl delete ds weave-net -n kube-system`来移除`weave-net` DaemonSet。

接着，您可以参考下面的`ansible-playbook`来移除网络插件:

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

    # - name: restart network for ubuntu 18.04
    #   shell: systemctl restart systemd-networkd
    #   args:
    #     executable: /bin/bash

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
        sed -i 's/--iptables=false/--iptables=true --ip-masq=true/g' /etc/systemd/system/docker.service.d/docker-options.conf
        systemctl daemon-reload
      args:
        executable: /bin/bash

    - name: stop kubelet
      shell: systemctl stop kubelet
      args:
        executable: /bin/bash
    
    - name: restart docker
      shell: systemctl restart docker
      args:
        executable: /bin/bash

    - name: start kubelet
      shell: systemctl start kubelet
      args:
        executable: /bin/bash
```

在这些步骤后，您需要修改`coredns`来解决DNS问题：
请使用命令`kubectl edit cm coredns -n kube-system`，修改`.:53`为`.:9053`。
请使用命令`kubectl edit service coredns -n kube-system`，修改`targetPort: 53`为 `targetPort: 9053`。
请使用命令`kubectl edit deployment coredns -n kube-system`，修改`containerPort: 53`为`containerPort: 9053`，在pod定义中添加`hostNetwork: true`。

#### <div id="how-to-check-whether-the-gpu-driver-is-installed">如何检查GPU驱动被正确安装了？</div>

对于NVIDIA GPU, 您可以使用命令`nvidia-smi`来检查。

#### <div id="how-to-install-gpu-driver">如何安装GPU驱动？</div>

对于NVIDIA GPU，请先确认您想安装哪个版本的GPU（您可以参考[这个问题](#which-version-of-nvidia-driver-should-i-install)）。然后参考下面的步骤：

```bash
sudo add-apt-repository ppa:graphics-drivers/ppa
sudo apt update
sudo apt install nvidia-418
sudo reboot
```

在上述命令中，我们使用NVIDIA Driver 418作为示例。您可以修改`nvidia-418`为您需要的版本。如果遇到任何问题，请在Nvidia社区需求解决方案。

#### <div id="how-to-install-nvidia-container-runtime">如何安装nvidia-container-runtime?</div>

请参阅[官方文档](https://github.com/NVIDIA/nvidia-container-runtime#installation)。 另外，不要忘记在[docker-config-file](https://docs.docker.com/config/daemon/#configure-the-docker-daemon)中将nvidia-container-runtime设置为docker的默认runtime。 下面是docker-config-file `/etc/docker/daemon.json`的一个示例：

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

#### 如何在[Azure Kubernetes Service (AKS)](https://azure.microsoft.com/en-us/services/kubernetes-service/)部署带有[Cluster Autoscaler](https://github.com/kubernetes/autoscaler/tree/master/cluster-autoscaler)的OpenPAI集群？

请参考[这里](https://github.com/microsoft/pai/tree/master/contrib/aks-engine)。

## <div id="troubleshooting">故障排查</div>

#### Ansible 报告 `Failed to update apt cache` 或 `apt install <some package>` 失败

请先检查机器是否有网络相关的问题。除了网络之外，还有一个可能的原因：`ansible`有时会在安装apt包前先运行一次`apt update`。如果`apt update`返回的代码是非0的，那整个命令都会失败。

您可以在对应机器上运行`sudo apt update; echo $?` 来进行检查。如果退出代码是非0的，请修复一下。退出代码非0的可能原因如下：

如果您在`sudo apt update`的返回中发现类似于`the following signatures couldn’t be verified because the public key is not available`这样的信息，您可以使用下面的命令来进行修复。请将`<key-number>`换成您的。

```bash
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys <key-number>
sudo apt update
```

如果您发现`sudo apt update`报告有一些repo list是过期的（expired repo lists），您可以使用下面的命令来进行修复。 请将`<repo-list-file>`换成您的。

```bash
sudo rm -rf  /etc/apt/sources.list.d/<repo-list-file>
sudo apt update
```

#### Ansible playbook因为超时退出

有些时候，如果您给某个机器分配了一个和原有hostname不同的新hostname，很多包含`sudo`的命令会在这台机器上变得很慢。这是因为系统的DNS会去尝试去找新的hostname，但是会因为超时而失败。

解决方法：您可以在对应机器上运行下面的命令，给`/etc/hosts`加入新的hostname：

```bash
sudo chmod 666 /etc/hosts
sudo echo 127.0.0.1 `hostname` >> /etc/hosts
sudo chmod 644 /etc/hosts
```

#### Ansible因为`sudo`命令超时而退出

和“Ansible playbook因为超时退出”的解决方案相同。

#### 网络相关的问题

如果您是中国用户，请先参考[这个issue](https://github.com/microsoft/pai/issues/5592).

**无法下载kubeadm或hyperkube二进制文件**

在安装时，安装脚本会从`storage.googleapis.com`下载kubeadm和hyperkube的二进制文件。 具体来说，我们会使用kubespray的`2.11` release，对应使用的`kubeadm`和`hyperkube`文件为：

  - `kubeadm`: `https://storage.googleapis.com/kubernetes-release/release/v1.15.11/bin/linux/amd64/kubeadm`
  - `hyperkube`: `https://storage.googleapis.com/kubernetes-release/release/v1.15.11/bin/linux/amd64/hyperkube`

请寻找这两个文件合适的下载链接，并在`config`文件中修改`kubeadm_download_url`和`hyperkube_download_url`。

**无法下载一些Docker镜像**

请先检查安装过程中的日志，看看是哪些镜像无法下载。如果确认是网络问题的话，请在`config`文件中修改`gcr_image_repo`、`kube_image_repo`、`quay_image_repo`或`docker_image_repo`。

另外，如果您发现无法从`gcr.io`上下载镜像，您需要首先寻找一个合适的镜像registry（如果您在中国，您可以尝试`gcr.azk8s.cn`是否可行）。然后，修改`gcr_image_repo`和`kube_image_repo`。

特别地，对于`gcr.io`来说, 我们发现kubespray 2.11版本源码中有些链接并没有采取`gcr_image_repo`和`kube_image_repo`的值，而是直接使用`gcr.io`。您得在文件`~/pai-deploy/kubespray`中手工修改它们。命令`grep -r --color gcr.io ~/pai-deploy/kubespray` 可能会对您有帮助。