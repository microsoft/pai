# 1. Get started

This section will give guidance about installation, cluster management and setting up the variables frequently used. Refer to README for more details.

## 1.1. Installation

Refer to [README](../README.md#21-Installation)  for how to install the sdk and specify your cluster information.

## 1.2. Set default values

It is annoying that specify some arguments every time, (e.g. `-a <alias>` or `-i <image>`). During the workflow, user may often reference some variables without changing. For example, it is usually to use the same docker image for multiple jobs, and the storage root doesn't change either. To simplify, it is suggested setting them by `default` command, which would be stored in `.opanpai/defaults.json` in current working directory.

```bash
opai set [<variable1>=<value1> [<var2>=<val2> [...]]] 
opai unset <variable1> [<var2> [...]]
```

Here are some frequently used variables. 

| Variable | Description |
| -- | -- |
| `cluster-alias` | the alias to select which cluster to connect |
| `image` | docker image name (and tag) to use |
| `workspace` | the root path in remote storage to store job information (`<workspace>/jobs/<job-name>`) |

<font color=blue>_Note: some required arguments in below examples are set in defaults (and ignored in the examples), please refer to `help` information by `-h` or `--help`_</font>

# 2. CLI tools

The command line tool `opai` provides several useful subcommands. 

| Scene | Action | Description |
| -- | -- | -- |
| `cluster` | `list` | cluster configuration management |
| `storage` | `list`, `status`, `upload`, `download`, `delete` | remote storage access |
| `job` | `list`, `new`, `submit`, `sub` | query, create and summit a job |
| `task` | `add` | add a task role to a job |
| `require` | `pip`, `weblink` | add requirements (prerequisites) to a job or task role |
| `runtime` | `execute` | python SDK run as the runtime |

## 2.1. Query your existing jobs

By executing below commands, all your existing job names would be displayed.

```bash
opai job list [-a <alias>] [<job-name>] [{config,ssh}]
```

## 2.2. Submit a job with an existing config file

Of course, you could submit a job from a job config `Json` file by 

```bash
opai job submit [-a <alias>] --config <your-job-config-file>
```

## 2.3. Submit a job step by step from sketch up

To submit a job from sketch, user need to `create` the job (it would be cached in `.openpai/jobs/<job-name>`). Then task roles could be added by `task` command one by one, and `submit` commond would dump the job config to `.openpai/jobs/<job-name>/config.json` and submit it through `REST` API.

```bash
opai job new [-a <alias>] -j <job-name> [-i <image>] [-s <source-file>]
opai task -t <name-1> [-n <num>] [--gpu <gpu>] [--cpu <cpu>] [--mem <memMB>] python ...
opai task -t <name-2> [-n <num>] [--gpu <gpu>] [--cpu <cpu>] [--mem <memMB>] python ...
opai job submit [--preview]
```

## 2.4. Add requirements (prerequisites)

It is common scenarios that users would prepare their environments by add requirements, such as installing python packages, mapping data storages. The prerequisites can apply to a specific task role (if both `--job-name, -j` and `--task-role-name, -t` specified) or to all task roles in the job (if only `--job-name` specified).

```bash
opai require pip ...
opai require weblink http://x.x.x.x/filename.zip /data 
```

In the above command, user can specify `--job-name <job-name>` (required) and `--task-role-name <task-role-name>` (optional). If task role name is specified, the command only applies to the specific task role, otherwise, it is for the job (all task roles).

Now we support

- python `pip` packages
- data mapping with weblink

## 2.5. Submit one-line job in command line

For the jobs that are simple (e.g. with only one task role), the CLI tool provides a shortcut to combine create, task and submit into only one command `sub`. 

If your job only has one task role and its command looks like `python script.py arg1 arg2`, you may submit it in a simplest way like 

```bash
opai job sub -j <job-name> [-a <alias>] [-i <your-image>] python script.py arg1 arg2
```

## 2.6. _InProgress_ Job management and fetching outputs

The SDK provides simple job management based folder structure on _remote_ storage. It is recommended to upload user logging or results to the output directory. 


```bash
workspace (remote storage)
    └─jobs
        └─job-name-1
            ├─code
            └─output
        └─job-name-2
            ├─code
            └─output
```
|
The `workspace` and output directory path would be passed to job container by `PAI_SDK_JOB_WORKSPACE` and `PAI_SDK_JOB_OUTPUT_DIR`.

User can use below commands to fetch the outputs. 

```bash
opai output list [-j <job-name>]
opai output download [-j <job-name>] <output-name> [<output-name-1> [...]]
opai output peek [-j <job-name>] [--stdout] [--stdin] [--save <local-copy-name>]
```

## 2.7. Storage access

```bash
opai storage list <remote-path>
opai storage delete <remote-path>
opai storage status <remote-path>
opai storage upload [--overwrite] <local-path> <remote-path>
opai storage download <remote-path> <local-path>
```

The `HDFS` accessing is implemented by the package `hdfs`, the backend of which is through `webHDFS` API.

## 2.8. _InProgress_ Job cloning and batch submitting

The advanced function like job cloning has been proven to be very useful. User can clone from a local job config file or an existing job name. And user may change some parameters (nested in dictionary path joined by `::`) to a new value.

```bash
opai job clone --from <job-name-or-config> -j <new-job-name> <parameter::path::config>=<new-value> [...]
```

It is natural to try submitting multiple jobs with only small changes in the config.

```python
from subprocess import check_call
# base job
check_call(f'opai job sub -j base_job --env LR=0.001 python train.py $LR'.split())
# batch submit
for lr in ["0.005", "0.01"]:
    check_call(f'opai job clone --from base_job -j bj_lr_{lr} jobEnvs::LR={lr}'.split())
```