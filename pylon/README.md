# Pylon: Universal Entry to Inner APIs

## Usage

URL pattern:

```
http://<pylon_ip>:<pylon_port>/r/http/<api_server_ip>/<api_server_port>/...
```

For example:

- Example 1 – Kubernetes api: http://10.151.40.179:8086/r/http/10.151.40.179/8080/api/v1/nodes
- Example 2 – Prometheus api: http://10.151.40.179:8086/r/http/10.151.40.140/9090/api/v1/query?query=up
- Example 3 – Rest-server api: http://10.151.40.179:8086/r/http/10.151.40.179/9186/api/v1/jobs
- Example 4 – Webhdfs api: http://10.151.40.179:8086/r/http/10.151.40.179/50070/webhdfs/v1/?op=LISTSTATUS


## Deployment

The [readme](../service-deployment/README.md) in service deployment introduces the overall installation process. 

The following parameter in the [clusterconfig.yaml](../service-deployment/clusterconfig-example.yaml) are of interest:

- `port`: Integer. The port number to access the Pylon service. 
