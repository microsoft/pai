# Etcd maintenance

## Goal
Etcd is a service used by Kubernetes as a consistent and highly-available key value store for all its backing cluster data.

## Build
OpenPAI doesn't directly build etcd service. The service's image is pulled from the docker registry.

## Configuration

Configuration file [kubernetes-configuration.yaml](../../cluster-configuration/kubernetes-configuration.yaml) defines etcd as kubernetes storage and specifies the version.
```yaml
storage-backend: etcd3
etcd-version: 3.2.17
```
The etcd node can be configured in file [cluster-configuration.yaml](../../cluster-configuration/cluster-configuration.yaml) by adding a `etcdid` label on the machine.

## Deployment

Etcd is deployed as a component of Kubernetes when running this command:
```bash
python paictl.py cluster k8s-bootup -p ./path/to/cluster/configuration/dir
```
After the cluster is up, the cluster nodes can be retrieved by command:
```bash
etcdctl --endpoints=http://CONFIGUED_ETCD_NODE_ADDRESS:2380 member list
```
The `CONFIGUED_ETCD_NODE_ADDRESS` is the one of the node addresses you configured to deploy etcd. This command will return all
the etcd nodes with their status. The nodes will be deployed successfully if their status are `started`.

## Upgrading and rolling back

The etcd data is stored in
```bash
/var/etcd/data
```
on each node.
By default the data will be kept when cleaning the cluster and upgrading to a new Kubernetes version. So when the cluster of new version is up,
all the services can be restored and continue to run.
If you want to clean the etcd data completely when cleaning the cluster. Please run this command
```bash
python paictl.py cluster k8s-clean -p /path/to/configuration/directory -f
```
For general instructions about upgrading etcd please refer [upgrading-etcd](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/#upgrading-and-rolling-back-etcd-clusters).

## Service Monitoring

- Watchdog can report the etcd health metrics `etcd_current_status_error`. Please refer [watchdog doc](../../prometheus/doc/watchdog-metrics.md) for the detailed metrics.
- Etcd service can be monitored by Prometheus or Grafana. Please refer [monitoring](https://coreos.com/etcd/docs/latest/op-guide/monitoring.html) for details.
- Etcd's status can also be found from the cluster's Kubernets dashboard. In the Pods view the pods with name prefix "etcd-server" will run etcd service.

## High Availability

To support high availability, etcd cluster must be deployed on multiple nodes and distribute the data. The recommended cluster size is at least 3.

## Fix etcd nodes

Sometimes the etcd nodes may not healthy, it can be repaired with command
```bash
python paictl.py machine etcd-fix -p /path/to/configuration/directory -l /path/to/your/errornodelist.yaml
```
Please follow instructions in [machine maintenance](./machine-maintenance.md) for the details.

## Data Stored on Etcd

In OpenPAI cluster the data on etcd comes from two service:
- Kubernetes: All of the Kubernetes objects like deployment, pod or service information will be stored to etcd.
- Rest-Server: The OpenPAI user account information will be stored to etcd.

## Reference

- [Etcd document](https://coreos.com/etcd/docs/latest/docs.html#documentation)
- [Operating etcd for kubernetes](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)
