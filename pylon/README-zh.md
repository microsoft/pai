# Pylon：PAI 统一入口服务

Pylon 为用户提供统一的入口来访问 PAI 的各项功能。该组件在如下常见的场景下尤为必要：如果集群中的大多数机器都位于一个内部网关的屏蔽之下，只有少数机器拥有公共 IP，可以作为跳板机供外界访问。在这种情况下，用户将无法直接访问 PAI 的服务；而解决问题的唯一方法是在跳板机上部署 Pylon，作为内部服务与外部使用者之间的代理。

## 内置重定向 API

各种系统组件的 API 也可通过 Pylon 访问，用法：

```
http://<pylon_server>/<service>/api/<version>/...
```

可用的服务:

- PAI's REST server: `http://<pylon_server>/rest-server/api/v1/...`
- Kubernetes API server: `http://<pylon_server>/kubernetes/api/v1/...`
- WebHDFS API server: `http://<pylon_server>/webhdfs/api/v1/...`
- Prometheus API server: `http://<pylon_server>/prometheus/api/v1/...`

例如:

- Rest-server API: http://10.0.3.9/rest-server/api/v1/jobs
- Kubernetes API: http://10.0.3.9/kubernetes/api/v1/nodes
- WebHDFS API: http://10.0.3.9/webhdfs/api/v1/?op=LISTSTATUS
- Prometheus API: http://10.0.3.9/prometheus/api/v1/query?query=up

## Web Portals

下列 Web Portals 可通过 Pylon 访问：

- Kubernetes dashboard: `http://<pylon_server>/kubernetes-dashboard/`
- Yarn web portal: `http://<pylon_server>/yarn/`
- WebHDFS dashboard: `http://<pylon_server>/webhdfs/`
- Grafana: `http://<pylon_server>/grafana/`
- PAI web portal: `http://<pylon_server>/`

## 开发者指南

### 本地调试

步骤:
- (在 Windows 命令行中) 运行下列 .bat 文件:
  ```
  set REST_SERVER_URI=...
  set K8S_API_SERVER_URI=...
  set WEBHDFS_URI=...
  set PROMETHEUS_URI=...
  set K8S_DASHBOARD_URI=...
  set YARN_WEB_PORTAL_URI=...
  set GRAFANA_URI=...
  set PAI_WEB_PORTAL_URI=...
  ```
- 运行：`python render.py`
- 复制生成的 `nginx.conf` 至 nginx 配置目录 

### 部署至 PAI 集群

Pylon 的部署过程包含在[部署 k8s 服务](../pai-management/README-zh.md#部署-k8s-服务) 中。
请正确配置集群配置文件 [services-configuration.yaml](../cluster-configuration/services-configuration.yaml) 中的下列参数:
```
pylon:
  port:    # Integer. 访问 Pylon 服务的端口号
```
