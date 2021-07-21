###### Azure中国用户`config` 示例

如果您是Azure中国用户，在[创建设置文件这一步](./installation-guide.md#create-configurations)，请使用下面的`config`文件：

```yaml
user: <ssh用户>
password: <ssh密码>
docker_image_tag: v1.5.0

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
openpai_kube_network_plugin: weave
```

此文件中，请把`user`和`password`替换为您master和worker机器的SSH用户及密码；`docker_image_tag`请替换为想要安装的OpenPAI版本，例如如果想要安装`v1.5.0`版本，请将`docker_image_tag`替换为`v1.5.0`。

如果使用此`config`文件，会从我们合作伙伴[上海仪电创新院](https://www.shaiic.com/)提供的地址下载必要的`kubeadm`和`hyperkube`文件；此外会使用`gcr.azk8s.cn`作为`gcr.io`的镜像服务器。

除了该`config`文件外，其他的步骤都和[Installation Guide](./installation-guide.md)一致。

###### 中国用户`config` 示例

如果您是中国用户，在[创建设置文件这一步](./installation-guide.md#create-configurations)，请使用下面的`config`文件：

```yaml
user: <ssh用户>
password: <ssh密码>
docker_image_tag: v1.5.0

openpai_kubespray_extra_var:
  download_container: false
  skip_downloads: true
```

此文件中，请把`user`和`password`替换为您master和worker机器的SSH用户及密码；`docker_image_tag`请替换为想要安装的OpenPAI版本，例如如果想要安装`v1.5.0`版本，请将`docker_image_tag`替换为`v1.5.0`。

如果使用此`config`文件，请在运行`/bin/bash quick-start-kubespray.sh`前，下载相关离线文件文件。

[下载地址](https://rgfmxa.bn.files.1drv.com/y4mqw1jGMrxkqlopAKLRwcxG52YJjPfixnxVqP9VBTBmX7eMNbrVRfXEOWU5YNBesdrlvOFoPlONsJ6Vd2cz0sPP4uA8Ct2D0FH5B4f4_54RkHRm9yPAy8iadCkCOkPRToajqn692j3Y-d36b00JFnISa2WkJF7l2N1aoXYKFTFIWaiDIbautMZrQJjqE1lfrPD2fDxI4YWhP-jnC2lPXMwKw)

将下载好的文件分发到集群中所有节点，并运行下述命令：

```bash
unzip pai-offine-deploy.zip
cd pai-offine-deploy
chmod +x setup.sh
sudo ./setup.sh
```

注意，上述文件适用于x86_64架构，其他架构的相关文件链接可在 [kubespray/blob/master/roles/download/defaults/main.yml](https://github.com/kubernetes-sigs/kubespray/blob/master/roles/download/defaults/main.yml)找到。

除此以外，其他的步骤都和[Installation Guide](./installation-guide.md)一致。
