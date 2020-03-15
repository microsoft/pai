# Setup Kubernetes Persistent Volumes as Storage on PAI

This document describes how to use Kubernetes Persistent Volumes (PV) as storage on PAI.

A pure k8s version PAI v0.18.0 cluster or later is required before you start.


## Introduction

To use existing storage (nfs, samba, Azure blob, etc.) on PAI, admin could create PV on Kubernetes and claim as PAI storage. Then users could use those PV/PVC as storage in their jobs.
Here's a detailed walkthrough.


## Create PV/PVC on Kubernetes

Admin need to create PV for storage and create PVC bound to corresponding PV.
The name of PVC is used to onboard on PAI.

There're many approches to create PV/PVC, you could refer to [Kubernetes docs](https://kubernetes.io/docs/concepts/storage/persistent-volumes/) if you are not familiar yet. Followings are some commonly used PV/PVC examples.

* NFS

    ```yaml
    # NFS Persistent Volume
    apiVersion: v1
    kind: PersistentVolume
    metadata:
      name: nfs-storage-pv
      labels:
        name: nfs-storage
    spec:
      capacity:
        storage: 10Gi
      volumeMode: Filesystem
      accessModes:
        - ReadWriteMany
      persistentVolumeReclaimPolicy: Retain
      mountOptions:
        - nfsvers=4.1
      nfs:
        path: /data
        server: 10.0.0.1
    ---
    # NFS Persistent Volume Claim
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: nfs-storage
    # labels:
    #   share: "false"      # to mount sub path on PAI
    spec:
      accessModes:
        - ReadWriteMany
      volumeMode: Filesystem
      resources:
        requests:
          storage: 10Gi    # no more than PV capacity
      selector:
        matchLabels:
          name: nfs-storage # corresponding to PV label
    ```

    Save the above file as `nfs-storage.yaml` and run `kubectl apply -f nfs-storage.yaml` to create a PV named `nfs-storage-pv` and a PVC named `nfs-storage` for nfs server `nfs://10.0.0.1:/data`. The PVC will be bound to specific PV through label selector, using label `name: nfs-storage`.

    Users could use PVC name `nfs-storage` as storage name to mount this nfs storage in their jobs.

    If you want to configure the above nfs as personal storage so that each user could only visit their own directory on PAI like Linux home directory, for example, Alice can only mount `/data/Alice` while Bob can only mount `/data/Bob`, you could add a `share: "false"` label to PVC. In this case, PAI will use `${PAI_USER_NAME}` as sub path when mounting to job containers.

* Samba

    Please refer to [this document](https://github.com/Azure/kubernetes-volume-drivers/blob/master/flexvolume/smb/README.md) to install cifs/smb FlexVolume driver and create PV/PVC for Samba.

* Azure Blob

    Please refer to [this document](https://github.com/Azure/kubernetes-volume-drivers/blob/master/flexvolume/blobfuse/README.md) to install blobfuse FlexVolume driver and create PV/PVC for Azure Blob.

* Azure File

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
        name: azure-file-storage
    ```

    More details on Azure File volume could be found in [this document](https://docs.microsoft.com/en-us/azure/aks/azure-files-volume).


## Assign Storage to PAI Groups

PAI uses Kubernetes PVC name as storage name.
To use Kubernetes volumes in PAI, admin need to assign storage to PAI groups first.

1. Service configuration file

    For AAD mode, storage could be configured in `service-configuration.yaml` file.

    ```yaml
    authentication:
    ...
    group-manager:
        ...
        grouplist:
        - groupname: group1
            externalName: sg1
            extension:
              acls:
                admin: false
                virtualClusters: ["vc1"]
                storageConfigs: ["azure-file-storage"]
        - groupname: group2
            externalName: sg2
            extension:
              acls:
                admin: false
                virtualClusters: ["vc1", "vc2"]
                storageConfigs: ["nfs-storage"]
    ```

    The first storage in `storageConfigs` list will be treated as default storage for this group.

2. RESTful API

    [Group extension API](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/updateGroupExtension) could be used to create or update `storageConfigs` in a given group. Here's an example for request body:

    ```json
    {
      "acls": {
        "admin": false,
        "virtualClusters": ["vc1", "vc2"],
        "storageConfigs": ["nfs-storage"]
      }
    }
    ```


## Use Storage on PAI

1. Job configuration file

    To use one or more storage in job, user could specify storage names in `extras.storages` section in job configuration file:

    ```yaml
    extras:
      storages:
        - name: nfs-storage
          mountPath: /data
        - name: azure-file-storage
    ```

    Their are two fields for each storage, `name` and `mountPath`. `name` refers to storage name while `mountPath` is the mount path inside job container, which has default value `/mnt/${name}` and is optional.

    ```yaml
    extras:
      storages: []
    ```

    Setting it to an empty list will mount default storage for current user in the job.

2. RESTful API

    User could use [list storage API](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/getStorages) to list permitted storage, or [get storage API](https://redocly.github.io/redoc/?url=https://raw.githubusercontent.com/microsoft/pai/master/src/rest-server/docs/swagger.yaml#operation/getStorage) to view the detail of a given storage.
