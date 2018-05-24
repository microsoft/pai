# add a serive

For advanced user. A guide for developer to add their own service into pai.


## Index

- [ Overview ](#overview)
- [ Cluster Object Model ](#Model)
- [ Add Service's Image ](#Image)
- [ Add Service's Maintain Module ](#Maintain)


## Overview

This tutorial will guide you to add a service to PAI.
An example of [Apache HBase](https://hbase.apache.org/) and [Apache Phoenix](https://phoenix.apache.org/) will be here. And follow this step by step, you will know how to add your own service.

In this tutorial, you will be able to setup HBase on PAI.


## Cluster Object Model <a name="Model"></a>

This chapter will teach you to write the configuration model of your service, and will guide you how to get other service's configuration.

This module will coming soon.


## Add Service' Image <a name="Image"></a>

This chapter will teach you how to add your customized image to pai. After everything is done, paictl image command will build and push your image to the target docker registry.


## Add Service's Maintain Module <a name="Maintain"></a>


#### service.yaml

This is the configuration of your service bootstrap module.

#### start

#### refrash

#### stop

#### delete