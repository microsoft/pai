# Pylon：PAI 通用入口点

Pylon 使得用户能够通过单一的集成入口访问 PAI 的各项功能。通常情况下该服务尤为重要：当集群屏蔽在一个网关之后而只有少数跳转机暴露在外时，将无法直接访问系统服务，因为只有跳转机具有公共 IP。使用该系统的唯一方法是在这些跳转机上设置 Pylon，作为内部服务与外部世界之间的代理。

## 内置重定向API

各种系统组件的API也可通过Pylon访问，用法：

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
