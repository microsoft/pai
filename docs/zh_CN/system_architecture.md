## 系统架构

![系统架构](../sysarch.png)

系统架构如上图所示.  

用户通过 [Web 端](webportal/README.md)提交和管理任务, 
WEB 端调用 [REST server](rest-server/README.md) 提供的系统 API 接口.  
第三方任务管理工具也可以直接调用REST 服务接口.  
REST 服务通过[FrameworkLauncher](frameworklauncher/README.md) (缩写为Launcher)响应用户的 API 请求，完成任务管理工作。  
Launcher 服务响应REST服务的请求，将任务提交到 Hadoop YARN 里.  
YARN 通过 [GPU enhancement](https://issues.apache.org/jira/browse/YARN-7481)来调度任务,使用 GPU 完成深度学习任务.   
传统大数据任务或 CPU 的计算任务也可以在平台上运行，可以和 GPU 任务共存。  
平台使用HDFS存储数据，工作任务应该支持HDFS。  
所有的静态服务 (蓝色方框)由 K8s 管理 , 所有任务 (紫色方框) 由 Hadoop YARN 管理调度.  

