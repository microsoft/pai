# Pylon: PAI Entry Point Service

Pylon is a service that enables users to access PAI functionalities through a single integrated entry point. This service is necessary particularly in a common situation: the cluster is shielded behind a gateway in which only a few jump machines are exposed. In this situation, none of the system services can be accessed directly from outside because only the jump machines have public IPs. The only way to use the system is to deploy Pylon instances on these jump machines as a reverse proxy between the internal services and the outside world.

## Usage

### Built-In Redirected APIs

APIs of various system components can also be accessed via Pylon. Usage:

    http://<pylon_server>/<service>/api/<version>/...
    

Available services:

* PAI's REST server: `http://<pylon_server>/rest-server/api/v1/...`
* Kubernetes API server: `http://<pylon_server>/kubernetes/api/v1/...`
* WebHDFS API server: `http://<pylon_server>/webhdfs/api/v1/...`
* Prometheus API server: `http://<pylon_server>/prometheus/api/v1/...`

For example:

* Rest-server API: http://10.0.3.9/rest-server/api/v1/jobs
* Kubernetes API: http://10.0.3.9/kubernetes/api/v1/nodes
* WebHDFS API: http://10.0.3.9/webhdfs/api/v1/?op=LISTSTATUS
* Prometheus API: http://10.0.3.9/prometheus/api/v1/query?query=up

### Web Portals

The following web portals can be accessed via Pylon:

* K8s dashboard: `http://<pylon_server>/kubernetes-dashboard/`
* Yarn web portal: `http://<pylon_server>/yarn/`
* WebHDFS dashboard: `http://<pylon_server>/webhdfs/`
* Grafana: `http://<pylon_server>/grafana/`
* PAI web portal: `http://<pylon_server>/`

## Architecture

Pylon starts a [nginx](http://nginx.org/) instance in a Docker container to provide the functionality of reverse proxy. The configuration file of nginx, `nginx.conf`, is generated from a template file, `nginx.conf.template`, as soon as the Docker container starts. The variant fields in the template file, such as `REST_SERVER_URI`, correspond to environment variables of the same name inside the Docker container specified by the configuration YAML file of Pylon's daemon set in Kubernetes.

## Configuration

### For deploying as a standalone service (debugging)

If the nginx in Pylon is to be deployed as a stand alone service (usually for debugging purpose), the following environment variables must be set in advance:

* `REST_SERVER_URI`: String. The root url of the REST server.
* `K8S_API_SERVER_URI`: String. The root url of Kubernetes's API server.
* `WEBHDFS_URI`: String. The root url of WebHDFS's API server.
* `PROMETHEUS_URI`: String. The root url of Prometheus's API server.
* `K8S_DASHBOARD_URI`: String. The root url of the Kubernetes dashboard.
* `YARN_WEB_PORTAL_URI`: String. The root url of the Yarn web portal.
* `GRAFANA_URI`: String. The root url of Grafana.
* `PAI_WEB_PORTAL_URI`: String. The root url of the PAI web portal.

And before starting nginx, the `nginx.conf` file must be generated using `python render.py` and then be copied to nginx's configuration folder.

### For deploying with PAI

The deployment of Pylon goes with the bootstrapping process of the whole PAI cluster, which is described in detail in [Tutorial: Booting up the cluster](../pai-management/doc/distributed-deploy.md). To configure Pylon, change the following field(s) in the `pylon` section in [services-configuration.yaml](../../../examples/cluster-configuration/services-configuration.yaml) file:

* `server-port`: Integer. The network port to access Pylon. The default value is 80.

## Upgrading

Assume there is a newer version of Pylon image on DockerHub. To upgrade the current Pylon instances in the local cluster, please first update the cluster configuration to let Kubernetes pulls the correct Docker image, and then restart Pylon service using the `paictl` tool.

## Service metrics

(TBD)

Metrics:

* CPU.
* Main memory.
* Network traffic.

## Service monitoring

(TBD)

## High availability

Pylon is a stateless service. As a result, the high availability of this service is easy to be implemented -- simply deploy Pylon to multiple machines and then set up a load balancer pointing to these machines.

## Runtime requirements

Usually takes 1% of CPU utilization and less than 100 MB of main memory usage. Disk consumption is tiny.

## Trouble Shooting and Q&A

<N>