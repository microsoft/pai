The `Python` SDK for `OpenPAI`
----

This is a proof-of-concept client (SDK) of `python` for the [OpenPAI](www.github.com/microsoft/pai). The SDK would be an independent package, which can be installed via `pip` inside the job container or in user local environment.

By providing a bag of APIs, the SDK can facilitate users access `OpenPAI` services or establish high level applications scenarios (e.g. for education).

Users can import the SDK as a `python` package in their own scripts, or use the command line interface (CLI) provided. 

- [1. Installation and Cluster management](#1-installation-and-cluster-management)
  - [1.1. Installation](#11-installation)
  - [1.2. Define your cluster](#12-define-your-cluster)
  - [1.3. Set default values](#13-set-default-values)
- [2. CLI tools](#2-cli-tools)
  - [2.1. Query your existing jobs](#21-query-your-existing-jobs)
  - [2.2. Submit a job with an existing config file](#22-submit-a-job-with-an-existing-config-file)
  - [2.3. Submit a job step by step from sketch up](#23-submit-a-job-step-by-step-from-sketch-up)
  - [2.4. _InProgress_ Submit one-line job in command line](#24-inprogress-submit-one-line-job-in-command-line)
  - [2.5. _InProgress_ Fetch outputs](#25-inprogress-fetch-outputs)
  - [2.6. _InProgress_ Storage access](#26-inprogress-storage-access)
- [3. Python binding](#3-python-binding)
  - [3.1. Dectect your executation environment](#31-dectect-your-executation-environment)
  - [3.2. Do it in easy way](#32-do-it-in-easy-way)
  - [3.3. Do it in a more pythoic way](#33-do-it-in-a-more-pythoic-way)
  - [3.4. _Updating_ Submit your working notebook running in local server](#34-updating-submit-your-working-notebook-running-in-local-server)
- [4. _ToDiscuss_ Python SDK as a runtime](#4-todiscuss-python-sdk-as-a-runtime)
  - [4.1. Reconstruct the client in job container](#41-reconstruct-the-client-in-job-container)
  - [4.2. User can customize callbacks before or after the command executation](#42-user-can-customize-callbacks-before-or-after-the-command-executation)
  - [4.3. User can customize callbacks when exception raised](#43-user-can-customize-callbacks-when-exception-raised)
  - [4.4. Implementation](#44-implementation)
- [5. Notebook tutorials](#5-notebook-tutorials)

# 1. Installation and Cluster management

## 1.1. Installation

We provide installing method leveraging `pip install`
```bash
pip install -U pip
pip install -U -e "git+https://github.com/Microsoft/pai@yuqyang/sdk#egg=openpaisdk&subdirectory=contrib/python-sdk"
```

After installing, please verify by CLI or python binding

```bash
opai -h
python -c "from openpaisdk import __version__; print(__version__)"
```

## 1.2. Define your cluster

Please store your cluster information into `~/.openpai/clusters.json`. Every cluster would have an alias for calling, and you may save more than one cluster in the file.

```json
{
    "cluster-alias-1": {
        "pai_uri": "http://x.x.x.x",
        "user": "user name",
        "passwd": "password",
        "hdfs_web_uri": "http://x.x.x.x:yyyy"
    }
}
```

Now below command shows all your clusters would be displayed.

```bash
opai cluster list [--name] [-a <cluster-alias>]
```

_Note: `-a <alias>` could be omitted if only one cluster is defined_

## 1.3. Set default values

It is annoying that specify some arguments every time, (e.g. `-a <alias>` or `-i <image>`). During the workflow, user may often reference some variables without changing. For example, it is usually to use the same docker image for multiple jobs, and the storage root doesn't change either. To simplify, it is suggested setting them by `default` command, which would be stored in `.opanpai/defaults.json` in current working directory.

```bash
opai default add <variable>=<value> [<var2>=<val2> [...]] 
opai default list
opai default remove [variable-name]
```

Here are some frequently used variables, such as `cluster-alias`, `worksapce`, `image` and so on.

# 2. CLI tools

The CLI provides functions like `cluster`, `job` ... and their sub commands.

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
opai job create [-a <alias>] -j <job-name> [-i <image>] [-p <package>] [-s <source-file>]
opai job task -t <name-1> [-n <instances>] [--gpu <gpu>] [--cpu <cpu>] [--mem <memMB>] python ...
opai job task -t <name-2> [-n <instances>] [--gpu <gpu>] [--cpu <cpu>] [--mem <memMB>] python ...
opai job submit 
```

## 2.4. _InProgress_ Submit one-line job in command line

If your job only has one task role and its command looks like `python script.py arg1 arg2`, you may submit it in a simplest way like 

```bash
opai job fast -j <job-name> [-a <alias>] -i <your-image> python script.py arg1 arg2
```

## 2.5. _InProgress_ Fetch outputs

The SDK provides simple job management based folder structure on _remote_ storage. It is recommended to upload user logging or results to the output directory. 

```bash
workspace
    └─job-name-1
        ├─code
        └─output
    └─job-name-2
        ├─code
        └─output
```

The `workspace` and output directory path would be passed to job container by `PAI_SDK_JOB_WORKSPACE` and `PAI_SDK_JOB_OUTPUT_DIR`.

User can use below commands to fetch the outputs. 

```bash
opai output list [-j <job-name>]
opai output download [-j <job-name>] <output-name> [<output-name-1> [...]]
opai output peek [-j <job-name>] [--stdout] [--stdin] [--save <local-copy-name>]
```

## 2.6. _InProgress_ Storage access

```bash
opai storage list <remote-path>
opai storage delete <remote-path>
opai storage status <remote-path>
opai storage upload [--overwrite] <local-path> <remote-path>
opai storage download <remote-path> <local-path>
```

The `HDFS` accessing is implemented by the package `hdfs`, the backend of which is through `webHDFS` API.

# 3. Python binding

After installing the SDK, there is a package named `openpaisdk` that can be imported in python code. Here are some classes being frequently used.

```python
from openpaisdk.core import Client # OpenPAI client
from openpaisdk.job import Job # job description
from openpaisdk.engine import Engine # command dispatcher
```

## 3.1. Dectect your executation environment

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

## 3.2. Do it in easy way

To unify the interface and simplifying user's learning cost, user can do whatever CLI provides in their python code in a similar way by calling `Engine`. For example, the following lines query all existing jobs submitted by current user in cluster named `your-alias`.

```python
from openpaisdk.engine import Engine

job_name_list = Engine().process(['job', 'list', '--name', '-a', 'your-alias'])
```

The advantages of this way over using `os.system()` or `subprocess.check_call` lies in (a) avoid overheading and (b) get the structued result (no need to parsing the text output). And this way can guarantee the consistency between CLI and python binding.

## 3.3. Do it in a more pythoic way

Since someone may not like above solution, of course, user can use the code snippets behind CLI. Here is the code to do the same thing.

```python
from openpaisdk.core import Client
from openpaisdk import __cluster_config_file__

client, _ = Client.from_json(__cluster_config_file__, 'your-alias')
job_name_list = client.jobs(name_only=True)
```

## 3.4. _Updating_ Submit your working notebook running in local server

If you are working in your local `Jupyter` notebook, add below cell and execute it would submit a job. 

```python
from openpaisdk.notebook import submit_notebook
from openpaisdk.core import in_job_container
from openpaisdk import __install__
# help(submit_notebook) for more details
if not in_job_container():
    job_link = submit_notebook(
        image='jupyter/minimal-notebook', # 'ubuntu:16.04'
        pip_requirements=[__install__]
    )
    print(job_link)
```

# 4. _ToDiscuss_ Python SDK as a runtime

When submitting a job through the SDK (CLI or python binding), the SDK would be isntalled inside the job container automatically by default (turn off by adding `--disable-sdk-install` in `job create`).  

## 4.1. Reconstruct the client in job container

The SDK has passed necessary information to job container through environmental variables, so it is easy to reconstruct the client by calling `Client.from_env()`.

## 4.2. User can customize callbacks before or after the command executation

This is similar to the pre- or post- commands in protocol v2. 

## 4.3. User can customize callbacks when exception raised

This is for debugging.

## 4.4. Implementation

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


# 5. Notebook tutorials

To show the user stories, we prepare some `Jupyter` notebook tutorials. Below is a brief summary of how-to tutorials (some are to be added). 

- [x] [Installation and specify OpenPAI cluster information](examples/0-install-sdk-specify-openpai-cluster.ipynb)
- [x] [Submit and query job via command line interface from local environment](examples/1-submit-and-query-via-command-line.ipynb)
- [x] [Submit job from notebook running in local environment](examples/2-submit-job-from-local-notebook.ipynb)
- [ ] [Access data storage via CLI or code from local and job container]()
- [ ] [Submit jobs with multiple taskroles]()
- [ ] [Runtime - fetch user stdout and stderr seperatedly]()
- [ ] [Runtime - debug experience enhancement]()