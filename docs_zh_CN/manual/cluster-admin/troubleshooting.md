# 故障排查

本文档主要介绍在实践中几种故障排查的方法。

### PaiServicePodNotReady报警

这是来自alert manager的报警，一般是因为服务容器被operator或OOM Killer kill导致的。

您可以使用Prometheus来检查它是否被OOM Killer kill：

  1. 访问Prometheus页面，通常是`http://<your-pai-master-ip>:9091`。
  2. 请求`node_memory_MemFree_bytes`。
  3. 如果空闲内存接近0，那可能就是由于OOM killer的原因被Kill。
  4. 如果您想要再次确认，可以登录到对应node上，运行命令`dmesg`并在结果中找是否有`oom`的字样。或者您可以使用命令`docker inspect <被kill的docker的id>`来获得详细的信息。 

解决方法:

  1. 移除不健康的pod：
  `kubectl delete pod <不健康的pod的名称> --grace-period=0 --force`
  2. 在Kubernetes中重新创建pod。 由于dockerd可能在OOM时表现不正常，这个操作可能会被一直卡住。如果是这种情况的话，您可以登录到对应node中用命令`/etc/init.d/docker restart`重启dockerd。
  3. 如果重启不能解决问题，您可以适当提高pod的内存限制。 

### NodeNotReady报警

这是来自alert manager的报警，一般是由watchdog服务报告的。

watchdog会从Kubernetes的API Server请求metrics，例如：

```
pai_node_count{disk_pressure="false",instance="10.0.0.1:9101",job="pai_serivce_exporter",memory_pressure="false",name="10.0.0.2",out_of_disk="false",pai_service_name="watchdog",ready="true",scraped_from="watchdog-5ddd945975-kwhpr"}
```

`name`表示这个metrics代表的是哪个结点。

如果对应结点是处于"unknown"状态，那么它可能已经和Kubernetes Master断联了，这可能是由于下列原因： 

  - 结点被关闭
  - 对应结点上的Kubelet被关闭
  - 在结点和Kubernetes Master间有网络问题。

您可以先尝试登录到这个结点。如果您无法登录，并且ping这个结点也没反应，那可能这个结点已经被关机了，您需要重新启动它。

如果您可以登录到这个结点，那么您需要检查kubelet是否正常。使用命令`sudo systemctl status kubelet`来检查，通常您可以看到kubelet服务。

接下来，您需要检查kubelet的log，并检查是否它可以访问Kubernetes API。如果您看到类似下面这种log：

```
  E0410 04:24:30.663050    2491 kubelet_node_status.go:386] Error updating node status, will retry: error getting node "10.0.0.1": Get http://10.0.1.2:8080/api/v1/nodes/10.0.0.1: net/http: request canceled while waiting for connection (Client.Timeout exceeded while awaiting headers)
```

这表示该结点无法向Kubernetes报告状态，因此Kubernetes认为它的状态是"unknown"，然后报警就被触发了。此时您需要检查网络连接是否存在问题。


### NodeFilesystemUsage报警

这是来自alert manager的报警。它被用来监控各个机器的磁盘使用状况。如果某个结点磁盘空间超过80%被使用，就会触发这个警告。OpenPAI有两个服务会使用大量磁盘空间：storage manager和docker image cache。 

解决方法:

  1. 如果您设置了storage manager，请检查storage manager占用的空间。
  2. 检查docker cache。
  3. 检查PAI的log文件夹：`/var/log/pai`.

### 无法检测到NVIDIA GPU

如果您无法在您的任务中使用GPU，您可以在Worker结点上follow下面的步骤来检查：

 1. 显卡驱动安装正确。如果是Nvidia卡的话，使用`nvidia-smi`来检查。
 2. [nvidia-container-runtime](https://github.com/NVIDIA/nvidia-container-runtime)已经被正确安装，并且被设置为Docker的默认runtime。您可以用`docker info -f "{{json .DefaultRuntime}}"`来检查。

如果是在Webportal中显示的GPU数目有出入，请参考[这个文档](./how-to-set-up-virtual-clusters.md)对集群重新进行配置。

### 使用监测信息无法显示

如果您没法看到一些使用状况的监测信息（例如：GPU利用率、CPU利用率、网络占用），请检查如下服务是否在正确运行： `prometheus`、 `grafana`、 `job-exporter` 和 `node-exporter`。

详细来说，您可以登录[dev box container](./basic-management-operations.md#pai-service-management-and-paictl)，使用命令`kubectl get pod`。您可以用命令`kubectl logs <pod-name>`看到不同pod的日志。当您解决了对应问题后，您可以[重启整个集群](./basic-management-operations.md#pai-service-management-and-paictl)。

### Worker结点在被重新分配后无法自动回到Kubernetes系统

在使用一些云服务的时候，如果您选择的是低优先级计算结点，那么您的Worker结点可能被随时取消分配。通常来说，这些结点只是短暂地消失，当它被再次分配时，一切都会恢复正常，您不需要做任何特殊处理。
 
但是，有些云服务商不仅仅取消分配结点，还把结点磁盘中的内容全部删除。此时，结点将无法自动回到Kubernetes系统中。我们推荐您在dev box机器上，为这种状况设置一个cron job，定期地把丢失的结点重新加到系统中。

在文档[如何添加和移除结点](how-to-add-and-remove-nodes.md)中，我们已经描述了如何添加结点。在这里，cron job并不需要做添加结点的所有事，它只需要把node重新假如Kubernetes就可以了。 它可以找到所有在Kubernetes中显示`NotReady`的结点，然后使用下面的命令尝试将他们找回来： 

```bash
ansible-playbook -i inventory/mycluster/hosts.yml upgrade-cluster.yml --become --become-user=root  --limit=${limit_list} -e "@inventory/mycluster/openpai.yml"
```

`${limit_list}`代表那些被取消分配的结点。例如，如果该cron job发现结点`a`和结点`b`现在可以使用了，但是在Kubernetes中它们还是`NotReady`状态，就可以指定`limit_list=a,b`。

### 如何增加Internal Storage的大小

目前，OpenPAI使用[internal storage](https://github.com/microsoft/pai/tree/master/src/internal-storage)来存储数据库。Internal storage使用Linux loop device来提供一个有严格大小限制的存储。默认的限制是30 GB (或者，在OpenPAI <= `v1.1.0`时，为10GB)。这些空间大概可以保存1,000,000个任务。如果您想要更大的空间，可以follow下面的步骤：

第一步. [登录进一个dev box container](./basic-management-operations.md#pai-service-management-and-paictl)

第二步. 在dev box container内，结束所有PAI服务： `./paictl.py service stop`.

第三步. 登录Master结点，找到internal storage对应的文件夹 (默认路径为`/mnt/paiInternal`)，将它移动到另一处`sudo mv /mnt/paiInternal /mnt/paiInternalBak`。

第四步. 在 `services-configuration.yaml`中更新internal storage的设置。 例如，将大小限制调整为100 GB： 
```
internal-storage:
    quota-gb: 100
```
如果该文件中没有 `internal-storage` 字段，您可以手动创建它。

更新集群配置 `./paictl.py config push -p <config-folder> -m service`

第五步. 在dev box container内，启动internal storage：`./paictl.py service start -n internal-storage`

第六步. 在internal storage ready后，Master结点上将会有一个新的`/mnt/paiInternal`目录。将原来的目录移动到里面，目前我们只需要移动`pgdata`文件夹：`sudo mv /mnt/paiInternalBak/pgdata /mnt/paiInternal/`.

第七步. 在dev box container内，启动所有PAI service： `./paictl.py service start`。
