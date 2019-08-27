# 1. Overview

OpenPai remote debug tool only support **python** job. It contains two debug modes:

1. Start remote debug when job task starts
2. Inject breakpoint in source code and start debug when hit the breakpoint.

Currently this feature is in experiment phrase, and we don't have a mechanism to notify user whether debug server is started. Users need to check log themselves to get this info.

We recommend to use first approach to start debug. To use second approach, user need to manage the debug ports by themselves.

***NOTICE: This is an experiment feature and may be changed in future release***

# 2. Edit the job submission yaml to support debug

To support the live debug, uers need to modify the job submit yaml. Please request one debug port in `taskRoles.[task role].resourcePerInstance.ports` field. And create a new `debug` deployment.

```yaml
taskRoles:
  train:
    resourcePerInstance:
      cpu: 2
      memoryMB: 16384
      gpu: 4
      ports:
        debug: 1
deployments:
  - name: debug
    taskRoles:
      train:
        preCommands:
          - >-
            if [ ! -d /pai_data/debug ]; then mkdir --parents /pai_data/debug; fi
          - apt-get install -y --no-install-recommends wget
          - >-
            wget
            https://raw.githubusercontent.com/microsoft/pai/master/contrib/debug-tools/openpaipdb/paipdb.py
            -P /pai_data/debug

defaults:
  deployment: debug
```

The full examples can refer to [examples](../examples).

# 3. Debug methods:

## 3.1. Approach 1: Start debugging when task begins

To start debugging when task begins. We need to change the task role command.

Here is a sample:

```bash
PYTHONPATH=$PYTHONPATH:/pai_data/debug DEBUG_PORT_NAME=debug DEBUG_TIMEOUT=600 python -m paipdb user_python_script.py args ...
```

or you can use python3 to run the script:

```bash
PYTHONPATH=$PYTHONPATH:/pai_data/debug DEBUG_PORT_NAME=debug DEBUG_TIMEOUT=600 python3 -m paipdb user_python_script.py args ...
```

The `DEBUG_PORT_NAME` here is the debug port we request in `resourcePerInstance`. The `DEBUG_TIMEOUT` means the seconds debug server will wait for connecting. If there is no client connect to debug server before timeout, the task will exit.

## 3.2. Approach 2: Inject breakpoint to debug

If user want to start debug at somewhere. He/she can inject the breakpoint into the code. When program hint such breakpoint, the debug server will start. Then user can connect the debug server and start remote debug.

This is useful for remote debug multithread process.

To enable this, user can set breakpoint by inserting `import paipdb; paipdb.settrace(port=debug_port)`.

***Please notice: user need to be careful with the debug port when using `paipdb.settrace()` in multi-places***

To run the python script, just use:

```bash
PYTHONPATH=$PYTHONPATH:/pai_data/debug DEBUG_TIMEOUT=600 python3 user_python_script.py args ...
```

***We do not set DEBUG_PORT_NAME here since it will be managed by user self***

# 4. How to connect to the debug server

User can use `netcat` to connet to debug server.

For linux user, he/she can use `nc debug_server_ip debug_port` to connect

User can get the task `host_ip` and `debug_port` from the job detail page. Or through restAPI: /rest-server/api/v1/user/your_user_name/jobs/your_job_name

# 5. Debug commands

paipdb is just a simple wrapper for `pdb`. You can use the commands supported by `pdb` to debug your pai job. The `pdb` reference is here: [PDB](https://docs.python.org/3/library/pdb.html).