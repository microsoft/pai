The `Python` SDK for `OpenPAI`
----

This is a proof-of-concept client (SDK) of `python` for the [OpenPAI](www.github.com/microsoft/pai). The SDK would be an independent package, which can be installed via `pip` inside the job container or in user local environment.

By providing a bag of APIs, the SDK can facilitate users access `OpenPAI` services or establish high level applications scenarios (e.g. for education).

Users can import the SDK as a `python` package in their own scripts, or use the command line interface (CLI) provided. 

- [1. Overview](#1-overview)
  - [1.1. Target audience](#11-target-audience)
- [2. Get started](#2-get-started)
  - [2.1. Installation](#21-installation)
  - [2.2. Define your cluster](#22-define-your-cluster)
  - [2.3. Set default values](#23-set-default-values)
- [3. CLI tools](#3-cli-tools)
  - [3.1. Query your existing jobs](#31-query-your-existing-jobs)
  - [3.2. Submit a job with an existing config file](#32-submit-a-job-with-an-existing-config-file)
  - [3.3. Submit a job step by step from sketch up](#33-submit-a-job-step-by-step-from-sketch-up)
  - [3.4. Add requirements (prerequisites)](#34-add-requirements-prerequisites)
  - [3.5. Submit one-line job in command line](#35-submit-one-line-job-in-command-line)
  - [3.6. _InProgress_ Job management and fetching outputs](#36-inprogress-job-management-and-fetching-outputs)
  - [3.7. Storage access](#37-storage-access)
  - [3.8. _InProgress_ Job cloning and batch submitting](#38-inprogress-job-cloning-and-batch-submitting)
- [4. Python binding](#4-python-binding)
  - [4.1. Dectect your execution environment](#41-dectect-your-execution-environment)
  - [4.2. Do it in easy way](#42-do-it-in-easy-way)
  - [4.3. Do it in a more pythoic way](#43-do-it-in-a-more-pythoic-way)
  - [4.4. Submit your working notebook running in local server](#44-submit-your-working-notebook-running-in-local-server)
- [5. _ToDiscuss_ Python SDK as a runtime](#5-todiscuss-python-sdk-as-a-runtime)
  - [5.1. Reconstruct the client in job container](#51-reconstruct-the-client-in-job-container)
  - [5.2. User can customize callbacks before or after the command executation](#52-user-can-customize-callbacks-before-or-after-the-command-executation)
  - [5.3. User can customize callbacks when exception raised](#53-user-can-customize-callbacks-when-exception-raised)
  - [5.4. Implementation](#54-implementation)
- [6. Notebook tutorials](#6-notebook-tutorials)
- [7. Make contributions](#7-make-contributions)
  - [7.1. Debug the SDK](#71-debug-the-sdk)

# 1. Overview

`OpenPAI` provides multiple ways to handle jobs and do other operations, such as web portal, extension of Visual Studio Code. The SDK and CLI tools make it easy in specific scenarios.

## 1.1. Target audience

- Users who prefer command line interface (e.g. former users of the platform `LSF`)

- Users who want to interact with `OpenPAI` in their codes

- Users who want to write code locally and then submit to `OpenPAI` 

- Users who want to reuse their codes inside or outside `OpenPAI`

# 2. Get started

This section will give guidance about installation, cluster management and setting up the variables frequently used. Refer to [examples/0-install-sdk-specify-openpai-cluster.ipynb](examples/0-install-sdk-specify-openpai-cluster.ipynb) for more details.

## 2.1. Installation

We provide installing method leveraging `pip install`

```bash
python -m pip install --upgrade pip
pip install -U -e "git+https://github.com/Microsoft/pai@<sdk-brach>#egg=openpaisdk&subdirectory=contrib/python-sdk"
```

The `<sdk-branch>` (e.g. `sdk-preview-v0.3`) is the branch name which containing the source code of SDK. After installing, please verify by CLI or python binding

```bash
opai -h
python -c "from openpaisdk import __version__; print(__version__)"
```

## 2.2. Define your cluster

Please store your cluster information into `~/.openpai/clusters.json`. Every cluster would have an alias for calling, and you may save more than one cluster in the file.

```json
[
    {
        "alias": "cluster-alias-1",
        "pai_uri": "http://x.x.x.x",
        "user": "user name",
        "passwd": "password",
        "storages":[
            {
                "alias": "default",
                "protocol": "webHDFS",
                "hdfs_web_uri": "http://x.x.x.x:yyyy"
            }
        ]
    }
]
```

Now below command shows all your clusters would be displayed.

```bash
opai cluster list [--name] [-a <cluster-alias>]
```

## 2.3. Set default values

It is annoying that specify some arguments every time, (e.g. `-a <alias>` or `-i <image>`). During the workflow, user may often reference some variables without changing. For example, it is usually to use the same docker image for multiple jobs, and the storage root doesn't change either. To simplify, it is suggested setting them by `default` command, which would be stored in `.opanpai/defaults.json` in current working directory.

```bash
opai default add <variable>=<value> [<var2>=<val2> [...]] 
opai default list
opai default remove [variable-name]
```

Here are some frequently used variables. 

| Variable | Description |
| -- | -- |
| `cluster-alias` | the alias to select which cluster to connect |
| `image` | docker image name (and tag) to use |
| `workspace` | the root path in remote storage to store job information (`<workspace>/jobs/<job-name>`) |

<font color=blue>_Note: some required arguments in below examples are set in defaults (and ignored in the examples), please refer to `help` information by `-h` or `--help`_</font>

# 3. CLI tools

The command line tool `opai` provides several useful subcommands. 

| Scene | Action | Description |
| -- | -- | -- |
| `cluster` | `list` | cluster configuration management |
| `default` | `add`, `delete` | add or remove default variables |
| `storage` | `list`, `status`, `upload`, `download`, `delete` | remote storage access |
| `job` | `list`, `new`, `submit` | query, create and summit a job |
| `task` | `add` | add a task role to a job |
| `require` | `pip`, `weblink` | add requirements (prerequisites) to a job or task role |
| `runtime` | `execute` | python SDK run as the runtime |

## 3.1. Query your existing jobs

By executing below commands, all your existing job names would be displayed.

```bash
opai job list [-a <alias>] [<job-name>] [{config,ssh}]
```

## 3.2. Submit a job with an existing config file

Of course, you could submit a job from a job config `Json` file by 

```bash
opai job submit [-a <alias>] --config <your-job-config-file>
```

## 3.3. Submit a job step by step from sketch up

To submit a job from sketch, user need to `create` the job (it would be cached in `.openpai/jobs/<job-name>`). Then task roles could be added by `task` command one by one, and `submit` commond would dump the job config to `.openpai/jobs/<job-name>/config.json` and submit it through `REST` API.

```bash
opai job new [-a <alias>] -j <job-name> [-i <image>] [-s <source-file>]
opai task -t <name-1> [-n <num>] [--gpu <gpu>] [--cpu <cpu>] [--mem <memMB>] python ...
opai task -t <name-2> [-n <num>] [--gpu <gpu>] [--cpu <cpu>] [--mem <memMB>] python ...
opai job submit [--preview]
```

## 3.4. Add requirements (prerequisites)

It is common scenarios that users would prepare their environments by add requirements, such as installing python packages, mapping data storages. The prerequisites can apply to a specific task role (if both `--job-name, -j` and `--task-role-name, -t` specified) or to all task roles in the job (if only `--job-name` specified).

```bash
opai require pip ...
opai require weblink http://x.x.x.x/filename.zip /data 
```

In the above command, user can specify `--job-name <job-name>` (required) and `--task-role-name <task-role-name>` (optional). If task role name is specified, the command only applies to the specific task role, otherwise, it is for the job (all task roles).

Now we support

- python `pip` packages
- data mapping with weblink

## 3.5. Submit one-line job in command line

For the jobs that are simple (e.g. with only one task role), the CLI tool provides a shortcut to combine create, task and submit into only one command `fast`. 

If your job only has one task role and its command looks like `python script.py arg1 arg2`, you may submit it in a simplest way like 

```bash
opai job fast -j <job-name> [-a <alias>] [-i <your-image>] python script.py arg1 arg2
```

## 3.6. _InProgress_ Job management and fetching outputs

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

## 3.7. Storage access

```bash
opai storage list <remote-path>
opai storage delete <remote-path>
opai storage status <remote-path>
opai storage upload [--overwrite] <local-path> <remote-path>
opai storage download <remote-path> <local-path>
```

The `HDFS` accessing is implemented by the package `hdfs`, the backend of which is through `webHDFS` API.

## 3.8. _InProgress_ Job cloning and batch submitting

The advanced function like job cloning has been proven to be very useful. User can clone from a local job config file or an existing job name. And user may change some parameters (nested in dictionary path joined by `::`) to a new value.

```bash
opai job clone --from <job-name-or-config> -j <new-job-name> <parameter::path::config>=<new-value> [...]
```

It is natural to try submitting multiple jobs with only small changes in the config.

```python
from subprocess import check_call
# base job
check_call(f'opai job fast -j base_job --env LR=0.001 python train.py $LR'.split())
# batch submit
for lr in ["0.005", "0.01"]:
    check_call(f'opai job clone --from base_job -j bj_lr_{lr} jobEnvs::LR={lr}'.split())
```

# 4. Python binding

After installing the SDK, there is a package named `openpaisdk` that can be imported in python code. Here are some classes being frequently used.

```python
from openpaisdk.core import Client # OpenPAI client
from openpaisdk.job import Job # job description
from openpaisdk.command_line import Engine # command dispatcher
```

## 4.1. Dectect your execution environment

In your code, you may use `openpaisdk.core.in_job_container` to indicate where you are. This let you to do different things according to your environment.

```python
from openpaisdk.core import in_job_container
# help(in_job_container) for more details
if in_job_container():
    pass
else:
    pass
```

This function is implemented by checking whether some environmental variable (e.g. `PAI_CONTAINER_ID` is set to a non-empty value).

## 4.2. Do it in easy way

To unify the interface and simplifying user's learning cost, user can do whatever CLI provides in their python code in a similar way by calling `Engine`. For example, the following lines query all existing jobs submitted by current user in cluster named `your-alias`.

```python
from openpaisdk.command_line import Engine

job_name_list = Engine().process(['job', 'list', '--name', '-a', 'your-alias'])
```

The advantages of this way over using `os.system()` or `subprocess.check_call` lies in (a) avoid overheading and (b) get the structued result (no need to parsing the text output). And this way can guarantee the consistency between CLI and python binding.

## 4.3. Do it in a more pythoic way

Since someone may not like above solution, of course, user can use the code snippets behind CLI. Here is the code to do the same thing.

```python
from openpaisdk.core import Client
from openpaisdk import __cluster_config_file__

client, _ = Client.from_json(__cluster_config_file__, 'your-alias')
job_name_list = client.jobs(name_only=True)
```

## 4.4. Submit your working notebook running in local server

If you are working in your local `Jupyter` notebook, add below cell and execute it would submit a job. 

```python
from openpaisdk.notebook import submit_notebook
from openpaisdk.core import in_job_container
# help(submit_notebook) for more details
if not in_job_container():
    job_link = submit_notebook()
    print(job_link)
```

# 5. _ToDiscuss_ Python SDK as a runtime

When submitting a job through the SDK (CLI or python binding), the SDK would be isntalled inside the job container automatically by default (turn off by adding `--disable-sdk-install` in `job create`).  

## 5.1. Reconstruct the client in job container

The SDK has passed necessary information to job container through the `__clusters__` and `__defaults__` items of the `extras` part in job config file, and the `runtime` command will save them to `~/.openpai/clusters.json` and `.opanpai/defaults.json` respectively.

## 5.2. User can customize callbacks before or after the command executation

This is similar to the pre- or post- commands in protocol v2. 

## 5.3. User can customize callbacks when exception raised

This is for debugging.

## 5.4. Implementation

An ideal implementation is SDK provides some decorators for registering callbacks. Here is an example. 

```python
# original codes
...

def main(args):
    ...

if __name__ == "__main__":
    ...
    result = main(args)
    ...
```

After customizing callbacks, it may look like

```python
# for openpai

from openpai.runtime import Runtime

app = Runtime.from_env()

@app.on('start')
def pre_commands(...): # if not defined, use that generated from job config
    ...

@app.on('end')
def post_commands(...): # if not defined, use that generated from job config
    ...

@app.on('main')
def main(args):
    ...

if __name__ == "__main__":
    ...
    result = app.run(args)
    ...

```

_Note: the RunTime may only be triggered when in_job_container() is true, or some user-defined conditions_

# 6. Notebook tutorials

To show the user stories, we prepare some `Jupyter` notebook tutorials. Refer to the directory `examples` for more information.

# 7. Make contributions

User may open issues and feature requests on [Github](). 

## 7.1. Debug the SDK

For users those want to improve the functions themselves, you may create the branch of `OpenPAI` project, and make modifications locally. And then set your own branch to the SDK installation source by 

```bash
opai default add sdk-branch=<your/branch>
```

