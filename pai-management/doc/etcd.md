# Etcd maintenance

## Goal
Etcd is a service used by Kubernetes as a consistent and highly-available key value store for all its backing cluster data.

## Build
OpenPAI doesn't directly build etcd service. The service's image is directly pulled from the docker registry.

## Configuration

Configuration file [kubernetes-configuration.yaml](../../cluster-configuration/kubernetes-configuration.yaml) defines etcd as kubernetes storage and specifies the version.
- storage-backend: etcd3
- etcd-version: 3.2.17

## Deployment

Etcd is deployed as a component of Kubernetes via running this command:
```bash
python paictl.py cluster k8s-bootup -p ./path/to/cluster/configuration/dir
```

## Upgrading and rolling back

Please refer [upgrading-etcd](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#upgrading-and-rolling-back-etcd-clusters) for detailed instructions.

## Service Monitoring

- Watchdog can report the etcd health metrics `etcd_current_status_error`. Please refer [watchdog doc](../../prometheus/doc/watchdog-metrics.md) for the detailed metrics.
- Etcd service can be monitored by Prometheus or Grafana. Please refer [monitoring](https://coreos.com/etcd/docs/latest/op-guide/monitoring.html) for details.
- Etcd's status can also be found from the cluster's Kubernets dashboard. In the Pods view the pods with name prefix "etcd-server" will run etcd service.

## High Availability

To support high availability, etcd cluster must be deployed on multiple nodes and distribute the data. The recommended cluster size is at least 3.
In the machine list of [cluster-configuration.yaml](../../cluster-configuration/cluster-configuration.yaml), the etcd nodes can be configured by adding a `etcdid` label.

## Fix etcd nodes

Sometimes the etcd nodes may not healthy, it can be repaired with command
```bash
./paictl.py machine etcd-fix -p /path/to/configuration/directory -l /path/to/your/errornodelist.yaml
```
Please follow instructions in [machine maintenance](./machine-maintenance.md) for the details.

## Reference

- [Etcd document](https://coreos.com/etcd/docs/latest/docs.html#documentation)
- [Operating etcd for kubernetes](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)