# Ssh plugin

## Goal
The ssh plugin offers ssh connection between containers. Use ${taskrole}-${index} to connect to other job container. 

## Schema
```
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: ssh
      parameters:
        userssh: string
```