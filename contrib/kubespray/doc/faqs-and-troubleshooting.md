## FAQs

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
