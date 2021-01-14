# 如何卸载OpenPAI

## <div id="gte100-uninstallation">OpenPAI >= v1.0.0 的卸载指南</div>

OpenPAI >= `v1.0.0` 的卸载是不可逆的：所有数据将被删除，无法找回。如果需要备份，请在卸载之前完成备份。

首先，登录到dev box机器，启动[dev box容器](./basic-management-operations.md#pai-service-management-and-paictl)，并在其中删除所有的 PAI 服务：

```bash
sudo docker exec -it dev-box /pai/paictl.py service delete
```

现在所有的 PAI 服务和数据都将被删除。如果想要删除 Kubernetes，请进入[`~/pai-deploy/kubespray` 文件夹](installation-guide.md#keep-a-folder)，运行：

```bash
ansible-playbook -i inventory/pai/hosts.yml reset.yml --become --become-user=root -e "@inventory/pai/openpai.yml"
```

建议保留文件夹 `~/pai-deploy` 以重新安装。

## <div id="lt100-uninstallation">OpenPAI < v1.0.0 的卸载指南<div>

### 将旧数据备份

卸载 OpenPAI < `v1.0.0` 后，您将不能保存任何有用的数据：所有任务、用户信息、数据集都将不可避免地、不可逆转地丢失。因此，如果在以前的部署中有任何有用的数据，请确保已将它们备份到其他位置。

#### HDFS数据

在`v1.0.0`之前，PAI会为您部署HDFS服务器。在`v1.0.0`之后，HDFS服务器将不会被部署。并且，升级时会删除以前的HDFS数据。

以下命令可用于备份旧的HDFS数据：

```bash
# 检查数据目录
hdfs dfs -ls hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/

hdfs dfs -copyToLocal hdfs://<hdfs-namenode-ip>:<hdfs-namenode-port>/ <local-folder>
```

如果您之前没有修改过默认配置，`<hdfs-namenode-ip>`和`<hdfs-namenode-port>`就是PAI的master ip和`9000`。当然，在备份时请确保您磁盘空间的大小是足够的。

#### 任务和用户的数据

任务和用户的数据也将丢失，包括任务记录、任务日志、用户名、用户密码等。我们没有自动工具可供您备份这些数据。如果您发现有价值的数据，请手动进行备份。

#### 其他Kubernetes中的资源

因为Kubernetes集群也会被清除，若您在Kubernetes上部署了一些有用的资源，也请为它们做一个备份。

### 清除旧的OpenPAI

请使用以下命令清除旧的OpenPAI：

```bash
git clone https://github.com/Microsoft/pai.git
cd pai
#  如果您的旧安装是不同的版本，请切换到相应的branch
git checkout pai-0.14.y

# 删除OpenPAI服务以及所有数据
./paictl.py service delete

# 清除K8S集群
./paictl.py cluster k8s-clean -f -p <path-to-your-old-config>
```

如果找不到旧配置（即上述的`<path-to-your-old-config>`），以下命令可以帮您取回：

```bash
./paictl.py config pull -o <path-to-your-old-config>
```

另外，您还需要删除旧OpenPAI安装的GPU驱动，方法为使用`root`用户在每个GPU节点上执行以下命令：

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
