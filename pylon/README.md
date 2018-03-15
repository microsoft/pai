# Pylon: PAI Universal Entry Point

Pylon is a service that enables users to access PAI functionalities through a single integrated entry point. This service is necessary particularly in a common situation: the cluster is shielded behind a gateway in which only a few jump machines are exposed. In this situation, none of the system services can be accessed directly because only the jump machines have public IPs. The only way to use the system is to setup Pylon on these jump machines as a proxy between the internal services and the outside world.

## Built-In Redirected APIs

APIs of various system components can also be accessed via Pylon. Usage:

```
http://<pylon_server>/<service>/api/<version>/...
```

Available services:

- PAI's REST server: `http://<pylon_server>/rest-server/api/v1/...`
- Kubernetes API server: `http://<pylon_server>/kubernetes/api/v1/...`
- WebHDFS API server: `http://<pylon_server>/webhdfs/api/v1/...`
- Prometheus API server: `http://<pylon_server>/prometheus/api/v1/...`

For example:

- Rest-server API: http://10.0.3.9/rest-server/api/v1/jobs
- Kubernetes API: http://10.0.3.9/kubernetes/api/v1/nodes
- WebHDFS API: http://10.0.3.9/webhdfs/api/v1/?op=LISTSTATUS
- Prometheus API: http://10.0.3.9/prometheus/api/v1/query?query=up

## Web Portals

The following web portals can be accessed via Pylon:

- K8s dashboard: `http://<pylon_server>/kubernetes-dashboard/`
- Yarn web portal: `http://<pylon_server>/yarn/`
- WebHDFS dashboard: `http://<pylon_server>/webhdfs/`
- Grafana: `http://<pylon_server>/grafana/`
- PAI web portal: `http://<pylon_server>/`

## Developer's Guide

### Local Debugging

Steps:
- (In Windows command line) Run the following .bat file:
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
- Run: `python render.py`
- Copy the generated `nginx.conf` to the nginx configuration folder.

### Deploy to a PAI Cluster

The [readme](../service-deployment/README.md) in service deployment introduces the overall installation process. 

The following parameters in the [clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml) should be correctly configured:

- `rest_server_uri`: String. The root url of the REST server.
- `k8s_api_server_uri`: String. The root url of Kubernetes's API server.
- `webhdfs_uri`: String. The root url of WebHDFS's API server.
- `prometheus_uri`: String. The root url of Prometheus's API server.
- `k8s_dashboard_uri`: String. The root url of the Kubernetes dashboard.
- `yarn_web_portal_uri`: String. The root url of the Yarn web portal.
- `grafana_uri`: String. The root url of Grafana.
- `pai_web_portal_uri`: String. The root url of the PAI web portal.
- `port`: Integer. The port number to access the Pylon service. 
