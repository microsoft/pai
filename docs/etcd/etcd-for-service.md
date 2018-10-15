# Etcd for Service doc

## Table of Contents
- [Goal](#0)
- [Build](#1)
- [Configuration](#2)
- [Deployment](#3)
- [Upgrading](#4)
- [Resize](#5)
- [Service Monitoring](#6)
- [High Availability](#7)
- [Failover and recovery of etcd nodes](#8)
- [Data Stored on Etcd](#9)
- [Remove the etcd service](#10)
- [Reference](#11)

## Goal <a name="0"></a>
Etcd is a service used by rest-server over user existing K8S cluster (Azure AKS) as a consistent and highly-available key value store for user account data etc.

This service is leverage [etcd-operator](https://github.com/coreos/etcd-operator)
## Build <a name="1"></a>
OpenPAI doesn't directly build etcd service. The service's image is pulled from the docker registry of etcd-operator and etcd.

## Configuration <a name="2"></a>

Configuration file [kubernetes-configuration.yaml](../../deployment/quick-start/services-configuration.yaml.template) defines etcd's cluster name.

```yaml
etcd-for-service:
  cluster-name: "etcd-cluster"
```

The etcd node can be configured in file [etcd.yaml.template](../../src/etcd/deploy/etcd.yaml.template) 

```yaml
spec:
  size: 3
  version: "3.2.13"
```

## Deployment  <a name="3"></a>

Etcd is deployed on K8S when running this command:

```bash
python paictl.py service start \
  -p ~/pai-config \
  -n etcd
```

After the cluster is up, leverage [client service](https://github.com/coreos/etcd-operator/blob/master/doc/user/client_service.md) can view cluster's state.

## Upgrading  <a name="4"></a>

User could leverage etcd-operator to upgrade etcd [upgrade the etcd service](https://github.com/coreos/etcd-operator/blob/master/README.md#upgrade-an-etcd-cluster)

## Resize  <a name="5"></a>

User could refer this doc [resize etcd](https://github.com/coreos/etcd-operator#resize-an-etcd-cluster) to resize a etcd cluster. 

The config file is at dir [etcd](../../src/etcd/deploy/etcd.yaml.template).

## Service Monitoring  <a name="6"></a>

The user can get the endpoint to etcd by the [following doc](https://github.com/coreos/etcd-operator/blob/master/doc/user/client_service.md). 

- Etcd service can be monitored by Prometheus or Grafana. Please refer [monitoring](https://coreos.com/etcd/docs/latest/op-guide/monitoring.html) for details.
- Etcd's status can also be found from the cluster's Kubernets dashboard. In the Pods view the pods with name prefix "etcd-cluster" will run etcd service.

## High Availability  <a name="7"></a>

To support high availability, etcd cluster must be deployed on multiple nodes and distribute the data. The recommended cluster size is at least 3.

## Failover and recovery of etcd nodes  <a name="8"></a>

Sometimes the etcd nodes may not healthy, it can be repaired by etcd-operator

Please follow instructions in [machine maintenance](https://github.com/coreos/etcd-operator#failover) for the details.

## Data Stored on Etcd  <a name="9"></a>

Etcd pods data is stored at pod volume, the volume type is [EmpytDir](https://kubernetes.io/docs/concepts/storage/volumes/#emptydir). When a Pod is removed from a node for any reason, the data in the emptyDir is deleted forever.

When users want to back up and restore data from etcd. Users can refer to the following documents.

- when user have cloud storage to backup.
    - [Azure Storage](https://github.com/coreos/etcd-operator/blob/master/doc/user/abs_backup.md)
    - [AWS Storage](https://github.com/coreos/etcd-operator#backup-and-restore-an-etcd-cluster)
- When user want to backup and restore data to customized storage. 
    - [etcd snapshot](https://github.com/etcd-io/etcd/blob/master/Documentation/op-guide/recovery.md)

Which service store data at etcd:
- Rest-Server: The OpenPAI user account information will be stored to etcd.

## Remove the etcd service  <a name="10"></a>

Etcd is removed from K8S when running this command:

```bash
python paictl.py service stop \
  -p ~/pai-config \
  -n etcd
```

## Reference  <a name="11"></a>

- [Etcd document](https://coreos.com/etcd/docs/latest/docs.html#documentation)
- [Etcd operator](https://github.com/coreos/etcd-operator)
