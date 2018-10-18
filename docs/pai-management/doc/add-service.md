# add a service

For advanced user. A guide for developer to add their own service into pai.


## Index

- [ Overview ](#overview)
- [ Code structure knowledge ](#structure)
    - [ Image code structure ](#Structure_Image)
    - [ Deployment code structure ](#Structure_Deploy)
- [ Cluster Object Model ](#Model)
- [ Add Service's Image ](#Image)
    - [ Prepare Service Docker Image ](#Image_Prepare)
    - [ Place the Image Directory into PAI ](#Image_Place)
    - [ Build and Push ](#Image_Build_Push)
- [ Add Service's Deployment Module ](#Boot)
    - [ Prepare Service Configuration ](#Service_Configuration)
    - [ Some Experience of Kubernetes ](#Experience)
    - [ Place the Module into PAI ](#Service_Place)
    - [ Label the node and start service](#Service_Start)


## Overview <a name="overview"></a>

This tutorial will guide you to add a service to PAI.
An example of [Apache HBase](https://hbase.apache.org/)  will be here. And follow it step by step, you will know how to add your own service.

In this tutorial, you will be able to setup HBase on PAI.

## Code Structure Knowledge

#### Image code structure

- [The tutorial of pai-build](../../pai-build/pai-build.md)

#### Deployment code structure

- [The tutorial of deployment](../../paictl/deployment.md)


## Cluster Object Model <a name="Model"></a>

This chapter will teach you to write the configuration model of your service, and will guide you how to get other service's configuration.

This module will coming soon. After that, you will be able to add your configuration and pass them into the service.


## Add Service' Image <a name="Image"></a>

This chapter will teach you how to add your customized image to pai. After everything is done, build command will build and push your image to the target docker registry.

If your service image could be pulled from a public docker registry, you could skip this step.



#### Prepare Service Docker Image <a name="Image_Prepare"></a>

It will not guide you to write a dockerfile. If you a new developer of docker, please refer to [this tutorial](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) and learn writing dockerfile.

In this tutorial, we have prepared the docker image in the path following.

[Hbase docker image code](example/add-service/hbase/build)


#### Place the Image Directory into PAI <a name="Image_Place"></a>

- At first, according to the service name, you should create a directory under the path [pai/src/](../../../src). In this example, a directory named hbase will be created.
- Secondly, a directory named ```build``` should be created under "src/hbase/"
- At last, just put all the source code from the path [example/add-service/hbase/build](example/add-service/hbase/build), and then paste them into the the path ```src/hbase/build```  


#### Build and push image with pai-build <a name="Image_Build_Push"></a>

```
cd build/
./pai_build.py build -c /path/to/configuration-dir/  -s hbase
./pai_build.py push -c /path/to/configuration-dir/ -i hbase
```


## Add Service's Deployment Module <a name="Boot"></a>

After hbase image is built, you need bootstrap it in openPai. Now the service management system is kubernetes.


#### Prepare Service Configuration <a name="service_configuration"></a>

This is the configuration of your service deployment module. And paictl will call different script to handle different things. This file should be placed in your service deployment module. And its name should be ```service.yaml```

[Hbase's bootstrap module's configuration](example/add-service/hbase/deploy/service.yaml)

Here is the service configuration of HBase.

```YAML
# Tell paictl which service should be ready, before starting hbase.
prerequisite:
  - cluster-configuration
  - hadoop-name-node
  - hadoop-data-node
  - zookeeper


# paictl will generate the template file with the name "filename".template with jinja2.
template-list:
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

# Specify which role(label) of machine will run the service
deploy-rules:
  - in: pai-master
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

- ```deploy-rules``` parts:
    - Specify which role(label) of machine will run the service. The role definition of machines is in [cluster-configuration.yaml](https://github.com/Microsoft/pai/blob/7ffc1df7ecd495ec6b476e50fac9f543da2a5c31/examples/cluster-configuration/cluster-configuration.yaml#L93), machines will labeled when you deploy PAI for the first time.  Currently support the following rules:
        "in: pai-master"; "in: pai-worker"; "notin: no-driver" only for driver services; "notin: no-nodeexporter" only for node-exporter services

#### Some Experience of Kubernetes <a name="Experience"></a>

[Assigning Pods to Nodes](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/)
- Benefits
    - With node label and NodeAffinity, it is possible to constrain a pod to only be able to run on particular nodes or to prefer to run on particular nodes. For example, hadoop-name-node should be assigned to the node with the label `pai-master`. And hadoop-data-node should be assigned to the node with the label `pai-worker`.
- Steps
    - What you only need to do is specifying which label of roles you want to deploy your service in [service.yaml "deploy-rules" field](https://github.com/Microsoft/pai/blob/2daa240be4930c835956c3de3cb9a4680b481b5a/docs/pai-management/doc/example/add-service/hbase/deploy/service.yaml)
    - Then use NodeAffinity to schedule pods onto the right machines, PAI will complete it when you start the service, you don't need to do anything.

[DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)
- Benefits
    - DaemonSet can ensure there will be one and only one service pod on the target nodes. Hadoop and other similar service could benefits from this object a lot.
    - Take advantage of node-label and daemonSet, we can deploy hadoop easily.
- Example
    - [Hadoop data node's yaml file](../../../src/hadoop-data-node/deploy/hadoop-data-node.yaml.template)

[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- example
    - [prometheus](../../../src/prometheus/deploy/prometheus-deployment.yaml.template)

[Job](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/)
- Benefits
    - Some batch job which does't have the demands to running on a specific nodes could created by this object. And when the job is succeed, the status of the pod will be completed. This status could be a notify that the job is finished.

- Example
    - [A batch job to set hdfs permission](../../../src/hadoop-batch-job/deploy)


[Configmap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)
- Benefits
    - In pai's bootstrap module, we mount the configuration file through configmap. So that we could separate the cluster-specific configuration from the docker image. For example, the hadoop configuration.
    - With the configmap's mount function, we could take advantage of one image in many different ways. For example, hadoop-run image could starts different service with different script got from configmap.

- Example
    - [Hadoop data node's yaml file](../../../src/hadoop-data-node/deploy/hadoop-data-node.yaml.template)
    - [Hadoop service's configmap](../../../src/hadoop-data-node/deploy/hadoop-data-node-configuration)

[readness probe](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)

- Benefits
    - With readness probe, we could block the deployment process until one service is ready.


- Examples
    - [Hadoop data node's yaml file](../../../src/hadoop-data-node/deploy/hadoop-data-node.yaml.template)
    - [Hadoop service's start script](../../../src/hadoop-data-node/deploy/start.sh)
    - [The status checking tool](../../../deployment/k8sPaiLibrary/monitorTool/check_pod_ready_status.py)


#### Place the Module into PAI <a name="Service_Place"></a>

- Firstly, create a directory named ```hbase``` in the path [pai/src/](../../../src).
- Secondly, create a directory named ```deploy``` in the path ```pai/src/hbase/```
- At last, Copy all the source code of service in the [path](example/add-service/hbase/deploy)


#### Start service <a name="Service_Start"></a>

Starting service.
```
./paictl.py service start -p /path/to/configuration/dir -n hbase
```

Delete service

```
./paictl.py service stop -p /path/to/configuration/dir -n hbase
```
