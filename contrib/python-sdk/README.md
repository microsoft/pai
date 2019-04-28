# The `python` SDK for `OpenPAI`

This is a proof-of-concept client (SDK) of `python` for the [OpenPAI](www.github.com/microsoft/pai). The SDK would be an independent package, which can be installed via `pip` inside the job container or in user local environment.

By providing a bag of APIs, the SDK can facilitate users access `OpenPAI` services or establish high level applications scenarios (e.g. for education).

Users can import the SDK as a `python` package in their own scripts, or use the command line interface (CLI) provided. 

Below is a brief summary of how-to tutorials (some are to be added). 

- [x] [Installation and specify OpenPAI cluster information](examples/0-install-sdk-specify-openpai-cluster.ipynb)
- [x] [Submit and query job via command line interface from local environment](examples/1-submit-and-query-via-command-line.ipynb)
- [x] [Submit job from notebook running in local environment](examples/2-submit-job-from-local-notebook.ipynb)
- [ ] [Access HDFS data in notebook from local environment and inside job container]()
- [ ] [Access HDFS data via CLI from local environment and inside job container]()
- [ ] [Submit jobs with multiple taskroles]()

## Quick Start

### Install

We provide installing method leveraging `pip install`
```bash
pip install -U pip
pip install -U -e "git+https://github.com/Microsoft/pai@yuqyang/sdk#egg=openpaisdk&subdirectory=contrib/python-sdk"
opai -h
```

### Define your cluster in `~/openpai.josn`

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

Now executing `opai cluster`, show all your clusters would be displayed.

### Query your existing jobs

By executing below commands, all your existing job names would be displayed. 
_Note: `-a <alias>` could be omitted if only one cluster is defined_

```bash
opai -a <alias> jobs --name
```

### Submit one-line job in command line

Of course, you could submit a job from a job config `Json` file by 

```bash
opai -a <alias> submit --config <your-job-config-file>
```

If your command looks like `python script.py arg1 arg2`, you may submit it in a simplest way like 

```bash
opai -a <alias> submit -i <your-image> python script.py arg1 arg2
```

_In progress:_ You may specify the resource requirements by adding `--gpu #`, `--mem #MB`.

_TBA:_ For further simplicity, we may put the frequently used arguments (e.g. image name) into config file as below (`~/openpai.josn`).

```json
{
    "cluster-alias-1": {
        ...
        "submit-defaults": {
            "image": "your-image"
        },
        ...
    }
}
```

### Dectect your executation environment

In your code, you may use `openpaisdk.core.in_job_container` to indicate where you are. This let you to do different things according to your environment.

```python
from openpaisdk.core import in_job_container
# help(in_job_container) for more details
if in_job_container():
    pass
else:
    pass
```

### Submit your working notebook running in local server

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

## Priority list

Since this sdk is in early phase, and the resources are always limited, we can only complete the functions step by step. 

- P0
    - [ ] fix bugs and make above functions stable
    - [ ] add default settings in `~/openpai.josn`
    - [ ] unify backend functions of submitting in CLI and in notebook
    - [ ] define cli format for jobs with mulitple taskroles
- P1 