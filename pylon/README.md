# Pylon: Universal Entry to Inner APIs

## Usage

URL pattern:

```
http://<pylon_ip>:<pylon_port>/r/http/<api_server_ip>/<api_server_port>/...
```

For example:

- Rest-server api: http://10.0.3.9:8086/r/http/10.0.3.9/9186/api/v1/jobs
- Kubernetes api: http://10.0.3.9:8086/r/http/10.0.3.9/8080/api/v1/nodes
- Prometheus api: http://10.0.3.9:8086/r/http/10.0.1.9/9090/api/v1/query?query=up
- Webhdfs api: http://10.0.3.9:8086/r/http/10.0.3.9/50070/webhdfs/v1/?op=LISTSTATUS

**TODO**: In the future, the interface of Pylon should be changed to hide the addresses of underlying services. Specifically, we should replace `/r/<api_server_ip>/<api_server_port>/api` part to `/api/<service_name>`, For example:

- Rest-server api: http://10.0.3.9:8086/api/restserver/v1/jobs
- Kubernetes api: http://10.0.3.9:8086/api/kubernetes/v1/nodes
- Prometheus api: http://10.0.3.9:8086/api/prometheus/v1/query?query=up
- Webhdfs api: http://10.0.3.9:8086/api/webhdfs/v1/?op=LISTSTATUS

In addition, the webportal will aslo be redirected from Pylon:

- Web portal: http://10.0.3.9:8086/webportal

## Deployment

The [readme](../service-deployment/README.md) in service deployment introduces the overall installation process. 

The following parameter in the [clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml) are of interest:

- `port`: Integer. The port number to access the Pylon service. 
