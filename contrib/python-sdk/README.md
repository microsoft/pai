The `Python` SDK and CLI for `OpenPAI`
----

This is a proof-of-concept SDK (Python) and CLI (command-line-interface) tool for the [OpenPAI](www.github.com/microsoft/pai).

# 1. Benefits and scenarios

## 1.1. Easily accessible `OpenPAI` interface

- **User can easily access `OpenPAI` resources in scripts (`Python` or `Shell`) and `Jupyter` notebooks**

The SDK provides classes to describe the clusters (`openpaisdk.core.Cluster`) and jobs (`openpaisdk.job.Job`). The Cluster class wraps necessary [REST APIs]() for convenient operations. The Job class is an implementation of the [protocol](https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml), with which user can easily organize (add or edit) the content of job `yaml` and `json` configuration.

Besides the wrapping of APIs, the SDK also provides functions to facilitate user to utilize `OpenPAI`. Such functions includes *cluster management*, *storage accessing*, *execution environment detection (local or in a job container)*.

_Refer to [this doc]() for more details of Python binding_

- **User can submit and list jobs by simple commands**

This SDK provides a command line interface with prefix (`opai`). User can complete basic and advanced operations in simple commands, e.g.
```bash
# query jobs
opai job list
# submit an existing job config file
opai job submit --config your/job/config/file
# submit a job in one line
opai job sub --image your/docker/image --gpu 1 some/commands
# storage access
opai storage upload/download/list ...
```

_Refer to [docs/command-line-references.md](docs/command-line-references.md) or execute `opai -h` for more details about the command line interface_

- **User can easily accomplish complicated operations with `OpenPAI`**

For some advanced users or tools running on `OpenPAI` (e.g. [NNI]()), it is quite convenient to provide a way to let user can complete operations. For example, user can submit tens of jobs to optimize a parameter in a simple `for-loop`, however, it is not so convenient if users have to do it manually.

- **User can easily reuse local codes**

`OpenPAI` is quite efficient in utilizing powerful computing resources to run deep learning jobs. However, user have to make their codes and environment ready first. One of the common way is to start a long-running interactive job and write (debug) codes in it before really execution. There are two disadvantages, one is the inconvenience of remoting debugging, the other is the wasting of computing resources.

The SDK aims to solve the problem, by letting user codes locally and executes on `OpenPAI`. For example, user can code and debug in a local running notebook first, and use `openpaisdk.notebook.submit_notebook` to turn it to a jobs with only a few lines.

## 1.2. Powerful runtime support

By installing this package in the docker container, the SDK can run as part of the runtime

- **It can provide more powerful built-in functions than `pre-commands` and `post-commands`**

The current `OpenPAI` leverages pre-commands and post-commands to do necessary operations before or after user commands. However, it is limited by the representation capability of shell commands. It would be quite hard to specify complicated behaviors. For examples, some operations (e.g. storage mounting) requires conditional operations according to OS versions. It is hard to implement in pre-commands, however, easy to do by a function in SDK.

- **It provide basic job management based on workspace and job folder structure**

For jobs submitted by the SDK (or CLI), a storage structure will be constructed for it. The SDK will create `code` and `output` (or others if required) directory in `<workspace>/jobs/<job-name>`. The SDK or CLI also provides interfaces to access them.

- **It can let user annotate output files to be saved before exiting the container**

User can annotate some files (or folders) to be uploaded during submitting the job.

- **It can provide a mechanism to execute certain callbacks at specified scenarios**

We provide pre- and post- commands in current implementation, however, the SDK would try to let user specify behaviors at other cases. For example, user can specify what to do if user commands have a non-zero exit return code.

## 1.3. Unified workflow

In the new implementation, the [job protocol]() would bridge user specification and the real execution of the job. The SDK is one of the implementations of the protocol, which includes functions to organize, edit, parse and execute the protocol as user's expectation.

![program model](docs/medias/programming_model.svg)

_*: the functions provided by the SDK or CLI_

# 2. Get started

This section will give guidance about installation, cluster management. User may find more details not covered in the [command line ref](docs/command-line-references.md).

## 2.1. Installation

We provide installing method leveraging `pip install`

```bash
python -m pip install --upgrade pip
pip install -U -e "git+https://github.com/Microsoft/pai@sdk-release-v0.4.00#egg=openpaisdk&subdirectory=contrib/python-sdk"
```

The `sdk-release-v0.4.00` is the branch name which containing the source code of SDK. After installing, please verify by CLI or python binding as below.

