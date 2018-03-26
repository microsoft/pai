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

FrameworkLauncher (or Launcher for short) is built to enable running Large-Scale Long-Running Services inside [YARN](http://hadoop.apache.org/) Containers without making changes to the Services themselves. It also supports Batch Jobs, such as TensorFlow, CNTK, etc.

## Features

* **High Availability**
  * All Launcher and Hadoop components are Recoverable and Work Preserving. So, User Services is by designed No Down Time, i.e. always uninterrupted when our components shutdown, crash, upgrade, or even any kinds of outage for a long time.
  * Launcher can tolerate many unexpected errors and has well defined Failure Model, such as dependent components shutdown, machine error, network error, configuration error, environment error, corrupted internal data, etc.
  * User Services can be ensured to Retry on Transient Failures, Migrate to another Machine per User's Request, etc.

* **High Usability**
  * No User code changes needed to run the existing executable inside Container. User only need to setup the FrameworkDescription in Json format.
  * RestAPI is supported.
  * Work Preserving FrameworkDescription Update, such as change TaskNumber, add TaskRole on the fly.
  * Migrate running Task per User's Request
  * Override default ApplicationProgress per User's Request

* **Services Requirements**
  * Versioned Service Deployment
  * ServiceDiscovery
  * AntiaffinityAllocation: Services running on different Machines

* **Batch Jobs Requirements**
  * GPU as a Resource
  * Port as a Resource
  * GangAllocation: Start Services together
  * KillAllOnAnyCompleted and KillAllOnAnyServiceCompleted
  * Framework Tree Management: DeleteOnParentDeleted, StopOnParentStopped
  * DataPartition

## Build and Start

### Dependencies
Compile-time dependencies:
* [Apache Maven](http://maven.apache.org/)
* JDK 1.8+

Run-time dependencies:
* Hadoop 2.7.2 with YARN-7481 is required to support GPU as a Resource and Port as a Resource, if you do not need it, any Hadoop 2.7+ is fine.
* Apache Zookeeper

### Build Launcher Distribution
*Launcher Distribution is built into folder .\dist.*

Windows cmd line:

    .\build.bat
GNU/Linux cmd line:

    ./build.sh

### Start Launcher Service
*Launcher Distribution is required before Start Launcher Service.*

Windows cmd line:

    .\dist\start.bat
GNU/Linux cmd line:

    ./dist/start.sh

## User Manual
See [User Manual](doc/USERMANUAL.md) to learn how to use Launcher Service to Launch Framework.