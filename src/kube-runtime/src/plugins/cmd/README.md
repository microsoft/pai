# Cmd plugin

## Goal
The cmd plugin offers user to execute pre-commands or post-commands

## Schema
```
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: cmd
      parameters:
        precommands:
          - pre-cmd
        postcommands:
          - post-cmd
```