# Etcd maintenance

## Goal
Etcd is a service used by Kubernetes as a consistent and highly-available key value store for all its backing cluster data.

## Build
OpenPAI doesn't directly build etcd service. The service's image is directly pulled from the docker registry.

## Configuration

Configuration file [section](../../cluster-configuration/kubernetes-configuraion.yaml) defines etcd as kubernetes storage and specifies the version.
- storage-backend: etcd3
- etcd-version: 3.2.17

## Deployment

Etcd is deployed as a component of Kubernetes by paictl via running this command:
```bash
python paictl.py cluster k8s-bootup -p ./path/to/cluster/configuration/dir
```

## Upgrading

The refer [upgrading-etcd](https://github.com/coreos/etcd/blob/master/Documentation/upgrades/upgrading-etcd.md) for detailed instructions.

## Service Monitoring

Etcd service can be monitored by Prometheus or Grafana. Please refer [monitoring](https://coreos.com/etcd/docs/latest/op-guide/monitoring.html) for details.
Etcd's status can also be found from the cluster's Kubernets dashboard. In the Pods view the pods with name prefix "etcd-server" will run etcd service.

## High Availability

To support high availability, etcd cluster must be deployed on multiple nodes and distribute the data. The recommended cluster size is at least 3.
In the machine list of [section](../../cluster-configuration/cluster-configuration.yaml), the etcd nodes can be configured by adding a lable `etcdid`.

## Reference

- Etcd document https://coreos.com/etcd/docs/latest/docs.html#documentation