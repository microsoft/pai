# Pylon: PAI Universal Entry Point

Pylon is a service that enables users to access PAI functionalities through a single integrated entry point. This service is necessary particularly in a common situation: the cluster is shielded behind a gateway in which only a few jump machines are exposed. In this situation, none of the system services can be accessed directly because only the jump machines have public IPs. The only way to use the system is to setup Pylon on these jump machines as a proxy between the internal services and the outside world.

## PAI Web Portal

PAI's webportal can be accessed via Pylon:

```
http://<pylon_server>
```

## Built-In Redirected APIs

APIs of various system components can also be accessed via Pylon. Usage:

```
http://<pylon_server>/<service>/api/...
```

Available services:

- `rest-server`: PAI's REST server.
- `kubernetes`: Kubernetes API server.
- `prometheus`: Prometheus API server.
- `webhdfs`: Web HDFS API server.

For example:

- Rest-server api: http://10.0.3.9/restserver/api/v1/jobs
- Kubernetes api: http://10.0.3.9/kubernetes/api/v1/nodes
- Prometheus api: http://10.0.3.9/prometheus/api/v1/query?query=up
- Webhdfs api: http://10.0.3.9/webhdfs/api/v1/?op=LISTSTATUS

## General-Purpose Reverse Proxy

Pylon also has a general-purpose reverse proxy:

```
http://<pylon_server>/r/http/<api_server_ip>/<api_server_port>...
```

For example:

- Rest-server api: http://10.0.3.9/r/http/10.0.3.9/9186/api/v1/jobs
- Kubernetes api: http://10.0.3.9/r/http/10.0.3.9/8080/api/v1/nodes
- Prometheus api: http://10.0.3.9/r/http/10.0.1.9/9090/api/v1/query?query=up
- Webhdfs api: http://10.0.3.9/r/http/10.0.3.9/50070/webhdfs/v1/?op=LISTSTATUS


## Deployment

The [readme](../service-deployment/README.md) in service deployment introduces the overall installation process. 

The following parameter in the [clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml) are of interest:

- `rest_server_uri`: String. The root url of the REST server.
- `k8s_api_server_uri`: String. The root url of Kubernetes's API server.
- `prometheus_uri`: String. The root url of Prometheus's API server.
- `webhdfs_uri`: String. The root url of WebHDFS's API server.
- `webportal_uri`: String. The root url of the web portal.
- `port`: Integer. The port number to access the Pylon service. 

