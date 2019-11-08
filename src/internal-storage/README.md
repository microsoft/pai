## PAI Internal Storage

Internal Storage is designed to make database and other stateful applications available in PAI.
It leverages `loop device` in Linux to provide a storage with strictly limited quota. The default service configuration for internal storage is:

```yaml
internal-storage:
    enable: true
    type: hostPath
    path: /paiInternal
    quotaGB: 10
```

User can override these settings in `services-configuration.yaml`.

## Set up Internal Storage

For now, `hostPath` is the only supported `type` for internal storage. In summary, it will make a `<path>` folder (The default path is `/paiInternal`) on the `pai-master` node first, then create a loop device in the folder, which is a filesystem inside a file. Please refer to the following commands for details.

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
  containers:
  - image: <image-name>
    volumeMounts:
    - name: internal-data-dir
      mountPath: /data
      mountPropagation: HostToContainer
  volumes:
  - name: internal-data-dir
    hostPath:
      path: /paiInternal/storage
```

Please note that `mountPropagation` should be set to `HostToContainer`, to ensure the `mount` propagates between hosts and pods.

## References
  - [Loop Device](http://man7.org/linux/man-pages/man4/loop.4.html)
  - [Linux Quota Tutorial](http://souptonuts.sourceforge.net/quota_tutorial.html)
  - [Mount Propagation](https://kubernetes.io/docs/concepts/storage/volumes/#mount-propagation)