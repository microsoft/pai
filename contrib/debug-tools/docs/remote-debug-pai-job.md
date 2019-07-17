# 1. Overview

OpenPai remote debug tool only support **python (version >= 3)** job. It contains two debug modes:

1. Start remote debug when job task starts
2. Inject breakpoint in source code and start debug when hit the breakpoint.

Currently this feature is in experiment phrase, and we don't have a mechanism to notify user weather debug server is starts. Users need to check log to my theirself to get this notification.

***NOTICE: This is an experiment feature and may be changed in future release***

# 2. Edit the submit job yaml file to support debug
To support the live debug, we need to modify the job submit yaml. Please add `isLiveDebug: true` in `extras` filed. And user must request one debug port in `resourcePerInstance` field.
```yaml
taskRoles:
  taskRole1:
    resourcePerInstance:
      cpu: 2
      memoryMB: 16384
      gpu: 4
      ports:
        debug: 1
extras:
  isLiveDebug: true
``` 

# 3. Start debug when task starts
To begin debug when task srarts. We need to change the task role command.

Here is a simple debug command:
```shell
DEBUG_PORT=4444 DEBUG_TIMEOUT=600 python3 -m paipdb user_python_script.py args ...
```

In the command, the `DEBUG_PORT` is the port we request in `resourcePerInstance`.The `DEBUG_TIMEOUT` means the seconds debug server will wait client to connect. If there is no client connect to debug server before timeout, the task will finished.

# 4. Inject breakpoint to debug
Some

# 5. Debug commands
paipdb is just a simple wrapper for `pdb`. You can use the commands supported by `pdb` to debug your pai job. The `pdb` reference is here:
[PDB](https://docs.python.org/3/library/pdb.html).