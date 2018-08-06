# OpenPAI Service Configuration Document

OpenPAI configuration consists of several services:

## Index

- Configure OpenPAI services
    - [Kubernetes](#kubernetes)
    - Webportal
      - [Webportal](#webportal)
      - [Pylon](#pylon)
    - FrameworkLauncher
      - [FrameworkLauncher](#frameworklauncher)
      - [Rest-server](#restserver)
    - Hadoop
      - [YARN / HDFS](#hadoop)
      - [Zookeeper](#zookeeper)
    - Monitor
      - [Prometheus / Exporter](#prometheus) 
      - [Grafana](#grafana)

## Configure Kubernetes <a name="kubernetes"></a>

User could customize [Kubernetes](https://kubernetes.io/) configuration at OpenPAI's [folder / file](../k8sPaiLibrary/template) 

## Configure Webportal <a name="webportal"></a>

User could customize configuration at OpenPAI's [folder / file](../../webportal/README.md#Configuration) 

## Configure Pylon <a name="pylon"></a>

User could customize Pylon configuration at OpenPAI's [folder / file](../../pylon/README.md#Configuration) 

## Configure FrameworkLauncher <a name="frameworklauncher"></a>

User could customize FrameworkLauncher configuration at OpenPAI's [folder / file](../../frameworklauncher/doc/USERMANUAL.md#Configuration) 

## Configure Rest-server <a name="restserver"></a>

User could customize restserver configuration at OpenPAI's [folder / file](../../rest-server/README.md#Configuration)

## Configure YARN / HDFS <a name="hadoop"></a>

User could customize Hadoop [YARN](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html) / [HDFS](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsUserGuide.html) configuration at ([RM](../bootstrap/hadoop-resource-manager/hadoop-resource-manager-configuration), [NM](../bootstrap/hadoop-node-manager/hadoop-node-manager-configuration)).

## Configure Zookeeper <a name="zookeeper"></a>

User could customize [Zookeeper](https://zookeeper.apache.org/) configuration at OpenPAI's [folder / file](../src/zookeeper/zoo.cfg) 

## Configure Prometheus / Exporter <a name="prometheus"></a>

User could customize [Prometheus](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) config file configuration at OpenPAI's [folder / file](../bootstrap/prometheus/prometheus-configmap.yaml.template) 

User could customize Prometheus launch script configuration at OpenPAI's [folder / file](../bootstrap/prometheus/prometheus-deployment.yaml.template) 

User could customize [Node-exporter](https://github.com/prometheus/node_exporter) launch script configuration at OpenPAI's [folder / file](../bootstrap/prometheus/node-exporter-ds.yaml.template) 

## Configure Grafana <a name="grafana"></a>

User could customize [grafana](http://docs.grafana.org/installation/configuration/) config file configuration at OpenPAI's [folder / file](../src/grafana/grafana_config.sh) 

User could customize grafana launch script configuration at OpenPAI's [folder / file](../src/grafana/start_server.sh) 


