# Goal

 Grafana allows you to query, visualize, alert on and understand your metrics no matter where they are stored. In PAI system, the Grafana provides beautiful analytics and monitoring for cluster runtime environment and job metrics.

# Architecture

Prometheus scrapes metrics through exporters. It stores all scraped samples locally and runs rules over this data to either aggregate and record new time series from existing data or generate alerts. [Grafana](https://grafana.com/) or other API consumers can query the Prometheus server to visualize the collected data.
![Architecture](grafana.png)


# Dependencies

The Grafana can start up independently, but to show the monitoring data, it depends on the following service:
[Prometheus](../../src/prometheus)

# Build

If you want to build Grafana only, under the `pai-management` directory, run the following command, note to replace `/path/to/cluster-configuration/dir` with your own cluster configuration path.

```sh
python paictl.py image build -p /path/to/cluster-configuration/dir -n grafana
```

# Configuration / Reconfiguration
You can change the following configuration of Grafana in [services-configuration.yaml](../../examples/cluster-configuration/services-configuration.yaml) file:

```
grafana-port: 3000        # port for grafana
```

# Deployment

The deployment of web portal goes with the bootstrapping process of the whole PAI cluster, which is described in detail in [Tutorial: Booting up the cluster](../pai-management/doc/cluster-bootup.md).

If you want to redeploy Grafana only, firstly stop it, note to replace `/path/to/cluster-configuration/dir` with your own cluster configuration path:

```sh
python paictl.py service stop -p /path/to/cluster-configuration/dir -n grafana
```
Then redeploy Grafana only:

```sh
python paictl.py service start -p /path/to/cluster-configuration/dir -n grafana
```
For more details, please refer to [Maintain your service](../pai-management/doc/service-maintain.md).
# Upgrading

System will automatically pull the latest Grafana image, there is no need to upgrade. If you want to use the specific version of Grafana, you can change the version configuration at the [grafana.yaml.template](../../src/grafana/deploy/grafana.yaml.template#L44) and then redeploy it.
# Service Metrics

N/A

# Service Monitoring

N/A

# High Availability

The new feature is on the way.

# Runtime Requirements

It doesn't require much resources, a normal PC with [Docker](https://docs.docker.com/install/linux/docker-ce/ubuntu/) installed is ok.
Usually it takes 0.04% of CPU utilization, about 28MB of memory usage. Disk consumption is tiny.

# Trouble Shooting and Q&A

Q: xxx  
A: xxx

Q: xxx  
A: xxx