```bash
opai -h
python -c "from openpaisdk import __version__; print(__version__)"
```

And you may also change it to another branch (only take effect in the job container) by `opai set sdk-branch=<your/branch>`

## 2.2. Define your cluster

Please store your cluster information into `~/.openpai/clusters.yaml`. Every cluster would have an alias for calling, and you may save more than one cluster in the file.

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
    user: myuser
```

Now below command shows all your clusters would be displayed.

```bash
opai cluster list
```

## 2.3. Define cluster in command line

In some cases, user may want to define the cluster information without writing a file manually. Below commands will do the same thing as above section.

```bash
! opai cluster add --cluster-alias cluster-for-test --pai-uri http://x.x.x.x --user myuser --password mypassword
! opai cluster attach-hdfs --default --cluster-alias cluster-for-test --storage-alias hdfs --web-hdfs-uri http://x.x.x.x:port
```

In many commands (such as storage access, job submitting), you have to specify the cluster to connect by `--cluster-alias <your-cluster-alias>`, this is annoying. We provide a command to select a cluster to use by
```
opai cluster select <your-cluster-alias>
```

Commands after `opai cluster select` will have a default option (if necessary) `--cluster-alias <your-cluster-alias>`, which can be overwritten explicitly.

The mechanism behind the `select` command is that we support setting some default variables in `.openpai/defaults.json` in your current working directory, you may use
```opai set <var-name>=<var-value>```

to add new default variables, and use `opai unset <var-name>` to remove. Some commonly used default variables includes `cluster-alias` (used in `select` command), `image` (the docker image to use), `workspace` (user storage path for jobs). User could find a detailed lists in [command line ref](docs/command0line-reference.md).

## 2.4. CLI tools

The command line tool `opai` provides several useful subcommands.

| Command                    | Description                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `opai cluster list`        | list clusters defined in `~/.openpai/clusters.yaml`          |
| `opai cluster add`         | add a cluster                                                |
| `opai cluster attach-hdfs` | attach a `hdfs` storage through `WebHDFS`                    |
| `opai job list`            | list all jobs of current user (in a given cluster)           |
| `opai job submit`          | submit a given job config file to cluster                    |
| `opai job sub`             | shortcut to generate job config and submit from a given command |
| `opai storage <operation>` | execute `<operation>`* on selected storage (of a given cluster) |

_Note_
_*: operations include `list`, `status`, `upload`, `download` and `delete`_

Refer to [command line ref](docs/command-line-references.md) and tutorials under [examples](examples/) for more details.

### Example: submit a job with existing job config file

User may submit a job with an existing job config file by

```bash
opai job submit --cluster-alias <your-cluster> <job-config-file>
```

The `<job-config-file>` can be a `JSON` or `YAML` file, which should be compatible with the [job config v1]() or [job protocol v2](https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml). The CLI would judge whether it is `v1` or `v2` job configuration and call corresponding REST API to submit it.

This command also provide the functions to change some parts of the job configuration, refer to  [command line ref](docs/command-line-references.md) for more details.

### Example: submit a job with given command

In some cases, user just want to execute a simple command in `OpenPAI` cluster. The CLI provides a shortcut command to do this.

```bash
opai job sub -a <cluster-alias> -i <docker-image> -j <job-name> python script.py ...
```

_Note: put your commands in a pair of quotes (like `"git clone ... && python ..."`) and combine them with `&&` if you have multiple commands to run_

## 2.5. Python binding

See more descriptions about the `Cluster` and `Job` classes and their methods in [the doc]() and tutorials in [examples]().

## 2.6. Runtime supports

See how to specify the callbacks and other runtime supports in [docs/runtime-references.md](docs/runtime-references.md) and tutorials under [examples]().

## 2.7. Notebook tutorials

To show the user stories, we prepare some `Jupyter` notebook tutorials. Refer to the directory `examples` for more information.

# 3. Make contributions

User may open issues and feature requests on [Github]().

## 3.1. Release plan

User could find the roadmap and release plan in [docs/Roadmap.md](docs/Roadmap.md). If there are functions requests not included, please open an issue.

## 3.2. Debug the SDK

For users those want to improve the functions themselves, you may create the branch of `OpenPAI` project, and make modifications locally. And then set your own branch to the SDK installation source by

```bash
opai default add sdk-branch=<your/branch>
```

## 3.3. Unit tests

Please execute below command under the `tests` directory to have a quick unit test.
```bash
python -m unittest discover
```
