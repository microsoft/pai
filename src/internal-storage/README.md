## PAI Internal Storage

Internal Storage is designed to create a limited size storage in PAI. The storage can be used by database service or other stateful application internally. It leverages [`loop device`](http://man7.org/linux/man-pages/man4/loop.4.html) in Linux to provide a storage with strictly limited quota. The default service configuration for internal storage is:

```yaml
internal-storage:
    enable: false
    type: hostPath
    root-path: /mnt/paiInternal
    quota-gb: 10
```

User can override these settings in `services-configuration.yaml`.

## Set up Internal Storage

For now, `hostPath` is the only supported `type` for internal storage. In summary, it will make a `<root-path>` folder (The default path is `/mnt/paiInternal`) on the `pai-master` node first, then create a loop device in the folder. If the path does not exist, PAI will create it for you. Please refer to the following commands for details of loop device creation.

```bash
fallocate -l ${QUOTA_GB}G storage.ext4
/sbin/mkfs -t ext4 -q storage.ext4 -F
mkdir -p storage
mount -o loop,rw,usrquota,grpquota storage.ext4 storage
```

The advantage of using a loop device is that it can limit the disk quota for every user strictly. 

Since the service uses a `mount` inside a container, `mountPropagation` is set to `Bidirectional` to ensure the `mount` behavior propagates to the host.


## Use the Internal Storage

In fact, the internal storage is a disk path on the `pai-master` node, thus only pod on the same node can reference it by using `hostPath` in kubernetes, e.g.

```yaml
apiVersion: v1
kind: Pod
...
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/hostname
            operator: In
            values:
            - {{ cluster_cfg["internal-storage"]["master-ip"] }}
  containers:
  - image: <image-name>
    volumeMounts:
    - name: internal-data-dir
      mountPath: /data
      mountPropagation: "None"
  volumes:
  - name: internal-data-dir
    hostPath:
      path: '{{ cluster_cfg["internal-storage"]["root-path"] }}/storage'
```

Please note that `mountPropagation` should be set to `None`, to ensure that any unexpected unmount of the data folder will not be propagates to the pod.

## Assumption of Failure

### 1. Failure during setup

This service uses the readiness probe in k8s to ensure the corresponding loop device is created successfully. Possible errors during setup are as follows:

  - Allocation Failure: The storage uses `fallocate` to reserve quota during setup. If the remaining disk size doesn't meet the need, allocation failure happens.
  - Mount Failure: Since the `mount` command needs some privileges from the host to work, it may also fail during setup.

If any of the above failures happens, the service will never be ready (because of the readiness probe). See [create.sh](src/create.sh) and [create.yaml.template](deploy/create.yaml.template) for details.

### 2. Failure after setup

Please note that this storage doesn't have any replica mechanism. If the `pai-master` node crashes with a disk failure or other hardware issues, users will not be able to restore the data. In fact, all the data are stored in a single file `storage.ext4` on the `pai-master` node.

Possibility is that users may delete our storage file `storage.ext4` or `storage` folder unexpectedly. The service checks them every 60 seconds:

  - If the `storage` folder is unmounted or deleted, the service will restart to create and mount it again in 60 seconds. Data won't be lost. Since pods are using the internal storage with `mountPropagation=None`, they won't notice any change.
  - If the `storage.ext4` file is deleted, the service will restart to create a new `storage.ext4` in 60 seconds. However, in such case, user data will be lost. We cannot prevent it since users can always remove files on their disks.


### 3. Failure during deletion 

During service deletion, if we cannot unmount or delete the data, the deletion process won't be successful. There is also a readiness probe for these purposes. See [delete.yaml.template](deploy/delete.yaml.template) for details.


## References
  - [Loop Device](http://man7.org/linux/man-pages/man4/loop.4.html)
  - [Linux Quota Tutorial](http://souptonuts.sourceforge.net/quota_tutorial.html)
  - [Mount Propagation](https://kubernetes.io/docs/concepts/storage/volumes/#mount-propagation)
