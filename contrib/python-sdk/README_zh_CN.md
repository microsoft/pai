## The `Python` SDK and CLI for `OpenPAI`

This is a proof-of-concept SDK (Python) and CLI (command-line-interface) tool for the [OpenPAI](http://github.com/microsoft/pai). This project provides some facilities to make `OpenPAI` more easily accessible and usable for users. With it,

- User can easily access `OpenPAI` resources in scripts (`Python` or `Shell`) and `Jupyter` notebooks
- User can easily submit and list jobs by simple commands, or snippets of code
- User can easily accomplish complicated operations with `OpenPAI`
- User can easily reuse local codes and notebooks
- User can easily manage and switch between multiple `OpenPAI` clusters

Besides above benefits, this project also provides powerful runtime support, which bridges users' (local) working environments and jobs' running environments (inside the containers started by remote cluster). See more about[ the scenarios and user stories](docs/scenarios-and-user-stories.md).

- [Get started](#get-started) 
  - [Installation](#installation) 
    - [Dependencies](#dependencies)
  - [Define your clusters](#define-your-clusters)
- [How-to guide for the CLI tool](#how-to-guide-for-the-cli-tool) 
  - [Cluster and storage management](#cluster-and-storage-management) 
    - [How to list existing clusters](#how-to-list-existing-clusters)
    - [How to open and edit the cluster configuration file](#how-to-open-and-edit-the-cluster-configuration-file)
  - [How to check the available resources of clusters](#how-to-check-the-available-resources-of-clusters) 
    - [How to add / delete a cluster](#how-to-add--delete-a-cluster)
    - [How to access storages of a cluster](#how-to-access-storages-of-a-cluster)
  - [Job operations](#job-operations) 
    - [How to query my jobs in a cluster](#how-to-query-my-jobs-in-a-cluster)
    - [How to submit a job from existing job config file](#how-to-submit-a-job-from-existing-job-config-file)
    - [How to change the configuration before submitting](#how-to-change-the-configuration-before-submitting)
    - [How to submit a job if I have no existing job config file](#how-to-submit-a-job-if-i-have-no-existing-job-config-file)
    - [How to request (GPU) resources for the job](#how-to-request-gpu-resources-for-the-job)
    - [How to reference a local file when submitting a job](#how-to-reference-a-local-file-when-submitting-a-job)
    - [How to submit a job given a sequence of commands](#how-to-submit-a-job-given-a-sequence-of-commands)
    - [How to add `pip install` packages](#how-to-add-pip-install-packages)
    - [How to preview the generated job config but not submit it](#how-to-preview-the-generated-job-config-but-not-submit-it)
  - [`Jupyter` notebook](#jupyter-notebook) 
    - [How to run a local notebook with remote resources](#how-to-run-a-local-notebook-with-remote-resources)
    - [How to launch a remote `Jupyter` server and connect it](#how-to-launch-a-remote-jupyter-server-and-connect-it)
  - [Other FAQ of CLI](#other-faq-of-cli) 
    - [How to select a cluster to use until I change it](#how-to-select-a-cluster-to-use-until-i-change-it)
    - [How to simplify the command](#how-to-simplify-the-command)
    - [How to install a different version of SDK](#how-to-install-a-different-version-of-sdk)
    - [How to specify the `python` environment I want to use in the job container](#how-to-specify-the-python-environment-i-want-to-use-in-the-job-container)
- [Python binding](#python-binding) 
  - [Cluster management](#cluster-management)
  - [Job management](#job-management)
- [Make contributions](#make-contributions) 
  - [Release plan](#release-plan)
  - [Debug the SDK](#debug-the-sdk)
  - [Unit tests](#unit-tests)

# Get started

This section will give guidance about installation, cluster management. User may find more details not covered in the [command line ref](docs/command-line-references.md).

## Installation

We provide installing method leveraging `pip install`

```bash
python -m pip install --upgrade pip
pip install -U "git+https://github.com/Microsoft/pai@master#egg=openpaisdk&subdirectory=contrib/python-sdk"
```

Refer to [How to install a different version of SDK](#How-to-install-a-different-version-of-SDK) for more details about installing. After installing, please verify by CLI or python binding as below.

```bash
opai -h
python -c "from openpaisdk import __version__; print(__version__)"
```

### Dependencies

- The package requires python3 (mainly because of `type hinting`), and we only tested it on `py3.5+` environment. *Only commands `job sub` and `job notebook` require installing this project inside container, others don't make any constraints of `python` version in the docker container.*
- [`Pylon`](https://github.com/microsoft/pai/tree/master/docs/pylon) is required to parse the REST api path like `/reset-server/`.

## Define your clusters

Please store the list of your clusters in `~/.openpai/clusters.yaml`. Every cluster would have an alias for calling, and you may save more than one cluster in the list.

```yaml
- cluster_alias: cluster-for-test
  pai_uri: http://x.x.x.x
  user: myuser
  password: mypassword
  default_storage_alias: hdfs
  storages:
  - protocol: webHDFS
    storage_alias: hdfs
    web_hdfs_uri: http://x.x.x.x:port

```

Now below command shows all your clusters would be displayed.

```bash
opai cluster list
```

# How-to guide for the CLI tool

This section will brief you how to leverage the CLI tool (prefixed by `opai`) to improve the productivity of interacting with `OpenPAI`. Below is a summary of functions provided.

| Command                          | Description                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `opai cluster list`              | list clusters defined in `~/.openpai/clusters.yaml`                                |
| `opai cluster resources`         | list available resources of every cluster (GPUs/vCores/Memory per virtual cluster) |
| `opai cluster edit`              | open `~/.openpai/clusters.yaml` for your editing                                   |
| `opai cluster add`               | add a cluster                                                                      |
| `opai cluster attach-hdfs`       | attach a `hdfs` storage through `WebHDFS`                                          |
| `opai job list`                  | list all jobs of current user (in a given cluster)                                 |
| `opai job submit`                | submit a given job config file to cluster                                          |
| `opai job sub`                   | shortcut to generate job config and submit from a given command                    |
| `opai job notebook`              | shortcut to run a local notebook remotely                                          |
| `opai storage <operation>` | execute `<operation>`* on selected storage (of a given cluster)              |

**: operations include `list`, `status`, `upload`, `download` and `delete`*

Before starting, we'd like to define some commonly used variables as below.

| Variable name           | CLI options           | Description                                   |
| ----------------------- | --------------------- | --------------------------------------------- |
| `<cluster-alias>` | `--cluster-alias, -a` | alias to specify a particular cluster         |
| `<job-name>`      | `--job-name, -j`      | job name                                      |
| `<docker-image>`  | `--image, -i`         | image name (and tag) for the job              |
| `<workspace>`     | `--workspace, -w`     | remote storage path to save files for a job * |

**: if specified, a directory `<workspace>/jobs/<job-name>` and subfolders (e.g. `source`, `output` ...) will be created to store necessary files for the job named `<job-name>`*

## Cluster and storage management

### How to list existing clusters

To list all existing clusters in `~/.openpai/clusters.yaml`, execute below command

```bash
opai cluster list
```

### How to open and edit the cluster configuration file

We add a convenient shortcut command to open the cluster configuration file with your editor directly by

```bash
opai cluster edit [--editor <path/to/editor>]
```

The default editor is VS Code (`code`), users may change to other editor (e.g. `--editor notepad`).

## How to check the available resources of clusters

To check the availability of each cluster, use the command

```bash
opai cluster resources
```

it will return the available GPUs, vCores and memory of every virtual cluster in every cluster.

User can also check it in a `Python` script as below

```python
from openpaisdk import __cluster_config_file__
from openpaisdk.io_utils import from_file
from openpaisdk.cluster import ClusterList

cfg = from_file(__cluster_config_file__, default=[])
ClusterList(cfg).available_resources()
```

### How to add / delete a cluster

User can use `add` and `delete` command to add (or delete) a clusters from the clusters file.

```bash
opai cluster add --cluster-alias <cluster-alias> --pai-uri http://x.x.x.x --user myuser --password mypassword
opai cluster delete <cluster-alias>
```

After adding a cluster, user may add more information (such as storage info) to it.

### How to access storages of a cluster

Before accessing, user needs to attach storages to a specify cluster.

```bash
opai cluster attach-hdfs --cluster-alias <cluster-alias> --storage-alias hdfs --web-hdfs-uri http://x.x.x.x:port --default
```

It is supported to attach multiple heterogeneous storages (e.g. `HDFS`, `NFS` ...*) to a cluster, and one of the storages will be set as default (to upload local codes). If not defined, the storage firstly added will be set as default.

After attaching, basic operations (e.g. `list`, `upload`, `download` ...) are provided.

```bash
opai storage list -a <cluster-alias> -s <storage-alias> <remote-path>
opai storage download -a <cluster-alias> -s <storage-alias> <remote-path> <local-path>
opai storage upload -a <cluster-alias> -s <storage-alias> <local-path> <remote-path>
```

## Job operations

### How to query my jobs in a cluster

User could retrieve the list of submitted jobs from a cluster. If more information is wanted, add the `<job-name>` in the command.

```bash
opai job list -a <cluster-alias> [<job-name>]
```

### How to submit a job from existing job config file

If you already has a job config file, you could submit a job based on it directly. The job config file could be in the format of `json` or `yaml`, and it must be compatible with [job configuration specification v1](https://github.com/microsoft/pai/blob/master/docs/job_tutorial.md) or [pai-job-protocol v2](https://github.com/Microsoft/pai/blob/master/docs/pai-job-protocol.yaml).

```bash
opai job submit -a <cluster-alias> <config-file>
```

The CLI would judge whether it is `v1` or `v2` job configuration and call corresponding REST API to submit it.

### How to change the configuration before submitting

The CLI tools also provides the function to change some contents of existing job config file before submitting it. For example, we need to change the job name to avoid duplicated names, and maybe want to switch to a virtual cluster with more available resources. Of course, user could change the contents of `jobName` and `virtualCluster` (in `v1` format) or `name` and `virtualCluster` in `defaults` (in `v2` format) manually. But the CLI provides a more efficient and easy way to to the same thing.

```bash
# compatible with v1 specification
opai job submit --update name=<job-name> -u defaults:virtualCluster=test <config-file>

# compatible with v2 specificaiton
opai job submit --update jobName=<job-name> -u virtualCluster=test <config-file>
```

### How to submit a job if I have no existing job config file

It is not convenient to write a job config file (no matter according to `v1` or `v2` specification). For users just want to run a specific command (or a sequence of commands) in the resources of the cluster, the CLI provides a command `sub` (different from`submit`), which could generate the job config file first and then `submit` it.

For example, user want to run `mnist_cnn.py` in a docker container (the file is contained by the docker image), the command would be

```bash
opai job sub -a <cluster-alias> -i <docker-image> -j <job-name> python mnist_cnn.py
```

### How to request (GPU) resources for the job

User could apply for specific resources (CPUs, GPUs and Memory) for the job, just by adding below options in above commands

- `--cpu <#cpu>`

- `--gpu <#gpu>`

- `--memoryMB <#memory-in-unit-of-MB>`
- `--ports <label-1>=<port-1> [--ports <label-2>=<port-2> [...]]`

### How to reference a local file when submitting a job

If the `mnist_cnn.py` is not copied in the docker image and it is a file stored in your local disk, above command would fail due to the file cannot be accessed in remote job container. To solve this problem, the option `--sources mnist_cnn.py` would be added in the command. Since the job container could access local disk directly, we need to upload the file to somewhere (defined by `--workspace`) in [the default storage of the cluster](#How-to-access-storages-of-a-cluster).

```bash
opai job sub -a <cluster-alias> -i <docker-image> -j <job-name> -w <workspace> --sources mnist_cnn.py python mnist_cnn.py
```

### How to submit a job given a sequence of commands

In some cases, user wants to do a sequence of commands in the job. The recommended way is to put your commands in a pair of quotes (like `"git clone ... && python ..."`) and combine them with `&&` if you have multiple commands to run. Here is an example of combining 3 commands.

```bash
opai job sub [...] "git clone <repo-uri> && cd <repo-dir> && python run.py arg1 arg2 ..."
```

### How to add `pip install` packages

Of course, you could write a sequence of commands like `pip install ... && python ...` . There is another way which use `--pip-installs <package>` and `--pip-path <path/to/pip>` options in the commands. it will add new commands in the `preCommands` in the `deployment`.

### How to preview the generated job config but not submit it

In some cases, user may want to preview the job config (in `v2` format) but not submit it directly. To fulfill this, just add `--preview` option. The commands support this feature includes `job submit`, `job sub` and `job notebook`.

## `Jupyter` notebook

### How to run a local notebook with remote resources

If given a local `<notebook>` (e.g. `mnist_cnn.ipynb` stored in local disk), and user wants to run it remotely (on `OpenPAI`) and see the result.

```bash
opai job notebook -a <cluster-alias> -i <docker-image> -w <workspace> <notebook>
```

This command requires options as the `opai job sub` does. This command would

- *Local* - upload `<notebook>` to `<workspace>/jobs/<job-name>/source` and submit the job to cluster (`<job-name>` is set to `<notebook>_<random-string>` if not defined)
- *In job container* - download `<notebook>` and execute it by `jupyter nbconver --execute`, the result would be saved in `<html-result>` with the same name (`*.html`)
- *In job container* - upload `<html-result>` to `<workspace>/jobs/<job-name>/output`
- *Local* - wait and query the job state until its status to be `SUCCEEDED`
- *Local* - download `<html-result>` to local and open it with web browser

### How to launch a remote `Jupyter` server and connect it

Sometimes user may want to launch a remote `Jupyter` server and do some work on it interactively. To do this, just add `--interactive` in `job notebook` command. After submitting the job, a link like `http://x.x.x.x:port/notebooks/<notebook>` will be opened in your browser. Since it takes a while to start the container, please wait and refresh the page until the notebook opens. Use the default token `abcd` (unless it is overridden by `--token <token>`) to login the notebook.

## Other FAQ of CLI

### How to select a cluster to use until I change it

As shown in above examples, `--cluster-alias, -a` is required by lots of commands, but it may not be changed frequently. So it is annoying to type it every time. The CLI tool provides a command to select a cluster to use by

    opai cluster select [-g] <cluster-alias>
    

Commands after `opai cluster select` will have a default option (if necessary) `--cluster-alias <cluster-alias>`, which can be overwritten explicitly. The mechanism and priority sequence is the same to below section.

### How to simplify the command

The mechanism behind `opai cluster select` command help us to simplify the command further. For example, we could set `--workspace, -w` with a default value by

```bash
opai set [-g] workspace=<workspace>
```

The SDK will first load (`~/.openpai/defaults.yaml`), and then update them with the contents in `.openpai/defaults.yaml` in your current working directory. In every command requires a `--workspace, -w` option but no value defined, the default value would be used.

Some commonly used default variables includes

- `cluster-alias=<cluster-alias>`
- `image=<docker-image>`
- `workspace=<workspace>`
- `sdk-branch=<sdk-branch-tag>` which branch to use when install the sdk in job container

### How to install a different version of SDK

User could easily switch to another version of SDK both in local environment and in job container. In local environment, user just change `<your/branch>` to another branch (e.g. `pai-0.14.y` for `OpenPAI` end-June release or a feature developing branch for the canary version).

```bash
pip install -U "git+https://github.com/Microsoft/pai@<your/branch>#egg=openpaisdk&subdirectory=contrib/python-sdk"
```

To debug a local update, just use `pip install -U your/path/to/setup.py`.

For jobs submitted by the SDK or command line tool, the version specified by `opai set sdk-branch=<your/version>` would be used firstly. If not specified, `master` branch will be used.

### How to specify the `python` environment I want to use in the job container

In some cases, there are more than one `python` environments in a docker image. For example, there are both `python` and `python3` environments in `openpai/pai.example.keras.tensorflow`. User could add `--python <path/to/python>` (e.g. `--python python3`) in the command `job notebook` or `job sub` to use the specific `python` environment. Refer to [notebook example](examples/1-submit-and-query-via-command-line.ipynb) for more details.

# Python binding

## Cluster management

- [x] User can describe a cluster with `openpaisdk.core.ClusterList` class to describe multiple clusters

```python
clusters = ClusterList().load() # defaultly loaded from "~/.openpai/clusters.yaml"
```

User `add`, `delete` methods to update clusters, `select` and `get_client` methods to select one from multiple clusters

- [x] the `Cluster` class has methods to query and submit jobs

```python
client = clusters.get_client(alias)
client.jobs(name)
client.rest_api_submit(job_config)
```

- [x] the `Cluster` class has methods to access storage (through `WebHDFS` only for this version)

```python
Cluster(...).storage.upload/download(...)
```

## Job management

- [x] User can describe a job with `openpaisdk.core.Job` class, which is compatible with the v2 protocol

```python
job = Job(name)
job.submit(cluster_alias) # submit current job to a cluster
```

- [x] provide some quick template of simple jobs

```python
job.one_liner(...) # generate job config from a command
job.from_notebook(...) # turn notebook to job
```

# Make contributions

User may open issues and feature requests on [Github](https://github.com/microsoft/pai).

## Release plan

If there are functions requests not included, please open an issue for feature request.

## Debug the SDK

For users those want to improve the functions themselves, you may create the branch of `OpenPAI` project, and make modifications locally. And then set your own branch to the SDK installation source by

```bash
opai set sdk-branch=<your/branch>
```

Then the `pip install` command in the job container would use `<your/branch>` . User may check the generated job config to check.

To set the internal logger to debug level, create an empty file `.openpai/debug_enable` to let sdk enable debugging logging. And remove the empty file make it work normally.

## Unit tests

Please execute below command under the `tests` directory to have a quick unit test.

```bash
python -m unittest discover
```