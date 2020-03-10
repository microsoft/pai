# SSH plugin

## Goal
The ssh plugin offers ssh connection between containers. Use ${taskrole}-${index} to connect to other job container. 

## Schema
```yaml
extras:
  com.microsoft.pai.runtimeplugin:
    - plugin: ssh
      parameters:
        jobssh: boolean
        sshbarrier: boolean
        sshbarrierTimeout: number
        userssh:
          type: string
          value: string
      failurePolicy: ignore/fail
```
- jobssh: true to enable job container wise ssh, false to disable.
- sshbarrier: if set to true, wait until can ssh to all corresponding job containers. If not set, the defalut value is false.
- sshbarrierTimeout: the timeout (in minutes) of ssh barrier, default is 30 mins.
- userssh: currently the userssh type should be ```custom```. Type ```custom``` means use the userssh value as the SSH public key to run job. User can use the corresponding SSH private key to connect to job container.