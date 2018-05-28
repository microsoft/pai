# add a serive

For advanced user. A guide for developer to add their own service into pai.


## Index

- [ Overview ](#overview)
- [ Cluster Object Model ](#Model)
- [ Add Service's Image ](#Image)
- [ Add Service's Maintain Module ](#Maintain)


## Overview

This tutorial will guide you to add a service to PAI.
An example of [Apache HBase](https://hbase.apache.org/) and [Apache Phoenix](https://phoenix.apache.org/) will be here. And follow it step by step, you will know how to add your own service.

In this tutorial, you will be able to setup HBase on PAI.


## Cluster Object Model <a name="Model"></a>

This chapter will teach you to write the configuration model of your service, and will guide you how to get other service's configuration.

This module will coming soon.


## Add Service' Image <a name="Image"></a>

This chapter will teach you how to add your customized image to pai. After everything is done, paictl image command will build and push your image to the target docker registry.

#### Prepare service docker Image

In this tutorial, we have prepared the docker image in the path following.

[Hbase docker image code](add-service/src/hbase)


#### Some configuration of the image for paictl

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
#    dst: src/frameworklauncher/copied_file
```

Now, the configuration consists of three parts.



## Add Service's Maintain Module <a name="Maintain"></a>


#### Taking advantage of kubernetes


#### service.yaml

This is the configuration of your service bootstrap module.

#### start

#### refrash

#### stop

#### delete