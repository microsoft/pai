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

User could customize configuration at this [folder / file](../k8sPaiLibrary/template) 

## Configure Webportal <a name="webportal"></a>

User could customize configuration at this [folder / file](../../webportal/README.md#Configuration) 

## Configure Pylon <a name="pylon"></a>

User could customize configuration at this [folder / file](../../pylon/README.md#Configuration) 

## Configure FrameworkLauncher <a name="frameworklauncher"></a>

User could customize configuration at this [folder / file](../../frameworklauncher/doc/USERMANUAL.md#Configuration) 

## Configure Rest-server <a name="restserver"></a>

User could customize configuration at this [folder / file](../../rest-server/README.md#Configuration)

## Configure YARN / HDFS <a name="hadoop"></a>

User could customize configuration at this [folder / file](../../yarn/yarn.md#Configuration ) 

## Configure Zookeeper <a name="zookeeper"></a>

User could customize configuration at this [folder / file](../src/zookeeper/zoo.cfg) 

## Configure Prometheus / Exporter <a name="prometheus"></a>

User could customize Prometheus config file configuration at this [folder / file](../bootstrap/prometheus/prometheus-configmap.yaml.template) 

User could customize Prometheus launch script configuration at this [folder / file](../bootstrap/prometheus/prometheus-deployment.yaml.template) 

User could customize Node-exporter launch script configuration at this [folder / file](../bootstrap/prometheus/node-exporter-ds.yaml.template) 

## Configure Grafana <a name="grafana"></a>

User could customize grafana config file configuration at this [folder / file](../src/grafana/grafana_config.sh) 

User could customize grafana launch script configuration at this [folder / file](../src/grafana/start_server.sh) 


