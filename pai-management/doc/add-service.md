# add a serive

For advanced user. A guide for developer to add their own service into pai.


## Index

- [ Overview ](#overview)
- [ Cluster Object Model ](#Model)
- [ Add Service's Image ](#Image)
    - [Prepare Service Docker Image](#Image_Prepare)
    - [Write PAI's Image Configuration](#Image_Configuration)
    - [Place the Image Directory into PAI](#Image_Place)
- [ Add Service's Maintain Module ](#Maintain)


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

[Hbase docker image code](add-service/src/hbase)


#### Write PAI's Image Configuration <a name="Image_Configuration"></a>

Everytime you wanna add a customized docker image into pai, you will have to prepare a image configuration first. This configuration should be named as ```image.yaml```, and be put into the directory of the image.

Here is the examples of the configuration.

[Hbase docker image's configuration](add-service/src/hbase/image.yaml)


Take hbase image's configuration here as an example to explain.


```
### the image is based on hadoop-run. You should tell paictl to build hadoop-run first.
### Because hadoop-run is our customized image, you will have to set value here.
### If the based image is on public registry, you could comment this field.

prerequisite: hadoop-run



### If some template should be generated here, please add file list here.

#template-list:
#  - dockerfile



### the file is the relative path which is set in the value of the key src.
### the copy will be placed in the relative path copied_file
### in the path pai-management/ to execute the command "cp -r src dst"

#copy-list:
#  - src: ../xxxxxx
#    dst: src/xxxxxx/copied_file
```

Configuration consists of three parts. If any parts in your image's configuration is empty, just remove it.

- ```prerequisite``` part:
    - Your service image may be built from a base image. If the base image is a customized image and can't be pulled from a docker registry, you will have to build the base image first. In this tutrial, hbase image is built from hadoop-run which is pai's customized image, so we have to build hadoop-run first. After setting prerequisite fileds, paictl will build hadoop-run first.
    - Note: If your base image could be pulled from a docker registry, just remove this. If your base image is pai's customized image or yourself's customized image added into pai, you must set this field.


- ```template-list``` part:
    - You should list your template file in this list, then paictl will generate the template according the list for you. The configuration data comes from cluster configuration, and the template engine is [jinja2](http://jinja.pocoo.org/). After cluster-object-model module is developed, a more detailed guide will be write.
    - A ```filename``` in ```template-list``` is corresponding to  the template file named ```filename.template``` in your image's directory. And paictl will generate the template with the file named ```filename```.
    - This part is not recommended to use. Any cluster-specific configuration shouldn't be set into docker image.
    - An use case in pai, [hadoop-run's dockerfile](../src/hadoop-run/dockerfile.template)


- ```copy-list``` part:
    - In project, we only keep one replica of source code or tool and we won't replace too much replicas in each image's directory. So this parts tell paictl the path to copy the file.
    - Command: ```cp -r pai/pai-management/$src pai/pai-management/$dst ```. ```src``` and ```dst``` is the value in this part.

#### Place the Image Directory into PAI <a name="Image_Place"></a>

 Note that the name of image's directory should be same with the image name.

For example, now we wanna add a docker image "XYZ" into pai. You will first create a directory named "XYZ" in the path ```pai/pai-management/src/XYZ```. That is the image's directory named as the image's name.


If you wanna paictl to build hbase image, you should move the director ```example/src/hbase``` to ```pai/pai-management/src```.


## Add Service's Maintain Module <a name="Maintain"></a>


#### Taking advantage of kubernetes


#### service.yaml

This is the configuration of your service bootstrap module.

#### start

#### refrash

#### stop

#### delete