# STORAGE plugin

## Goal
The storage plugin offers user to save output in persistent storage. For every job, an input folder is created for user to upload inputs (e.g. codes). For every job container (task), its outputs (e.g. check points) will be stored in a separate folder. 

The persistent storage could be transparent to users. This plugin will use a caching mechanism to hide the details. 

```bash
# in the container
/persistent
    |- inputs  <- {cluster-storage}/{user}/{job-name}/inputs
    |- outputs -> {cluster-storage}/{user}/{job-name}/{taskrole}/{taskindex}
```

This plugin leverage python-SDK to complete file synchronization. It use the [unified storage interface](https://github.com/microsoft/pai/blob/pai-for-edu/contrib/python-sdk/README.md#unified-storage-interface) to determine the path to be used as persistent storage.

## Schema
```yaml
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: persistence
      parameters:
        syncSpace: # local path in container for caching (default is /persistent)
          container_path
        sdkBranch: # sdk version to be installed in container (default is pai-for-edu)
          sdk_version       
        storagePath: # persistent storage path (default is system~0)
          storage_path   
```