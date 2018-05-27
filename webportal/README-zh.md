# Web Portal

Web Portal 为 job 和集群管理的入口。用户可以通过 Web 界面提交、监控、结束 job。也可通过 Web Portal 查看、管理集群状态。

## 部署

在[部署服务](../pai-management/README-zh.md#部署-k8s-服务)文档中介绍了 PAI 所有服务的部署过程，其中包括 Web Portal。

集群服务配置文件 [services-configuration.yaml](../cluster-configuration/services-configuration.yaml) 中的下列参数与 Web Portal 有关：

```
webportal:
  SERVER_PORT:    # Int，启动 Web Portal 的端口，例如，默认为 9286
```


## 用法

### 提交 job
点击 “Submit Job”，上传 JSON 格式的 job 配置文件，文件格式要求请参考  [PAI 深度学习任务指南](../job-tutorial/README-zh.md)

### 查看 job 状态
点击 “Job View” 查看全部 jobs 列表。点击每个 job 可以实时查看详细的状态。

### 查看集群状态
点击 “Cluster View”查看整个集群的状态，包括：

* 服务: 每台机器上所有服务的状态
* 硬件: 每台机器的硬件信息
* Kubernetes 页面

### 查阅文档
点击“Documents”可以查阅提交 job 的教程。