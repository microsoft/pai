# STORAGE plugin

## Goal
The storage plugin offers user to save output in persistent storage

## Schema
```yaml
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: storage
      parameters:
        syncSpace:
          container_path
        sdkBranch:
          sdk_version          
```