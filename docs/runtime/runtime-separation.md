# Pai core & runtime separation proposal

This will be a high level proposal for separation, more detailed proposal will be proposed after this high level proposal has been accepted.

## Rational behind separation

Current implementation of pai have core & runtime intertwined with each other, this is bad in that users can not easily add/remove features and we can not use runtime in both pai & pai-lite.

So the goal of this separation is:

* makes runtime implementation reusable in both pai & pai-lite
* define a clean interface between core & runtime so advanced users can easily customized pai & pai-lite by implement their own runtime

## Definitions

### Core

This component is responsible for:

* allocate cluster resources to job
* check for task's failure and restart accordingly
* schedule task to nodes
* implement inter-job priority management
* task preemption
* resources isolation

In pai, this is implemented in rest-server & yarn-launcher. In pai-lite, this is implemented in kubernetes & k8s-device-plugin & framework-controller.

### Runtime

This component is responsible for:

* manage task process, including set environment variables & stdout/stderr
* setup additional daemon process like sshd
* data preparation if needed

In pai, this is implemented in rest-server & yarnScript & dockerScript. In pai-lite, there is no implementation.

## Interface

We should implement runtime in form of docker image, so that pai & pai-lite can reuse it. Also runtime container is subjected to task resources constrain.

### Registration

Before using runtime, the runtime should have been registered in platform, in pai, this registration could happen in rest-server, in pai-lite this could happen in config of framework-controller.

In the process of registration, runtime should provide following info:

* runtime name, so user can specify which runtime to use
* container image name and version label
* runtime command, so core can know how to run it

### Running environment of runtime container

Core will start runtime container before task container, to start runtime container, core will download runtime image and start the container with command specified in registration. And before user's task can run, the runtime container should finished.

The finish requirement comes from kubernetes, because initContainer in k8s is the best candidate for implementing runtime container, and k8s expect initContainer run to completion, so I would like to impose this constrains to our runtime interface too to easy the implementation in pai-lite.

But this does not necessarily mean runtime can not run daemon process, they can, actually, by running daemon process in task container space.

So the runtime implementation can be divided into two parts:

1. processes expected to finish in runtime container space
2. daemon process running in task container space

The first part should do some preprocess of user command and prepare daemon process parameters, and the second part should start all daemon process and user command. Since it's runtime to start the user command, runtime can set its environment variables and redirect stdout/stderr and runtime also need to reap user's process if it exit.

### Running environment of task container

After runtime container finished, core will start the task container, the entry point for task container should be hooked by runtime container to make runtime being able to run daemon process and to custom task running environment, so the entry point should be predefined. I propose the core start task container from entry point of `/usr/local/pai/start` with no argument, and it is runtime container's responsibility to generate this binary/script, so runtime container can hook the entry point, and start the second part of runtime accordingly.

To make runtime container being able to change task container's filesystem, core will mount an empty directory into both runtime container and task container in same path `/usr/local/pai`, so they share this directory but not the other.