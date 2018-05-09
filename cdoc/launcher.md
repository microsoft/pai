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
FrameworkLauncher（以下简称Launcher）可以支持大规模[YARN](http://hadoop.apache.org/)容器中的Service能长期运行而不需要改变Service本身，同时也支持批量任务（Batch Jobs），如CNTK、Tensorflow等深度学习任务。

## 功能
* **高可用性**
    * 所有的Launcher和Hadoop组件都具有可恢复性（Recoverable）和工作保留（Work Preserving）的特性，使得用户的服务（Service）没有停机时间，即当我们的组件长时间关闭，崩溃，升级甚至任何类型的中断故障时，任务将始终不被打断。
    * Launcher容错性强，因其具有良好的故障模型（Failure Model），例如相关组件故障、机器故障、网络故障、配置错误、环境错误、内部数据损坏等等。
    * 用户服务瞬时失败时可以确保重试，或是根据用户请求迁移到另一台机器等等。

* **易于使用**
    * 要运行容器中的可执行文件，用户无需修改代码，只需Json格式的FrameworkDescription配置文件即可。
    * 支持RESTful API。
    * 由于Launcher的工作保留特性，FrameworkDescription中的配置更改可以即时更新，如更改TaskNumber、增加TaskRole等等。

* **服务支持**
    * 版本化服务部署
    * 服务发现
    * 反关联分配：服务在多个不同的机器上运行。

* **批量任务支持**
    * GPU资源调度
    * 端口（port）资源调度
    * GangAllocation：批量启动服务
    * 任务完成时批量删除，服务完成时批量删除
    * 框架树管理 **（need more detail）**
    * 数据分割 **（need more detail）**

## 安装和启动
### 环境依赖
编译环境依赖：
* [Apache Maven](http://maven.apache.org/)
* JDK 1.8+

运行环境以依赖：
* 需要Hadoop 2.7.2，YARN-7481 以支持GPU和端口资源调度，如果不需要此项功能，采用任何Hadoop 2.7+ 版本即可。
* Apache Zookeeper

### 编译生成
*Launcher编译生成的文件在 .\dist 文件夹下。**

Windows命令：

    .\build.bat

Linux命令：

    ./build.sh

### 启动Launcher服务
*需要先完成上一步Launcher的编译生成。*

Windows cmd line:

    .\dist\start.bat
GNU/Linux cmd line:

    ./dist/start.sh

## 用户手册
如何使用Launcher服务来启动应用框架详见[User Manual](doc/USERMANUAL.md)。