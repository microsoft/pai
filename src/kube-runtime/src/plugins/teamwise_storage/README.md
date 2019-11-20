# Teamwise Storage Plugin

## Goal
The teamwise storage plugin offer user to mount storage provided by admin.

## Schema
```yaml
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: teamwiase_storage
      parameters:
        storageConfigNames:
          - PAI_SAHRE  # storage config name provided by admin
```