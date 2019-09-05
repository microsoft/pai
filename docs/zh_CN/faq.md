# OpenPAI 常见问题

## 目录

1. [用户任务相关](#user-job-related-faqs)
2. [部署和管理相关](#deploy-and-maintenance-related-faqs)

## 用户任务相关

### Q: 如果用户发现一个任务重复失败多次，如何诊断？

A: 用户可以通过 yarn 找到任务的历史日志. 请参见 [issue-1072](https://github.com/Microsoft/pai/issues/1072)，以及下面任务日志相关部分的介绍:[Diagnostic job retried many times reason](./user/troubleshooting_job.md#job-is-running-and-retried-many-times) .

### Q: 如何确定任务失败的原因？

A: 请参见 [troubleshooting_job.md](./user/troubleshooting_job.md).

### Q: 提交 OpenPAI 任务时，如何使用本地仓库私有 docker 镜像

A: 需要在提交任务的json文件中指定身份验证配置，请参见 [job_tutorial.md](./job_tutorial.md):

提交任务时使用需要身份验证的私有Docker仓库和部署阶段不同, 需要按如下格式编写配置文件, 上传到HDFS， 然后在配置文件中指定 `authFile` 参数。

- (1) 创建 authFile

authfile 内容:

    userprivateimage.azurecr.io
    username
    password
    

注意: userprivateimage.azurecr.io 是Docker 仓库地址

- (2) [上传到 HDFS](./hadoop/hdfs.md#WebHDFS).

配置文件地址URL示例: hdfs://master_ip:9000/user/paidemo/authfile

- (3) 定义 `authFile` 参数

OpenPAI 任务json示例:

    {
      "jobName": "paidemo",
      "image": "userprivateimage.azurecr.io/demo4pai:test",
      "dataDir": "hdfs://master_ip:9000/user/paidemo/data",
      "outputDir": "hdfs://master_ip:9000/user/paidemo/output",
      "codeDir": "hdfs://master_ip:9000/user/paidemo/code",
      "authFile":"hdfs://master_ip:9000/user/paidemo/authfile",
      "taskRoles": [
        {
          "name": "demo4pai",
          "taskNumber": 1,
          "cpuNumber": 2,
          "memoryMB": 8192,
          "gpuNumber": 1,
          "command": " cd /home/test && bash train.sh"
        }
      ]
    }
    

*注意*:

- 如果使用 Docker Hub的私有仓库,   配置文件中`docker_registry_server` 项应该使用 `docker.io` .
- 相关 issue: [1125](https://github.com/Microsoft/pai/issues/1215)

### Q: PAI 支持的最大任务数量?

A: 默认配置下PAI最大可以支持60K任务数量, 包括 waiting/running/finished 状态的任务。

 这主要受限于`PAI services`默认使用的内存, 一般情况下都是足够用的.

例如, 用户可以有几百个正在运行的任务, 几千个等待中的任务, 几万个已经完成的任务.

### Q: 如何解决 `failed call to cuInit: CUresult(-1)`

 在任务容器内使用`expoert`命令检查`LD_LIBRARY_PATH` .应该有如下输出:

- `/usr/local/nvidia/lib`
- `/usr/local/nvidia/lib64`
- `/usr/local/cuda/extras/CUPTI/lib`
- `/usr/local/cuda/extras/CUPTI/lib64`

可以在Dockerfile中按如下格式增加 `LD_LIBRARY_PATH`:

    ENV LD_LIBRARY_PATH=/usr/local/nvidia/lib:/usr/local/nvidia/lib64:/usr/local/cuda/extras/CUPTI/lib:/usr/local/cuda/extras/CUPTI/lib64:$LD_LIBRARY_PATH
    

如果问题没解决，请使用脚本： [this script](https://gist.github.com/f0k/63a664160d016a491b2cbea15913d549) ，来检测问题.

## 部署和集群管理相关 FAQs

### Q: 为什么不推荐将master节点部署在运行任务的GPU服务器上?

A: 不推荐在master节点上运行任务，主要是防止master节点负载过高，影响集群稳定.

### Q: 如果OpenPAI集群有多个master节点，可否部署在不同的子网，并保持正常使用?

A: 理论上来说，只要网络互通就可以部署。但推荐将master节点部署在相同子网，因为集群对网络的依赖较高，一般跨网段会导致延迟变大，容易中断。


### Q: 为了充分利用集群资源，一个VC是否可以使用整个集群的闲置资源？

A: 默认情况下是可以的. OpenPAI 使用 YARN [capacity scheduler](https://hadoop.apache.org/docs/r1.2.1/capacity_scheduler.html)  管理集群资源. maximum-capacity 定义了任务队列所能使用的集群资源的上限. 默认值为 -1， 可以使用整个集群的资源.

### Q: 如何配置 virtual cluster ?

A: 通过 webportal

### Q: 出现 NodeFilesystemUsage 告警怎么办?

A: NodeFilesystemUsage 告警是由磁盘I/O负载过高引起. 根源是 HDFS, docker 数据缓存或用户数据缓存。 
出现这个问题时，管理员可以采取如下措施：

- (1) 检查 HDFS.

先检查 Hadoop 的 数据节点负载 (url example: http:// hadoop namenode/dfshealth.html#tab-datanode)。如果只是部分节点负载高, 运行 "hdfs balancer -policy datanode" 来重新平衡负载。如果所有节点负载都高, 手动清除一些数据后，再做rebalance.

- (2) 检查docker缓存数据.

运行 "docker system df" 查看可回收空间，如果空间很大，运行 "docker system prune -a" 清空缓存.

- (3) 检查 /tmp 目录. 

运行命令  "du -h / | awk '$1~/[0-9]*G/{print $0}'" 列出1G以上的大文件，删除不再使用的文件。

### Q: 如何OpenPAI里改变Docker的缓存目录?

A: 如果默认Docker缓存指向的磁盘空间过小, 可以按如下步骤修改:

1. 停止集群服务.  
        sudo ./paictl.py service stop

2. 停止 k8s 集群. *这步操作会删除所有数据*.  
        sudo ./paictl.py cluster k8s-clean –p /path/to/config

3. 使用data-root标记在OpenPAI节点上修改Docker缓存路径。
   参见 [Docker docs](https://docs.docker.com/config/daemon/systemd/)

4. 修改 layout.yaml文件。
   修改 "docker-data" 为上一步中配置的新路径. 
   参考示例：[layout.yaml](../../examples/cluster-configuration/layout.yaml#L55)

5. 使用新配置启动k8s集群.  
        sudo ./paictl.py cluster k8s-bootup –p /path/to/new/config

6. 推送新配置到集群.  
        sudo ./paictl.py config push –p /path/to/new/config

7. 重启所有服务.  
        sudo ./paictl.py service start

注意:

1. 修改生效期间集群不可用, 所有的镜像会重新下载，所以会需要较长时间。
2. 原来的缓存路径下文件需要手动清理。
