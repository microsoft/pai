<!--
  Copyright (c) Microsoft Corporation
  All rights reserved.

  MIT License

  Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
  documentation files (the "Software"), to deal in the Software without restriction, including without limitation
  the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
  to permit persons to whom the Software is furnished to do so, subject to the following conditions:
  The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
  BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
-->

# Microsoft FrameworkLauncher

FrameworkLauncher (or Launcher for short) is built to orchestrate all kinds of applications on [YARN](http://hadoop.apache.org/) and [Kubernetes](https://kubernetes.io/) through the same interface without making changes to the applications themselves.

These applications include but not limited to:
* Long-Running Services (DeepLearning Serving, HBase, Kafka, etc)
* Batch Jobs (DeepLearning Training, KDTree Building, etc)
* Streaming Jobs (Data Processing, etc).

## YARN FrameworkLauncher

FrameworkLauncher Natively Supports YARN:
[YARN FrameworkLauncher](yarn/README.md).

Note, it **ALSO** includes scheduling features, such as Topology-Aware Gpu Scheduling.

## Kubernetes FrameworkLauncher

FrameworkLauncher Natively Supports Kubernetes:
[Kubernetes FrameworkController](https://github.com/Microsoft/frameworkcontroller).

Note, it does **NOT** includes scheduling features, for the scheduling counterpart, we have already splitted it to another dedicated project: [HivedScheduler](https://github.com/microsoft/pai/tree/master/subprojects/hivedscheduler), and you can directly leverage it with the [Kubernetes FrameworkController](https://github.com/Microsoft/frameworkcontroller).
