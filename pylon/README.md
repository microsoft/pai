# Pylon: Universal Entry to API Servers

## Built-In Redirected APIs

URL pattern:

```
http://<pylon_ip>:<pylon_port>/api/<api_server_name>...
```

Available api server names:

- `rest-server`: PAI's REST server.
- `kubernetes`: Kubernetes API server.
- `prometheus`: Prometheus API server.
- `webhdfs`: Web HDFS API server.

For example:

- Rest-server api: http://10.0.3.9:8086/api/restserver/v1/jobs
- Kubernetes api: http://10.0.3.9:8086/api/kubernetes/v1/nodes
- Prometheus api: http://10.0.3.9:8086/api/prometheus/v1/query?query=up
- Webhdfs api: http://10.0.3.9:8086/api/webhdfs/v1/?op=LISTSTATUS

## General-Purpose Reverse Proxy

URL pattern:

```
http://<pylon_ip>:<pylon_port>/r/http/<api_server_ip>/<api_server_port>...
```

For example:

- Rest-server api: http://10.0.3.9:8086/r/http/10.0.3.9/9186/api/v1/jobs
- Kubernetes api: http://10.0.3.9:8086/r/http/10.0.3.9/8080/api/v1/nodes
- Prometheus api: http://10.0.3.9:8086/r/http/10.0.1.9/9090/api/v1/query?query=up
- Webhdfs api: http://10.0.3.9:8086/r/http/10.0.3.9/50070/webhdfs/v1/?op=LISTSTATUS

## PAI Web Portal (Future Feature)

PAI's webportal can aslo be redirected from Pylon:

- Web portal: http://10.0.3.9:8086/webportal

## Deployment

The [readme](../service-deployment/README.md) in service deployment introduces the overall installation process. 

The following parameter in the [clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml) are of interest:

- `rest_server_uri`: String. The root url of the REST server.
- `k8s_api_server_uri`: String. The root url of Kubernetes's API server.
- `prometheus_uri`: String. The root url of Prometheus's API server.
- `webhdfs_uri`: String. The root url of WebHDFS's API server.
- `port`: Integer. The port number to access the Pylon service. 

