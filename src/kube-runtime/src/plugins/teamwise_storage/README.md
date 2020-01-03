# Teamwise Storage Plugin

## Goal
The teamwise storage plugin offer user to mount storage provided by admin.

## Schema
```yaml
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: teamwise_storage
      parameters:
        storageConfigNames:
          - PAI_SHARE  # storage config name provided by admin
      failurePolicy: ignore/fail
```