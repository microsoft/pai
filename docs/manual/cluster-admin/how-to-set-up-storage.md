# How to Set Up Storage

This document describes how to use Kubernetes Persistent Volumes (PV) as storage on PAI. To set up existing storage (nfs, samba, Azure blob, etc.), you need:

  1. Create PV and PVC as PAI storage on Kubernetes.
  2. Confirm the worker nodes have proper package to mount the PVC. For example, the `NFS` PVC requires package `nfs-common` to work on Ubuntu.
  3. Assign PVC to specific user groups.

Users could mount those PV/PVC into their jobs after you set up the storage properly. The name of PVC is used to onboard on PAI.

## Create PV/PVC on Kubernetes

There're many approches to create PV/PVC, you could refer to [Kubernetes docs](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) if you are not familiar yet. Followings are some commonly used PV/PVC examples.

### NFS

```yaml
# NFS Persistent Volume
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-storage-pv
  labels:
    name: nfs-storage
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  mountOptions:
    - nfsvers=4.1
  nfs:
    path: /data
    server: 10.0.0.1
---
# NFS Persistent Volume Claim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-storage
# labels:
#   share: "false"      # to mount sub path on PAI
spec:
  accessModes:
    - ReadWriteMany
  volumeMode: Filesystem
  resources:
    requests:
      storage: 10Gi    # no more than PV capacity
  selector:
    matchLabels:
      name: nfs-storage # corresponding to PV label
```

Save the above file as `nfs-storage.yaml` and run `kubectl apply -f nfs-storage.yaml` to create a PV named `nfs-storage-pv` and a PVC named `nfs-storage` for nfs server `nfs://10.0.0.1:/data`. The PVC will be bound to specific PV through label selector, using label `name: nfs-storage`.

Users could use PVC name `nfs-storage` as storage name to mount this nfs storage in their jobs.

If you want to configure the above nfs as personal storage so that each user could only visit their own directory on PAI like Linux home directory, for example, Alice can only mount `/data/Alice` while Bob can only mount `/data/Bob`, you could add a `share: "false"` label to PVC. In this case, PAI will use `${PAI_USER_NAME}` as sub path when mounting to job containers.

### Samba

