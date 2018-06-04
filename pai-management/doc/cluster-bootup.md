# Tutorial: Booting up the cluster

This document introduces the detailed procedures to boot up a cluster.

Table of contents:
<!-- TOC depthFrom:2 depthTo:3 -->

- [Overview <a name="overview"></a>](#overview-a-nameoverviewa)
- [Step 1. Prepare PAI configuration files <a name="Model"></a>](#step-1-prepare-pai-configuration-files-a-namemodela)

<!-- /TOC -->

## Overview <a name="overview"></a>

We assume that the whole cluster has already been configured by the system maintainer to meet the following requirements:

- SSH service is enabled on each of the machines.
- All machines share the same username / password for the SSH service on each of them.
- All machines to be set up as masters should be in the same network segment.
- A load balancer is prepared if there are multiple masters to be set up.

The steps in brief:

- Step 1. Prepare PAI configuration files.
- Step 2. Boot up Kubernetes.
- Step 3. Start all PAI services.

## Step 1. Prepare PAI configuration files <a name="Model"></a>

PAI configuration files consists of 4 YAML files:

- cluster-configuration.yaml
- k8s-role-definition.yaml
- kubernetes-configuration.yaml
- serivices-configuration.yaml

There are two ways to prepare the above 4 PAI configuration files. The first one is to prepare them manually. The description of each field in these configuration files can be found in [A Guide For Cluster Configuration](how-to-write-pai-configuration.md).
