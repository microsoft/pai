# 如何添加和移除结点

OpenPAI暂时不支持修改master结点。因此，这里只提供添加worker结点的方法。您可以添加CPU结点、GPU结点、或者使用其他计算设备（如TPU、NPU）的结点到您的集群中。

## 准备工作

### 检查要添加的结点

*注意*：如果您只需要删除结点，请跳过这一节。

- 确认您要添加的worker结点符合[安装要求](./installation-guide.md##installation-requirements)。

- 如果您创建了PV或PVC, 请确认要添加的worker结点符合[数据存储要求](./how-to-set-up-storage.md#confirm-environment-on-worker-nodes)。

- 如果准备添加的结点曾被删除过，您可能需要重启它们的Docker守护进程。

### 更改集群设置 

- 登入您的`dev box`机器并进入该集群对应的`dev box` Docker容器，并切换到`/pai`文件夹。如果您还未启动`dev box`容器，请[启动一个](./basic-management-operations.md##pai-service-management-and-paictl)。

  ```bash
  sudo docker exec -it <您的dev box容器名> bash
  cd /pai
  ```

- 使用`paictl.py`将集群中正在使用的设置拉取到`<配置文件夹>`。

  ```bash
  ./paictl.py config pull -o <配置文件夹>
  ```

- 修改`<配置文件夹>/layout.yaml`。向 `machine-list`中添加新结点，如有必要请创建一个新的`machine-sku`。请参考[layout.yaml的格式约定](./installation-guide.md#layoutyaml-format)。

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
