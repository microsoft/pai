# 如何添加和移除结点

OpenPAI暂时不支持修改master结点。因此，这里只提供添加worker结点的方法。您可以添加CPU结点、GPU结点、或者使用其他计算设备（如TPU、NPU）的结点到您的集群中。

## 准备工作

### 检查要添加的结点

*注意*：如果您只需要删除结点，请跳过这一节。

- 确认您要添加的worker结点符合[安装要求](./installation-guide.md##installation-requirements)。

- 如果您创建了PV或PVC, 请确认要添加的worker结点符合[数据存储要求](./how-to-set-up-storage.md#confirm-environment-on-worker-nodes)。

- 如果准备添加的结点曾被删除过，您可能需要重新加载systemd配置：

  ```bash
  ssh <结点> "sudo systemctl daemon-reload"
  ```


### 更改集群设置 

- 登入您的`dev box`机器并进入该集群对应的`dev box` Docker容器，并切换到`/pai`文件夹。如果您还未启动`dev box`容器，请[启动一个](./basic-management-operations.md##pai-service-management-and-paictl)。

  ```bash
  sudo docker exec -it <您的dev box容器名> bash
  cd /pai
  ```

- 使用`paictl.py`将集群中正在使用的设置拉取到`<配置文件夹>`。

    *注意*：请检查拉取的配置文件是否包含`config.yaml`。在v1.7.0版本以前，`config.yaml`存储于`dev box`机器上的`~/pai-deploy/cluster-cfg/config.yaml`位置。如果您已升级到 v1.7.0，请将它复制到`<配置文件夹>`并上传到K8s集群中。如果您的`config.yaml`已丢失，请参考[config.yaml格式示例](./installation-guide.md#configyamlexample)重新创建一个。

  ```bash
  ./paictl.py config pull -o <配置文件夹>
  ```

- 修改`<配置文件夹>/layout.yaml`。向`machine-list`中添加新结点，如有必要请创建一个新的`machine-sku`。请参考[layout.yaml格式示例](./installation-guide.md#layoutyaml-format)。

    *注意*：如果您只需要删除结点，请跳过这一步。

  ```yaml
  machine-list:
    - hostname: new-worker-node--0
      hostip: x.x.x.x
      machine-type: xxx-sku
      pai-worker: "true"

    - hostname: new-worker-node-1
      hostip: x.x.x.x
      machine-type: xxx-sku
      pai-worker: "true"
  ```

- 检查`<配置文件夹>/config.yaml`中的设置是否能确保您连接到集群中的所有机器。如果您使用SSH密钥对连接到集群，请将`dev box`机器上的`~/.ssh`文件夹挂载到`dev box` Docker容器的`/root/.ssh`。

- 在`<配置文件夹>/services-configuration.yaml`中适当修改HiveD的配置。 请参考[如何设置虚拟集群](./how-to-set-up-virtual-clusters.md)和[HiveD调度器的文档](https://github.com/microsoft/hivedscheduler/blob/master/doc/user-manual.md)。

    *注意*：如果您使用的是K8S默认调度器，请跳过这一步。

## 使用Paictl添加或删除节点

*注意*：以下操作应全部在`dev box`机器上的`dev box` Docker容器内进行。

*注意*：如果您需要删除结点，存储在K8S中`layout.yaml`会在操作完成后被自动修改。我们建议在`dev box`机器的文件系统中备份您的`<配置文件夹>`，以防`dev box`容器被关闭后原配置文件丢失。

- 停止相关服务。

  ```bash
  ./paictl.py service stop -n cluster-configuration hivedscheduler rest-server job-exporter
  ```

- 上传最新的配置文件。

  ```bash
  ./paictl.py config push -p <配置文件夹> -m service
  ```

- 从K8s集群中添加或删除结点。

  - 添加结点：

    ```bash  
    ./paictl.py node add -n <结点1> <结点2> ...
    ```

  - 删除结点：

    ```bash  
    ./paictl.py node remove -n <结点1> <结点2> ...
    ```

- 启动相关服务。

  ```bash
  ./paictl.py service start -n cluster-configuration hivedscheduler rest-server job-exporter
  ```
