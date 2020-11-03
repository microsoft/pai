如果您是中国用户，在[创建设置文件这一步](./installation-guide.md#create-configurations)，请使用下面的`config`文件：

###### `config` 示例

```yaml
user: <ssh用户>
password: <ssh密码>
branch_name: pai-1.0.y
docker_image_tag: v1.0.1

gcr_image_repo: "gcr.azk8s.cn"
kube_image_repo: "gcr.azk8s.cn/google-containers"
kubeadm_download_url: "https://shaiictestblob01.blob.core.chinacloudapi.cn/share-all/kubeadm"
hyperkube_download_url: "https://shaiictestblob01.blob.core.chinacloudapi.cn/share-all/hyperkube"

openpai_kubespray_extra_var:
  pod_infra_image_repo: "gcr.azk8s.cn/google_containers/pause-{{ image_arch }}"
  dnsautoscaler_image_repo: "gcr.azk8s.cn/google_containers/cluster-proportional-autoscaler-{{ image_arch }}"
  tiller_image_repo: "gcr.azk8s.cn/kubernetes-helm/tiller"
  registry_proxy_image_repo: "gcr.azk8s.cn/google_containers/kube-registry-proxy"
  metrics_server_image_repo: "gcr.azk8s.cn/google_containers/metrics-server-amd64"
  addon_resizer_image_repo: "gcr.azk8s.cn/google_containers/addon-resizer"
  dashboard_image_repo: "gcr.azk8s.cn/google_containers/kubernetes-dashboard-{{ image_arch }}"
```

此文件中，请把`user`和`password`替换为您master和worker机器的SSH用户及密码；`branch_name`和`docker_image_tag`请替换为想要安装的OpenPAI版本，例如如果想要安装`v1.1.0`版本，请将`branch_name`和`docker_image_tag`分别替换为`pai-1.1.y`和`v1.1.0`。另外，如果您在Azure China中搭建，请加入一行`openpai_kube_network_plugin: weave`，因为Azure暂时不支持默认的calico插件。

如果使用此`config`文件，会从我们合作伙伴[上海仪电创新院](https://www.shaiic.com/)提供的地址下载必要的`kubeadm`和`hyperkube`文件；此外会使用`gcr.azk8s.cn`作为`gcr.io`的镜像服务器。如果您的网络无法访问`gcr.azk8s.cn`，可以寻找别的`gcr.io`替代镜像，并对`config`文件作对应修改。

除了该`config`文件外，其他的步骤都和[Installation Guide](./installation-guide.md)一致。