Please refer to [this document](https://github.com/Azure/kubernetes-volume-drivers/blob/master/flexvolume/smb/README.md) to install cifs/smb FlexVolume driver and create PV/PVC for Samba.

### Azure Blob

Please refer to [this document](https://github.com/Azure/kubernetes-volume-drivers/blob/master/flexvolume/blobfuse/README.md) to install blobfuse FlexVolume driver and create PV/PVC for Azure Blob.

#### Tips

If you cannot mount blobfuse PVC into containers and the corresponding job in OpenPAI sticks in `WAITING` status, please double check the following requirements:

**requirement 1.** Every worker node should have `blobfuse` installed. Try the following commands to ensure:

```bash
# change 16.04 to a different release if your system is not Ubuntu 16.04
wget https://packages.microsoft.com/config/ubuntu/16.04/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
sudo apt-get update
sudo apt-get install --assume-yes blobfuse fuse
```

**requirement 2.** `blobfuse` FlexVolume driver has been installed:

```sh
curl -s https://raw.githubusercontent.com/Azure/kubernetes-volume-drivers/master/flexvolume/blobfuse/deployment/blobfuse-flexvol-installer-1.9.yaml \
  | sed "s#path: /etc/kubernetes/volumeplugins/#path: /usr/libexec/kubernetes/kubelet-plugins/volume/exec/#g" \
  | kubectl apply -f -
```

> NOTE: There is a known issue [#4637](https://github.com/microsoft/pai/issues/4637) to mount same PV multiple times on same node, please either:
>   * use the [patched blobfuse flexvolume installer](https://github.com/microsoft/pai/issues/4637#issuecomment-647434815) instead.
>   * use the [earlier version 1.1.1](https://github.com/Azure/kubernetes-volume-drivers/issues/66#issuecomment-649188681) instead.

### Azure File

First create a Kubernetes secret to access the Azure file share.

```sh
kubectl create secret generic azure-secret --from-literal=azurestorageaccountname=$AKS_PERS_STORAGE_ACCOUNT_NAME --from-literal=azurestorageaccountkey=$STORAGE_KEY
```

Then create PV/PVC for the file azure.

```yaml
# Azure File Persistent Volume
apiVersion: v1
kind: PersistentVolume
metadata:
  name: azure-file-storage-pv
  labels:
    name: azure-file-storage
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteMany
  storageClassName: azurefile
  azureFile:
    secretName: azure-secret
    shareName: aksshare
    readOnly: false
  mountOptions:
    - dir_mode=0777
    - file_mode=0777
    - uid=1000
    - gid=1000
    - mfsymlinks
    - nobrl
---
# Azure File Persistent Volume Claim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: azure-file-storage
spec:
  accessModes:
    - ReadWriteMany
  storageClassName: azurefile
  resources:
    requests:
      storage: 5Gi
  selector:
    matchLabels:
      name: azure-file-storage
```

More details on Azure File volume could be found in [this document](https://docs.microsoft.com/en-us/azure/aks/azure-files-volume).

### Read-only Storage

If not specified, storage in OpenPAI can be read/written to by users. If you want the storage to be read-only, please set the corresponding PV's attribute `PersistentVolume.Spec.<PersistentVolumeSource>.ReadOnly` to be `true`.

For example, you can set a read-only NFS PV by specifying the `spec.nfs.readOnly` field in its definition:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-storage-pv
  labels:
    name: nfs-storage
spec:
  ......
  nfs:
    readOnly: true
    .......
```

Here is another example for AzureBlob:

```yaml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: azure-file-storage-pv
  labels:
    name: azure-file-storage
spec:
  ......
  flexVolume:
    readOnly: true
    .......
```

Please notice, `PersistentVolume.Spec.AccessModes` and `PersistentVolumeClaim.Spec.AccessModes` doesn't affect whether a storage is writable in PAI. They only take effect during binding time between PV and PVC.

## Confirm Environment on Worker Nodes

The [notice in Kubernetes' document](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#persistent-volumes) mentions: helper program may be required to consume certain type of PersistentVolume. For example, all worker nodes should have `nfs-common` installed if you want to use `NFS` PV. You can confirm it using the command `apt install nfs-common` on every worker node.

Since different PVs have different requirements, you should check the environment according to document of the PV.

## Assign Storage to PAI Groups

The PVC name is used as storage name in OpenPAI. After you have set up the PV/PVC and checked the environment, you need to assign storage to users. In OpenPAI, the name of the PVC is used as the storage name, and the access of different storages is managed by [user groups](./how-to-manage-users-and-groups.md). To assign storage to a user, please use RESTful API to assign storage to the groups of the user.

Before querying the API, you should get an access token for the API. Go to your profile page and copy one:

<img src="./imgs/get-token.png" />

In OpenPAI, storage is bound to group. Thus you use the [Group API](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#tag/group) to assign storage to groups. [Get a group](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/getGroup) first, and then [Update its extension](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/updateGroup).

For example, if you want to assign `nfs-storage` PVC to `default` group. First, GET `http(s)://<pai-master-ip>/rest-server/api/v2/groups/default`, it will return:

```json
{
  "groupname": "default",
  "description": "group for default vc",
  "externalName": "",
  "extension": {
    "acls": {
      "storageConfigs": [],
      "admin": false,
      "virtualClusters": ["default"]
    }
  }
}
```

The GET request must use header `Authorization: Bearer <token>` for authorization. This remains the same for all API calls. You may notice the `storageConfigs` in the return body. In fact it controls which storage a group can use. To add a `nfs-storage` to it, PUT `http(s)://<pai-master-ip>/rest-server/api/v2/groups`. Request body is:

```json
{
  "data": {
    "groupname": "default",
    "extension": {
      "acls": {
        "storageConfigs": ["nfs-storage"],
        "admin": false,
        "virtualClusters": ["default"]
      }
    }
  },
  "patch": true
}
```

Do not omit any fields in `extension` or it will change the `virtualClusters` setting unexpectedly.

## Example: Use Storage Manager to Create an NFS + SAMBA Server

To help you set up the storage, OpenPAI provides a storage manager, which can set up an NFS + SAMBA server. In the cluster, the NFS storage can be accessed in OpenPAI containers. Out of the cluster, users can mount the storage on Unix-like system, or access it in File Explorer on Windows.

Please read the document about [service management and paictl](./basic-management-operations.md#pai-service-management-and-paictl) first, and start a dev box container. Then, in the dev box container, pull the configuration by:

```bash
./paictl config pull -o /cluster-configuration
```

To use storage manager, you should first decide a machine in PAI system to be the storage server. The machine **must** be one of PAI workers, not PAI master. Please open `/cluster-configuration/layout.yaml`, choose a worker machine, then add a `pai-storage: "true"` field to it. Here is an example of the edited `layout.yaml`:

```yaml
......

- hostname: worker1
  nodename: worker1
  hostip: 10.0.0.1
  machine-type: GENERIC-WORKER
  pai-worker: "true"
  pai-storage: "true"  # this line is newly added

......
```

In this tutorial, we assume you choose the machine with IP `10.0.0.1` as the storage server. Then, in `/cluster-configuration/services-configuration.yaml`, find the storage manager section:

```yaml
# storage-manager:
#   localpath: /share
#   security-type: AUTO
#   workgroup: WORKGROUP
#   smbuser: smbuser
#   smbpwd: smbpwd
```

Uncomment it like:

```yaml
storage-manager:
  localpath: /share
#  security-type: AUTO
#  workgroup: WORKGROUP
  smbuser: smbuser
  smbpwd: smbpwd
```

The `localpath` determines the root data dir for NFS on the storage server. The `smbuser` and `smbpwd` determines the username and password when you access the storage in File Explorer on Windows.

Follow these commands to start the storage manager:

```bash
./paictl.py service stop -n cluster-configuration storage-manager
./paictl.py config push -p /cluster-configuration -m service
./paictl.py service start -n cluster-configuration storage-manager
```

If the storage manager is successfully started, you will find the folder `/share/data` and `/share/users` on the storage server. On a Ubuntu machine, you can use the following command to test whether the NFS server is correctly set up:

```bash 
# replace 10.0.0.1 with your storage server IP
sudo apt update 
sudo apt install nfs-common
mkmdir -p /mnt/data
sudo mount -t nfs --options nfsvers=4.1 10.0.0.1:/data/ /mnt/data
```

To make the NFS storage available in PAI, we should create the PV and PVC for it. Thus, create the following `nfs-storage.yaml` file in the dev box container first:

```yaml
# replace 10.0.0.1 with your storage server IP
# NFS Persistent Volume
apiVersion: v1
kind: PersistentVolume
metadata:
  name: nfs-storage-pv
  labels:
    name: nfs-storage
spec:
  capacity:
    storage: 10Gi
  volumeMode: Filesystem
  accessModes:
    - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  mountOptions:
    - nfsvers=4.1
  nfs:
    path: /data
    server: 10.0.0.1
---
# NFS Persistent Volume Claim
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: nfs-storage
# labels:
#   share: "false"      # to mount sub path on PAI
spec:
  accessModes:
    - ReadWriteMany
  volumeMode: Filesystem
  resources:
    requests:
      storage: 10Gi    # no more than PV capacity
  selector:
    matchLabels:
      name: nfs-storage # corresponding to PV label
```

Use `kubectl create -f nfs-storage.yaml` to create the PV and PVC. 

Since the Kuberentes PV requires the node using it has the corresponding driver, we should use `apt install nfs-common` to install the `nfs-common` package on every worker node.

Finally, [assign storage to PAI groups](#assign-storage-to-pai-groups) by rest-server API. Then you can mount it into job containers.

How to upload data to the storage server? On Windows, open the File Explorer, type in `\\10.0.0.1` (please change `10.0.0.1` to your storage server IP), and press ENTER. The File Explorer will ask you for authorization. Please use `smbuser` and `smbpwd` as username and password to login. On a Unix-like system, you can mount the NFS folder to the file system. For example, on Ubuntu, use the following command to mount it:

```bash 
# replace 10.0.0.1 with your storage server IP
sudo apt update 
sudo apt install nfs-common
mkmdir -p /mnt/data
sudo mount -t nfs --options nfsvers=4.1 10.0.0.1:/data/ /mnt/data
```

The above steps only set up a basic SAMBA server. So each user shares the same username and password to access it on Windows. If your cluster is in [AAD mode](./how-to-manage-users-and-groups.md#users-and-groups-in-aad-mode), and you want to integrate the SAMBA server with the AAD system, please refer to the following configuration for storage manager:

```yaml
storage-manager:
  workgroup: # workgroup
  security-type: ADS
  default_realm: # default realm
  krb5_realms: # realms
    XXX1: # relam name
      kdc: # kdc
      default_domain: # default domain
    XXX2: # relam name
      kdc: # kdc
      default_domain: # default domain
  domain_realm: # domain realm
    kdc: # kdc
    default_domain: # default domain
  domainuser: # domain user
  domainpwd: # password of domain user
  idmap: # idmap
  - "idmap config XXX1"
  - "idmap config XXX2"
  - "idmap config XXX3"
  - "idmap config XXX4"
```
