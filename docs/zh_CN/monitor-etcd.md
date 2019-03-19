# Background

In Pai version before 0.11.0, pai did not have a monitor solution for etcd deployed by OpenPai, so admin will not get notified when something wrong with etcd and can not running correctly.

To monitor etcd, we have watchdog service, this service monitor pods with special labels and check its running status via readiness probe. If you have deployed kubernetes using version larger than 0.11.0, you can ignore this document, because the etcd has configured correctly. But if you have deployed kubernetes using version before 0.11.0, you should do following upgrade to configure etcd correctly so it can be monitored.

# Upgrade steps

Please note following steps involves restart etcd pods, the etcd process will stop for around 5 minutes, and **kubernetes can not work during the time**, please plan upgrade in advance to minimize the possible impact.

1. Please use a [dev-box](pai-management/doc/how-to-setup-dev-box.md) to do following operations, as dev-box can provide a clean environment.
2. Checkout the 0.11.0 version branch of pai: `cd $PAI_ROOT && git checkout v0.11.0`.
3. Apply upgrade script: `cd $PAI_ROOT/src/etcd-upgrade/build && kubectl apply -f ds.yaml`.
4. When upgrade finished, all etcd-upgrade pods will be ready, and you can know delete these pods using `kubectl delete -f ds.yaml`

The upgrade script will do following:

1. Use DaemonSet to deploy upgrade script in every nodes in kubernetes.
2. Modify `etcd.yaml` file under `/etc/kubernetes/manifests`, this file is deployed by kubernetes bootup script.
3. During modification, the script will add needed labels and readiness probe.
4. When modification finished, the script will remove old `etcd.yaml` and add `etcd-upgraded.yaml`.
5. The kubelet in that node will start new etcd pod using configuration in `etcd-upgraded.yaml`, and new etcd started.