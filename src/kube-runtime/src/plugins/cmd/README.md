# CMD plugin

## Goal
The cmd plugin offers user to execute pre-commands or post-commands.

## Schema
```yaml
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: cmd
      parameters:
        preCommands:
          - pre-cmd
        postCommands:
          - post-cmd
```