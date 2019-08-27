# 1. Benefits and scenarios

## 1.1. Easily accessible `OpenPAI` interface

- **User can easily access `OpenPAI` resources in scripts (`Python` or `Shell`) and `Jupyter` notebooks**

The SDK provides classes to describe the clusters (`openpaisdk.core.Cluster`) and jobs (`openpaisdk.job.Job`). The Cluster class wraps necessary REST apis for convenient operations. The Job class is an implementation of the [protocol](https://github.com/microsoft/pai/blob/master/docs/pai-job-protocol.yaml), with which user can easily organize (add or edit) the content of job `yaml` and `json` configuration.

Besides the wrapping of APIs, the SDK also provides functions to facilitate user to utilize `OpenPAI`. Such functions includes *cluster management*, *storage accessing*, *execution environment detection (local or in a job container)*.

*Refer to [this doc]() for more details of Python binding*

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

*Refer to <command-line-references.md> or execute `opai -h` for more details about the command line interface*

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

![program model](C:/Users/yuqyang.FAREAST/Workings/pai/contrib/python-sdk/docs/medias/programming_model.svg)

**: the functions provided by the SDK or CLI*