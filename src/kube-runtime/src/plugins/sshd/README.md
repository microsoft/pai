# Sshd plugin

## Goal
The sshd plugin offers ssh connection between containers. Use ${taskrole}-${index} to connect to other job container. 

## Schema
```
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: sshd
      parameters:
        userssh: string
```