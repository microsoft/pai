# OpenPAI Service Configuration Document

OpenPAI consists of multiple services, user could customize each service.

## Table of Contents

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

User could customize [Kubernetes](https://kubernetes.io/) at OpenPAI's [folder / file](../k8sPaiLibrary/template) 

## Configure Webportal <a name="webportal"></a>

User could customize Webportal at OpenPAI's [folder / file](../../webportal/README.md#Configuration) 

User could customize Webportal startup configuration at OpenPAI's [folder / file](../bootstrap/webportal/webportal.yaml.template) 

## Configure Pylon <a name="pylon"></a>

User could customize Pylon at OpenPAI's [folder / file](../../pylon/README.md#Configuration) 

User could customize Pylon startup configuration at OpenPAI's [folder / file](../bootstrap/pylon/pylon.yaml.template) 

## Configure FrameworkLauncher <a name="frameworklauncher"></a>

User could customize FrameworkLauncher at OpenPAI's [folder / file](../../frameworklauncher/doc/USERMANUAL.md#Configuration) 

User could customize FrameworkLauncher startup configuration at OpenPAI's [folder / file](../bootstrap/frameworklauncher/frameworklauncher.yaml.template) 

## Configure Rest-server <a name="restserver"></a>

User could customize rest server at OpenPAI's [folder / file](../bootstrap/rest-server/rest-server.yaml.template)

User could customize rest server startup configuration at OpenPAI's [folder / file](../bootstrap) 

## Configure YARN / HDFS <a name="hadoop"></a>

User could customize Hadoop [YARN](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html) / [HDFS](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsUserGuide.html) at ([RM](../bootstrap/hadoop-resource-manager/hadoop-resource-manager-configuration), [NM](../bootstrap/hadoop-node-manager/hadoop-node-manager-configuration)).

User could customize Hadoop startup configuration at OpenPAI's [folder / file](../bootstrap) 


## Configure Zookeeper <a name="zookeeper"></a>

User could customize [Zookeeper](https://zookeeper.apache.org/) at OpenPAI's [folder / file](../src/zookeeper/zoo.cfg) 

User could customize [Zookeeper](https://zookeeper.apache.org/) startup configuration at OpenPAI's [folder / file](../bootstrap/zookeeper/zookeeper.yaml.template) 

## Configure Prometheus / Exporter <a name="prometheus"></a>

User could customize [Prometheus](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) at OpenPAI's [folder / file](../bootstrap/prometheus/prometheus-configmap.yaml.template) 

User could customize [Prometheus](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) startup configuration at OpenPAI's [folder / file](../bootstrap/prometheus/prometheus-deployment.yaml.template) 

User could customize [Node-exporter](https://github.com/prometheus/node_exporter) startup configuration at OpenPAI's [folder / file](../bootstrap/prometheus/node-exporter-ds.yaml.template) 

## Configure Grafana <a name="grafana"></a>

User could customize [grafana](http://docs.grafana.org/installation/configuration/) config file at OpenPAI's [folder / file](../src/grafana/grafana_config.sh) 

User could customize [grafana](http://docs.grafana.org/installation/configuration/) startup configuration at OpenPAI's [folder / file](../src/grafana/start_server.sh) 


