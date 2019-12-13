# STORAGE plugin

## Goal
The storage plugin offers user to save output in persistent storage

```bash
/persistent
    |- inputs  <- <cluster-storage>/user/job-name/taskrole/taskindex/inputs
    |- outputs -> <cluster-storage>/user/job-name/taskrole/taskindex/outputs
```

## Schema
```yaml
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: storage
      parameters:
        syncSpace: # local path in container for caching (default is /persistent)
          container_path
        sdkBranch: # sdk version to be installed in container (default is pai-for-edu)
          sdk_version          
```