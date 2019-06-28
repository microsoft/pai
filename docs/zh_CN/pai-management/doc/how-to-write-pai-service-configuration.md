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
        - [Alert Manager](#alertmanager)
        - [Grafana](#grafana)

## Configure Kubernetes <a name="kubernetes"></a>

User could customize [Kubernetes](https://kubernetes.io/) at OpenPAI's [folder / file](../../../../deployment/k8sPaiLibrary/template)

## Configure Webportal <a name="webportal"></a>

User could customize Webportal at OpenPAI's [folder / file](../../webportal/README.md#Configuration)

User could customize Webportal startup configuration at OpenPAI's [folder / file](../../../../src/webportal/deploy/webportal.yaml.template)

## Configure Pylon <a name="pylon"></a>

User could customize Pylon at OpenPAI's [folder / file](../../pylon/README.md#Configuration)

User could customize Pylon startup configuration at OpenPAI's [folder / file](../../../../src/pylon/deploy/pylon.yaml.template)

## Configure FrameworkLauncher <a name="frameworklauncher"></a>

用户可以自定义 FrameworkLauncher [folder / file](../../../../subprojects/frameworklauncher/yarn/doc/USERMANUAL.md#Configuration)

User could customize FrameworkLauncher startup configuration at OpenPAI's [folder / file](../../../../src/yarn-frameworklauncher/deploy/yarn-frameworklauncher.yaml.template)

## Configure Rest-server <a name="restserver"></a>

User could customize rest server at OpenPAI's [folder / file](../../../../src/rest-server/deploy/rest-server.yaml.template)

User could customize rest server startup configuration at OpenPAI's [folder / file](../../../../src)

## Configure YARN / HDFS <a name="hadoop"></a>

User could customize Hadoop [YARN](https://hadoop.apache.org/docs/current/hadoop-yarn/hadoop-yarn-site/YARN.html) / [HDFS](https://hadoop.apache.org/docs/stable/hadoop-project-dist/hadoop-hdfs/HdfsUserGuide.html) at ([RM](../../../../src/hadoop-resource-manager/deploy/hadoop-resource-manager-configuration), [NM](../../../../src/hadoop-node-manager/deploy/hadoop-node-manager-configuration)).

User could customize Hadoop startup configuration at OpenPAI's [folder / file](../../../../src)

## Configure Zookeeper <a name="zookeeper"></a>

User could customize [Zookeeper](https://zookeeper.apache.org/) at OpenPAI's [folder / file](../../../../src/zookeeper/deploy/zk-configuration/zoo.cfg)

User could customize [Zookeeper](https://zookeeper.apache.org/) startup configuration at OpenPAI's [folder / file](../../../../src/zookeeper/deploy/zookeeper.yaml.template)

## Configure Prometheus / Exporter <a name="prometheus"></a>

User could customize [Prometheus](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) at OpenPAI's [folder / file](../../../../src/prometheus/deploy/prometheus-configmap.yaml.template)

User could customize [Prometheus](https://prometheus.io/docs/prometheus/latest/configuration/configuration/) startup configuration at OpenPAI's [folder / file](../../../../src/prometheus/deploy/prometheus-deployment.yaml.template)

User could customize [Node-exporter](https://github.com/prometheus/node_exporter) startup configuration at OpenPAI's [folder / file](../../../../src/node-exporter/deploy/node-exporter.yaml.template)

## Configure Alert Manager <a name="alertmanager"></a>

User could customize [Alert Manager](https://prometheus.io/docs/alerting/alertmanager/) at OpenPAI's [folder / file](../../../../src/alert-manager/deploy/alert-configmap.yaml.template). Please refer to [doc](../../alerting/alert-manager.md#configuration) for more info.

User could customize [Alerting rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/) at OpenPAI's [folder / file](../../../../src/prometheus/deploy/alerting)

## Configure Grafana <a name="grafana"></a>

User could customize [grafana](http://docs.grafana.org/installation/configuration/) config file at OpenPAI's [folder / file](../../../../src/grafana/deploy/grafana-configuration)

User could customize [grafana](http://docs.grafana.org/installation/configuration/) startup configuration at OpenPAI's [folder / file](../../../../src/grafana/src/run-grafana.sh)