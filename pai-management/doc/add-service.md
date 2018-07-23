# add a service

For advanced user. A guide for developer to add their own service into pai.


## Index

- [ Overview ](#overview)
- [ Cluster Object Model ](#Model)
- [ Add Service's Image ](#Image)
    - [ Prepare Service Docker Image ](#Image_Prepare)
    - [ Write PAI's Image Configuration ](#Image_Configuration)
    - [ Place the Image Directory into PAI ](#Image_Place)
    - [ Build and Push ](#Image_Build_Push)
- [ Add Service's Bootstrap Module ](#Boot)
    - [ Prepare Service Configuration ](#Service_Configuration)
    - [ Some Experience of Kubernetes ](#Experience)
    - [ Place the Module into PAI ](#Service_Place)
    - [ Label the node and start service](#Service_Start)


## Overview <a name="overview"></a>

This tutorial will guide you to add a service to PAI.
An example of [Apache HBase](https://hbase.apache.org/)  will be here. And follow it step by step, you will know how to add your own service.

In this tutorial, you will be able to setup HBase on PAI.


## Cluster Object Model <a name="Model"></a>

This chapter will teach you to write the configuration model of your service, and will guide you how to get other service's configuration.

This module will coming soon. After that, you will be able to add your configuration and pass them into the service.


## Add Service' Image <a name="Image"></a>

This chapter will teach you how to add your customized image to pai. After everything is done, paictl image command will build and push your image to the target docker registry.

If your service image could be pulled from a public docker registry, you could skip this step.



#### Prepare Service Docker Image <a name="Image_Prepare"></a>

It will not guide you to write a dockerfile. If you a new developer of docker, please refer to [this tutorial](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) and learn writing dockerfile.

In this tutorial, we have prepared the docker image in the path following. Note the file ```image.yaml``` isn't part of docker image. It's pai's configuration file.

[Hbase docker image code](example/add-service/src/hbase)


#### Write PAI's Image Configuration <a name="Image_Configuration"></a>

Everytime you wanna add a customized docker image into pai, you will have to prepare a image configuration first. This configuration should be named as ```image.yaml```, and be put into the directory of the image.

Here is the examples of the configuration.

[Hbase docker image's configuration](example/add-service/src/hbase/image.yaml)


Take hbase image's configuration here as an example to explain.


```yaml

### the file is the relative path which is set in the value of the key src.
### the copy will be placed in the relative path copied_file
### in the path pai-management/ to execute the command "cp -r src dst"

#copy-list:
#  - src: ../xxxxxx
#    dst: src/xxxxxx/copied_file
```

Configuration only consists copy-list part. if you don't need you can just ignore this field then provide an empty image.yaml .

- ```copy-list``` part:
    - In project, we only keep one replica of source code or tool and we won't replace too much replicas in each image's directory. So this parts tell paictl the path to copy the file.
    - Command: ```cp -r pai/pai-management/$src pai/pai-management/$dst ```. ```src``` and ```dst``` is the value in this part.

#### Place the Image Directory into PAI <a name="Image_Place"></a>

 Note that the name of image's directory should be same with the image name.

For example, now we wanna add a docker image "XYZ" into pai. You will first create a directory named "XYZ" in the path ```pai/pai-management/src/XYZ```. That is the image's directory named as the image's name.


If you wanna paictl to build hbase image, you should move the director ```example/src/hbase``` to ```pai/pai-management/src```.


#### Place the Image Directory into PAI <a name="Image_Build_Push"></a>

```
./paictl.py image build -p /path/to/your/cluster-configuration/dir -n hbase


./paictl.py image push -p /path/to/your/cluster-configuration/dir -n hbase

```


## Add Service's Bootstrap Module <a name="Boot"></a>

After hbase image is built, you need bootstrap it in pai. Now the service management system is kubernetes.


#### Prepare Service Configuration <a name="service_configuration"></a>

This is the configuration of your service bootstrap module. And paictl will call different script to handle different things. This file should be placed in your service bootstrap module. And its name should be ```service.yaml```

[Hbase's bootstrap module's configuration](example/add-service/bootstrap/hbase/service.yaml)

Here is the service configuration of HBase.

```YAML
# Tell paictl which service should be ready, before starting hbase.
prerequisite:
  - cluster-configuration
  - hadoop-service


# paictl will generate the template file with the name "filename".template with jinja2.
template-list:
  - node-label.sh
  - master-hbase.yaml

# The script about how to starting a service
start-script: start.sh

# The script about how to stop a service
stop-script: stop.sh

# The script about how to stop a service and delete the data on the cluster
delete-script: delete.sh

# The script about refresh the status of the service.
# Usually it will update the configmap and re-label the node.
refresh-script: refresh.sh


# A script about rolling-upgrade.
# No example now.
upgraded-script: upgraded.sh
```

This configuration consists of 7 parts.

- ```prerequisite``` parts:
    - Let's consider this scenario. There are 3 services named ```A```, ```B``` and ```C```. And now service ```C``` depends on service ```B``` and ```C```. If you wanna start ```C```, you will have to start ```A``` and ```B```. So in this field, you can tell paictl which service should be ready if you wanna start a service.
    - cluster-configuration is a special service in pai. Some important configuration of the cluster and registry's secret are in this service. So this service should be the first service of pai.

-  ```template-list``` parts:
    - refer to corresponding part of image part.
    - After cluster-object-model is developed, more detail guide will be provided.

- ```start-script``` parts:
    - A shell script to start your service.

- ```stop-script``` parts:
    - A shell script to stop your service.

- ```delete-script``` parts:
    - A shell script to stop your service and delete all the data persisted on the cluster.

- ```refresh-script``` parts:
    - The script about refresh the status of the service. Usually it will update the configmap and re-label the node.

- ```upgraded-script``` parts:
    - Not supported yet.

#### Some Experience of Kubernetes <a name="Experience"></a>

[Node Label](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/)
- Benefits
    - With node label and node selector, it is possible to assign a service pod to a specific node. For example, hadoop-name-node should be assigned to the node with the label master. And hadoop-data-node should be assigned to the node with the label worker.
    - With node label, we are able to management a service on a specific node, but do not affect the same service on other nodes.
- Example
    - [Hadoop-name-node's node-label.sh](../bootstrap/hadoop-name-node/node-label.sh.template)
    - [Hadoop name node](../bootstrap/hadoop-name-node/hadoop-name-node.yaml.template)
    - [Hadoop data node](../bootstrap/hadoop-data-node/hadoop-data-node.yaml.template)


[DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)
- Benefits
    - DaemonSet can ensure there will be one and only one service pod on the target nodes. Hadoop and other similar service could benefits from this object a lot.
    - Take advantage of node-label and daemonSet, we can deploy hadoop easily.
- Example
    - [Hadoop data node's yaml file](../bootstrap/hadoop-data-node/hadoop-data-node.yaml.template)

[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- example
    - [Grafana](../bootstrap/grafana/grafana.yaml.template)
    - [prometheus](../bootstrap/prometheus/prometheus-deployment.yaml.template)

[Job](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/)
- Benefits
    - Some batch job which does't have the demands to running on a specific nodes could created by this object. And when the job is succeed, the status of the pod will be completed. This status could be a notify that the job is finished.

- Example
    - [A batch job to set hdfs permission](../bootstrap/hadoop-batch-job/)


[Configmap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)
- Benefits
    - In pai's bootstrap module, we mount the configuration file through configmap. So that we could separate the cluster-specific configuration from the docker image. For example, the hadoop configuration.
    - With the configmap's mount function, we could take advantage of one image in many different ways. For example, hadoop-run image could starts different service with different script got from configmap.

- Example
    - [Hadoop data node's yaml file](../bootstrap/hadoop-data-node/hadoop-data-node.yaml.template)
    - [Hadoop service's configmap](../bootstrap/hadoop-data-node/hadoop-data-node-configuration)

[readness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)

- Benefits
    - With readness probe, we could block the deployment process until one service is ready.


- Examples
    - [Hadoop data node's yaml file](../bootstrap/hadoop-data-node/hadoop-data-node.yaml.template)
    - [Hadoop service's start script](../bootstrap/hadoop-data-node/start.sh)
    - [The status checking tool](../k8sPaiLibrary/monitorTool/check_pod_ready_status.py)


#### Place the Module into PAI <a name="Service_Place"></a>

 Note that the name of service's directory should be same with the service name.

For example, now we wanna add a service module "XYZ" into pai. You will first create a directory named "XYZ" in the path ```pai/pai-management/bootstrap/XYZ```. That is the service's directory named as the service's name.


If you wanna paictl to start hbase image, you should move the director ```example/bootstrap/hbase``` to ```pai/pai-management/bootstrap```.


#### Label the node and start service <a name="Service_Start"></a>

In this example, an single master node hbase is deployed.

Before starting the hbase, you should label the node with corresponding label.

```
#For master, add this property
hbase-master: "true"

#For regionserver, add this property
hbase-regionserver: "true"
```

Starting service.
```
./paictl.py service start -p /path/to/configuration/dir -n hbase
```

Delete service

```
./paictl.py service stop -p /path/to/configuration/dir -n hbase
```