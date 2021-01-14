# 如何添加和移除结点

OpenPAI暂时不支持修改master结点。因此，这里只提供添加worker结点的方法。您可以添加CPU结点、GPU结点、或者使用其他计算设备（如TPU、NPU）的结点到您的集群中。

## 如何添加结点

### 准备工作

请先检查您要添加的worker结点是否[安装指南中的worker要求](./installation-guide.md#installation-requirements)。

登录您的dev机器，并找到[之前保留的文件夹`~/pai-deploy`](./installation-guide.md#keep-a-folder).

### 将结点添加到Kubernetes中

找到文件`~/pai-deploy/kubespray/inventory/pai/hosts.yml`，并遵循下面的方法来修改它。

假设您想添加2个worker结点，它们的hostname分别为`a`和`b`。您需要将它们先添加到`hosts.yml`中，例如：

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
###  非GPU结点不需要在此处添加
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

进入文件夹`~/pai-deploy/kubespray/`，运行：

```bash
ansible-playbook -i inventory/pai/hosts.yml scale.yml -b --become-user=root -e "node=a,b" -e "@inventory/pai/openpai.yml"
```

需要在 `-e` 中指定需要添加的node名称，格式请参考上面的命令。


### 更新OpenPAI的服务配置

找到您的[集群配置文件 `layout.yaml` 和 `services-configuration.yaml`](./basic-management-operations.md#pai-service-management-and-paictl)。

- 将新结点添加到`layout.yaml`的`machine-list`域中：

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

- 如果您现在使用的是HiveD调度器，您需要在 `services-configuration.yaml`中适当修改HiveD的配置。 请参考[如何设置虚拟集群](./how-to-set-up-virtual-clusters.md)和[hived scheduler的文档](https://github.com/microsoft/hivedscheduler/blob/master/doc/user-manual.md)。如果您使用的是K8S default scheduler，就可以跳过这步。

- 结束之前的服务，更新配置，并重启服务：

```bash
./paictl.py service stop -n cluster-configuration hivedscheduler rest-server
./paictl.py config push -p <config-folder> -m service
./paictl.py service start -n cluster-configuration hivedscheduler rest-server
```

如果您有设置过PV/PVC存储，请确认新添加的worker结点的环境满足对应PV的要求，细节请参考[确认Worker结点上的环境](./how-to-set-up-storage.md#confirm-environment-on-worker-nodes)。

## 如何移除结点

移除结点和添加结点非常相似，您可以参考之前添加结点的操作。

在移除结点时，不需要修改`hosts.yml`，到`~/pai-deploy/kubespray/`文件夹中，运行：

```bash
ansible-playbook -i inventory/pai/hosts.yml remove-node.yml -b --become-user=root -e "node=a,b" -e "@inventory/pai/openpai.yml"
``` 

需要在 `-e` 中指定需要移除的node名称，格式请参考上面的命令。

修改`layout.yaml` 和 `services-configuration.yaml`。

结束之前的服务，更新配置，并重启服务：

```bash
./paictl.py service stop -n cluster-configuration hivedscheduler rest-server
./paictl.py config push -p <config-folder> -m service
./paictl.py service start -n cluster-configuration hivedscheduler rest-server
```
