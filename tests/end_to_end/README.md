# End-to-end Test

## Introduction

This end-to-end test is to make sure PAI is built and deployed correctly and working normally. The test should be installed and started in a dev box where `kubectl` installed.

## Install

Please run the following commands to install prerequisites.
```sh
$ chmod +x install.sh
$ sudo ./install.sh
```

## Usage

To run the end-to-end test, please prepare the `clusterconfig.yaml` file used in service deployment and run
```sh
$ chmod u+x start.sh
$ ./start.sh path/to/clusterconfig.yaml
```
