The `Python` SDK and CLI for `OpenPAI`
----

This is a proof-of-concept SDK (Python) and CLI (command-line-interface) tool for the [OpenPAI](http://github.com/microsoft/pai). This project provides some facilities to make `OpenPAI` more easily accessible and usable for users. With it,

- User can easily access `OpenPAI` resources in scripts (`Python` or `Shell`) and `Jupyter` notebooks
- User can easily submit and list jobs by simple commands, or snippets of code
- User can easily accomplish complicated operations with `OpenPAI`
- User can easily reuse local codes and notebooks
- User can easily manage and switch between multiple `OpenPAI` clusters

Besides above benefits, this project also provides powerful runtime support, which bridges users' (local) working environments and jobs' running environments (inside the containers started by remote cluster). See more about[ the scenarios and user stories](docs/scenarios-and-user-stories.md).

- [Prepare your environment](#prepare-your-environment)
  - [Installation](#installation)
    - [Dependencies](#dependencies)
  - [Define your clusters](#define-your-clusters)
  - [Unified storage interface](#unified-storage-interface)
- [How-to guide for the CLI tool](#how-to-guide-for-the-cli-tool)
  - [Cluster and storage management](#cluster-and-storage-management)
    - [How to list existing clusters](#how-to-list-existing-clusters)
    - [How to open and edit the cluster configuration file](#how-to-open-and-edit-the-cluster-configuration-file)
  - [How to check the available resources of clusters](#how-to-check-the-available-resources-of-clusters)
    - [How to add a cluster](#how-to-add-a-cluster)
    - [How to delete a cluster](#how-to-delete-a-cluster)
    - [How to update clusters](#how-to-update-clusters)
    - [How to list available storage for a cluster](#how-to-list-available-storage-for-a-cluster)
    - [How to access storages of a cluster](#how-to-access-storages-of-a-cluster)
    - [How to specify storage and workspace](#How-to-specify-storage-and-workspace)
    - [How to add storage cluster](#how-to-add-storage-cluster)
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
    - [How to submit an empty job](#how-to-submit-an-empty-job)
    - [How to connect to a running job](#how-to-connect-to-a-running-job)
    - [How to get job status](#how-to-get-job-status)
    - [How to connect a running container through ssh](#how-to-connect-a-running-container-through-ssh)
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

# Prepare your environment

This section will give guidance about installation, cluster management. User may find more details not covered in the [command line ref](docs/command-line-references.md).

## Installation

We provide installing method leveraging `pip install`

```bash
python -m pip install --upgrade pip
pip install -U "git+https://github.com/Microsoft/pai@master#egg=openpaisdk&subdirectory=contrib/python-sdk"
```

Refer to [How to install a different version of SDK](#How-to-install-a-different-version-of-SDK) for more details about installing. After installing, please verify by CLI or python binding as below.

```bash
pai -h
python -c "from openpaisdk import __version__; print(__version__)"
```

### Dependencies

- The package requires python3 (mainly because of `type hinting`), and we only tested it on `py3.5+` environment. _Only commands `job sub` and `job notebook` require installing this project inside container, others don't make any constraints of `python` version in the docker container._
- [`Pylon`](https://github.com/microsoft/pai/tree/master/docs/pylon) is required to parse the REST api path like `/reset-server/`.

## Define your clusters

Please store the list of your clusters in `~/.openpai/clusters.yaml`. Every cluster would have an alias for calling, and you may save more than one cluster in the list.

```bash
# for user/password authentication
pai add-cluster --cluster-alias <cluster-alias> --pai-uri <pai-uri> --user <user> --password <password>
# for Azure AD authentication
pai add-cluster --cluster-alias <cluster-alias> --pai-uri <pai-uri> --user <user> --toke <token>
```

During adding the cluster, the CLI will try to connect the cluster and receive the essential information such as storages, virtual clusters automatically. 

Now below command shows all your clusters would be displayed.

```bash
pai list-clusters
```
## Unified storage interface

Administrator of a cluster would specify some built-in storages for a cluster, the list of storages would be get via REST API. Then user could access the storage via commands like 
```bash
pai listdir pai://<cluster-alias>/<storage-name>/path/to/folder
```

User could upload a local file (or directory) to cluster by 
```bash
pai copy /src/path pai://<cluster-alias>/<storage-name>/dest/path
```

and download to local by 
```bash
pai copy pai://<cluster-alias>/<storage-name>/dest/path /src/path
```
In some case, user could create a directory on cluster via command like
```bash
pai makedir pai://<cluster-alias>/<storage-name>/path
```
or
```bash
pai makedirs pai://<cluster-alias>/<storage-name>/path
```
`makedir(s)` command would make the directory recursicely if necessary

User could delete a file or directory on cluster by
```bash
pai remove pai://<cluster-alias>/<storage-name>/path
```
or
```bash
pai delete pai://<cluster-alias>/<storage-name>/path
```

User could get information of a file or folder location on the cluster via command like
```bash
pai getinfo pai://<cluster-alias>/<storage-name>/path
```


# How-to guide for the CLI tool

This section will brief you how to leverage the CLI tool (prefixed by `pai`) to improve the productivity of interacting with `OpenPAI`. Below is a summary of functions provided.

| Command                    | Description                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `pai list-clusters`        | list clusters defined in `~/.openpai/clusters.yaml`                                |
| `pai cluster-resources`   | list available resources of every cluster (GPUs/vCores/Memory per virtual cluster) |
| `pai edit-clusters`        | open `~/.openpai/clusters.yaml` for your editing                                   |
| `pai add-cluster`         | add a cluster                                                                      |
| `pai list-jobs`            | list all jobs of given user (in a given cluster)                                   |
| `pai job-status`          | query the status of a job                                                          |
| `pai stop-job/pai stop-jobs`            | stop job(s)                                                                         |
| `pai submit`          | submit a given job config file to cluster                                          |
| `pai sub`             | shortcut to generate job config and submit from a given command                    |
| `pai notebook-job`        | shortcut to run a local notebook remotely                                          |
| `pai list-storages` | list all the storages of a given cluster|
| `pai select-storage` | select a storage mount point and workspace for system use|



Before starting, we'd like to define some commonly used variables as below.

| Variable name     | CLI options           | Description                                   |
| ----------------- | --------------------- | --------------------------------------------- |
| `<cluster-alias>` | `--cluster-alias, -a` | alias to specify a particular cluster         |
| `<job-name>`      | `--job-name, -j`      | job name                                      |
| `<docker-image>`  | `--image, -i`         | image name (and tag) for the job              |
| `<workspace>`     | `--workspace, -w`     | remote storage path to save files for a job * |

_*: if specified, a directory `<workspace>/jobs/<job-name>` and subfolders (e.g. `source`, `output` ...) will be created to store necessary files for the job named `<job-name>`_

## Cluster and storage management

### How to list existing clusters

To list all existing clusters in `~/.openpai/clusters.yaml`, execute below command

```bash
pai list-clusters
```

### How to open and edit the cluster configuration file

We add a convenient shortcut command to open the cluster configuration file with your editor directly by

```bash
pai edit-clusters [--editor <path/to/editor>]
```

The default editor is VS Code (`code`), users may change to other editor (e.g. `--editor notepad`).

## How to check the available resources of clusters

To check the availability of each cluster, use the command
```bash
pai cluster-resources
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

### How to add a cluster

User can use `add` and `delete` command to add (or delete) a clusters from the clusters file.

```bash
# for user/password authentication
pai add-cluster --cluster-alias <cluster-alias> --pai-uri <pai-uri> --user <user> --password <password>
# for Azure AD authentication
pai add-cluster --cluster-alias <cluster-alias> --pai-uri <pai-uri> --user <user> --token <token>
```

On receiving the add command, the CLI will try to connect the cluster, and get basic configuration from it.

User can also add it by `python` binding as below.


### How to delete a cluster

Delete a cluster by calling its alias.

```bash
pai delete-cluster <cluster-alias>
```

### How to update clusters

User could update all registered clusters via command like

```bash
pai update-clusters
```

### How to list available storage for a cluster

To list all existing storage of a cluster, execute below command

```bash
pai list-storages <cluster-alias>
```

### How to access storages of a cluster

User can use [`list-storages`](#How-to-list-available-storage-for-a-cluster) command to list all storages of a given cluster.

```bash
pai list-storages <cluster-alias>
```

After that, user can access a specific storage by storage name. See [Unified storage interface](#unified-storage-interface)


### How to mount storage and workspace

Workspace is a directory to store the data and output of jobs. Before submitting jobs, user needs to specify storage and workspace on cluster. The directory `/<user>/<workspace>` would be generated on the specified storage. If `--workspace` option is empty, only `/<user>` directory would be generated.

```bash
pai select-storage --cluster-alias <cluster-alias> --storage-name <storage-name> --workspace <workspace>
```

### How to add storage cluster

User could add storage cluster via the command like

```bash
pai add-storage-cluster --cluster-alias <cluster-alias> --type <storage-type> --address <storage-address> --path <path> <contents>
```

## Job operations

### How to query my jobs in a cluster

User could retrieve the list of submitted jobs from a cluster. If more information is wanted, add the `<job-name>` in the command.

```bash
pai list-jobs -a <cluster-alias> [<job-name>]
```

### How to submit a job from existing job config file

If you already has a job config file, you could submit a job based on it directly. The job config file could be in the format of `json` or `yaml`, and it must be compatible with [job configuration specification v1](https://github.com/microsoft/pai/blob/master/docs/job_tutorial.md) or [pai-job-protocol v2](https://github.com/Microsoft/pai/blob/master/docs/pai-job-protocol.yaml).

```bash
pai submit -a <cluster-alias> <config-file>
```

The CLI would judge whether it is `v1` or `v2` job configuration and call corresponding REST API to submit it.

### How to change the configuration before submitting

The CLI tools also provides the function to change some contents of existing job config file before submitting it. For example, we need to change the job name to avoid duplicated names, and maybe want to switch to a virtual cluster with more available resources. Of course, user could change the contents of `jobName` and `virtualCluster` (in `v1` format) or `name` and `virtualCluster` in `defaults` (in `v2` format) manually. But the CLI provides a more efficient and easy way to to the same thing.

```bash
# compatible with v1 specification
pai submit --update name=<job-name> -u defaults:virtualCluster=test <config-file>

# compatible with v2 specificaiton
pai submit --update jobName=<job-name> -u virtualCluster=test <config-file>
```

### How to submit a job if I have no existing job config file

It is not convenient to write a job config file (no matter according to `v1` or `v2` specification). For users just want to run a specific command (or a sequence of commands) in the resources of the cluster, the CLI provides a command `sub` (different from`submit`), which could generate the job config file first and then `submit` it.

For example, user want to run `mnist_cnn.py` in a  docker container (the file is contained by the docker image), the command would be

```bash
pai sub -a <cluster-alias> -i <docker-image> -j <job-name> python mnist_cnn.py
```

### How to request (GPU) resources for the job

User could apply for specific resources (CPUs, GPUs and Memory) for the job, just by adding  below options in above commands

- `--cpu <#cpu>`

- `--gpu <#gpu>`
- `--memoryMB <#memory-in-unit-of-MB>`
- `--ports <label-1>=<port-1> [--ports <label-2>=<port-2> [...]]`

### How to reference a local file when submitting a job

If the `mnist_cnn.py` is not copied in the docker image and it is a file stored in your local disk, above command would fail due to the file cannot be accessed in remote job container. To solve this problem, the option `--sources mnist_cnn.py` would be added in the command. Since the job container could access local disk directly, we need to upload the file to somewhere (defined by `--workspace` specified by [`pai select-storage`](#How-to-specify-storage-and-workspace)) in [the default storage of the cluster](#How-to-access-storages-of-a-cluster).

```bash
pai sub -a <cluster-alias> -i <docker-image> -j <job-name> --sources mnist_cnn.py python mnist_cnn.py
```

### How to submit a job given a sequence of commands

In some cases, user wants to do a sequence of commands in the job. The recommended way is to put your commands in a pair of quotes (like `"git clone ... && python ..."`) and combine them with `&&` if you have multiple commands to run. Here is an example of combining 3 commands.

```bash
pai sub [...] "git clone <repo-uri> && cd <repo-dir> && python run.py arg1 arg2 ..."
```

### How to add `pip install` packages

Of course, you could write a sequence of commands like `pip install ... && python ...` . There is another way which use `--pip-installs <package>` and `--pip-path <path/to/pip>` options in the commands. it will add new commands in the `preCommands` in the `deployment`.

### How to preview the generated job config but not submit it

In some cases, user may want to preview the job config (in `v2` format) but not submit it directly. To fulfill this, just add `--preview` option. The commands support this feature includes `submit`, `sub` and `notebook-job`.

### How to submit an empty job
In some cases, user may want to submit an empty job and interact the docker container through SSH tool. To achieve that, option `--timeout` would be added, which means how long the container will survive. For example, user want to start a docker container running for 1 days, the command would be

```bash
pai start-container --cluster-alias <cluster-alias> --job-name <job-name> --timeout 1d --image <docker-image>
```

The terminal would start the ssh terminal automatically, and the SSH command would be printed out as well, users can copy and execute the command accordding to their needs.

And the private key file would be downloaded in current directory, users should execute SSH command in the same directory with that key file.

**Tips:** 1)Your `<docker-image>` must enable SSH. See the link [Enable SSH for your docker image](https://github.com/microsoft/pai/blob/19817a0170b72d44ed9ce0fe2fe6f430c0d5b3f3/docs/zh_CN/job_docker_env.md#enable-ssh-for-your-image)

2)If your job are in "WAITING" state when connecting, pls try [ssh-container](#how-to-connect-a-running-container-through-ssh) later.

### How to connect to a running job

User nay want to know the information of a running job. To achicve that, the command would be

```bash
pai connect-job --cluster-alias <cluster-alias> <job-name>
```
The job info would be printed to screen until it was SUCCEEDED/FAILED/STOPPED

### How to get job status

Using `job-status` command to get job status. Compared to `connect-job`, this command only print job status once.

```bash
pai job-status --cluster-alias <cluster-alias> --user <user> <job-name> <query>
```
`<query>` could be `ssh`,`config`, or `[None]` as user required. 

### How to connect a running container through ssh
In some cases, user may want to visit a running container and check its state. To achieve that, the commond should be

```bash
pai ssh-container --cluster-alias <cluster-alias> --job-name <job-name> --user <user>
```
**Tips:** Your `<docker-image>` must enable SSH. See the link [Enable SSH for your docker image](https://github.com/microsoft/pai/blob/19817a0170b72d44ed9ce0fe2fe6f430c0d5b3f3/docs/zh_CN/job_docker_env.md#enable-ssh-for-your-image)

## `Jupyter` notebook

### How to run a local notebook with remote resources

If given a local `<notebook>` (e.g. `mnist_cnn.ipynb` stored in local disk), and user wants to run it remotely (on `OpenPAI`) and see the result.

```bash
pai notebook-job -a <cluster-alias> -i <docker-image> <notebook>
```

This command requires options as the `pai sub` does. This command would

- *Local* - upload `<notebook>` to `<workspace>/jobs/<job-name>/source` and submit the job to cluster (`<job-name>` is set to `<notebook>_<random-string>` if not defined)
- _In job container_ - download `<notebook> ` and execute it by `jupyter nbconver --execute`, the result would be saved in `<html-result>` with the same name (`*.html`)
- _In job container_ - upload `<html-result>` to `<workspace>/jobs/<job-name>/output`
- _Local_ -  wait and query the job state until its status to be `SUCCEEDED`
- _Local_ - download `<html-result>` to local and open it with web browser

### How to launch a remote `Jupyter` server and connect it

Sometimes user may want to launch a remote `Jupyter` server and do some work on it interactively. To do this, just add `--interactive` in `notebook-job` command. After submitting the job, a link like `http://x.x.x.x:port/notebooks/<notebook>` will be opened in your browser. Since it takes a while to start the container, please wait and refresh the page until the notebook opens. Use the default token `abcd` (unless it is overridden by `--token <token>`) to login the notebook.


## Other FAQ of CLI

### How to select a cluster to use until I change it

As shown in above examples, `--cluster-alias, -a` is required by lots of commands, but it may not be changed frequently. So it is annoying to type it every time. The CLI tool provides a command to select a cluster to use by

```
opai cluster select [-g] <cluster-alias>
```

Commands after `pai select-cluster` will have a default option (if necessary) `--cluster-alias <cluster-alias>`, which can be overwritten explicitly. The mechanism and priority sequence is the same to below section.

### How to simplify the command

The mechanism behind `pai select-cluster` command help us to simplify the command further. For example, we could set `--workspace, -w` with a default value by

```bash
opai set [-g] workspace=<workspace>
```

The SDK will first load (`~/.openpai/defaults.yaml`), and then update them with the contents in `.openpai/defaults.yaml` in your current working directory. In every command requires a `--workspace, -w` option but no value defined, the default value would be used.

Some commonly used default variables includes

- `cluster-alias=<cluster-alias>`
- `image=<docker-image>`
- `workspace=<workspace>`
- `container-sdk-branch=<container-sdk-branch-tag>` which branch to use when install the sdk in job container

### How to install a different version of SDK

User could easily switch to another version of SDK both in local environment and in job container. In local environment, user just change `<your/branch>` to another branch (e.g. `pai-0.14.y` for `OpenPAI` end-June release or a feature developing branch for the canary version).

```bash
pip install -U "git+https://github.com/Microsoft/pai@<your/branch>#egg=openpaisdk&subdirectory=contrib/python-sdk"
```

To debug a local update, just use `pip install -U your/path/to/setup.py`.

For jobs submitted by the SDK or command line tool, the version specified by `pai set container-sdk-branch=<your/version>` would be used firstly. If not specified, `master` branch will be used.

### How to specify the `python` environment I want to use in the job container

In some cases, there are more than one `python` environments in a docker image. For example, there are both `python` and `python3` environments in `openpai/pai.example.keras.tensorflow`. User could add `--python <path/to/python>` (e.g. `--python python3`) in the command `notebook-job` or `sub` to use the specific `python` environment. Refer to [notebook example](examples/1-submit-and-query-via-command-line.ipynb) for more details.

# Python binding

## Cluster management

- [x] User can describe a cluster with `openpaisdk.core.ClusterList` class to describe multiple clusters

```python
clusters = ClusterList().load() # defaultly loaded from "~/.openpai/clusters.yaml"
```

User `add`, `delete` methods to update clusters, `select` and `get_client` methods to select one from multiple clusters.

To add a cluster:
```python
cluster_cfg = {
    "cluster_alias": ..., # each cluster mush have an unique alias
    "pai_uri": ...,
    "user": ...,
    # for user/password authentication
    "password": ...,
    # for Azure AD authentication
    "token": ...,
}
ClusterList().load().add(cluster_cfg).save()
```

To delete a cluster:
```python
ClusterList().load().delete(cluster_alias).save()
```

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
pai set container-sdk-branch=<your/branch>
```

Then the `pip install` command in the job container would use `<your/branch>` . User may check the generated job config to check.

To set the internal logger to debug level, create an empty file `.openpai/debug_enable` to let sdk enable debugging logging. And remove the empty file make it work normally.

## Unit tests

Please execute below command under the `tests` directory to have a quick unit test.
```bash
python -m unittest discover
```

Since the unit tests will try to connect your cluster, we set a test environment instead of corrupting the practical settings. Please add a `ut_init.sh` file in `tests` as below
```bash
pai set clusters-in-local=yes # don't corrupt practical environment
pai add-cluster -a <cluster-alias> --pai-uri http://x.x.x.x --user <user> --password <password>
pai select-cluster <cluster-alias>
```
