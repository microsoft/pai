# Hadoop AI 增强
## 概述 ##

我们给 Hadoop 增加了 GPU 支持，增强其对 AI job 的调度性能。
目前，YARN-3926 也将 GPU 作为可数资源（Countable Resource），支持 GPU 调度。
然而，深度学习任务中，使用不同位置组合的 GPU 将影响 job 的效率。例如，若 GPU 0 和 1 同属于一个 PCI-E 交换机而 GPU 0 和 7 不是，则一个 2-GPU job 使用 GPU {0, 1}，将比使用 GPU {0, 7} 速度更快，

我们给 Hadoop 2.7.2 添加了 GPU 支持以实现细粒度的 GPU 位置调度。

我们增加了一个 64 位的 Bit-map 作为 YARN 资源，该 Bit-map 能够表示每个节点的 GPU 使用率及位置信息。每个节点共 64 个 GPU 位置，当该位置有 GPU 时对应的 Bit-map 位为“1”，否则为“0”。

该 Hadoop AI 增强补丁下载地址： 
https://issues.apache.org/jira/browse/YARN-7481
 

## Linux 下生成 Hadoop-AI 容器

  两种方法：

  **快速生成**：详情请参考 [readme](./hadoop-build/README.md) 
  

   **逐步生成**

  以下为手动生成 Hadoop-AI 容器的高级教程：
 1. Linux 环境准备
 
       默认系统版本为 Ubuntu 16.04，需安装以下依赖：

        sudo apt-get install -y git openjdk-8-jre openjdk-8-jdk maven \
            cmake libtool automake autoconf findbugs libssl-dev pkg-config build-essential zlib1g-dev

        wget https://github.com/google/protobuf/releases/download/v2.5.0/protobuf-2.5.0.tar.gz
        tar xzvf protobuf-2.5.0.tar.gz
        cd protobuf-2.5.0
        ./configure
        make -j $(nproc)
        make check -j $(nproc)
        sudo make install
        sudo ldconfig


 2. 下载 Hadoop AI 增强补丁

     从 https://issues.apache.org/jira/browse/YARN-7481 下载 Hadoop AI 增强补丁 "hadoop-2.7.2-gpu-port.patch" 至本地。
   
 3. 获取 Hadoop 2.7.2 源码     
    
           git clone https://github.com/apache/hadoop.git
           cd hadoop
           git checkout branch-2.7.2
    
 4. 编译官方 Hadoop

    执行命令 `mvn package -Pdist,native -DskipTests -Dtar`
   
    编译官方 Hadoop 的详细步骤在此略过。
    执行下个步骤前请确保以上步骤执行正确。    
   
5. 应用 Hadoop AI 增强补丁
   
    拷贝下载的增强补丁至你的 Linux 编译 Hadoop 的根目录下，运行以下命令：
    ```sh 
   git apply hadoop-2.7.2.port-gpu.patch
   ```
   若看到以下输出则表示补丁应用成功：

        ../../hadoop-2.7.2.port-gpu:276: trailing whitespace.
        ../../hadoop-2.7.2.port-gpu:1630: trailing whitespace.
        ../../hadoop-2.7.2.port-gpu:1631: trailing whitespace.
          public static final long REFRESH_GPU_INTERVAL_MS = 60 * 1000;
        ../../hadoop-2.7.2.port-gpu:1632: trailing whitespace.
        ../../hadoop-2.7.2.port-gpu:1640: trailing whitespace.
                  Pattern.compile("^\\s*([0-9]{1,2})\\s*,\\s*([0-9]*)\\s*MiB,\\s*([0-9]+)\\s*MiB");
        warning: squelched 94 whitespace errors
        warning: 99 lines add whitespace errors.

   
6. 编译 Hadoop-AI
  
        运行命令 `mvn package -Pdist,native -DskipTests -Dtar`
    若以上步骤均正确执行，将会在 `hadoop-dist/target` 文件夹下生成  `hadoop-2.7.2.tar.gz`。
    在[部署 PAI - 准备 dev-box](../pai-management/READ-zh.md#生成-docker-容器) 设置 Hadoop 路径时使用生成的`hadoop-2.7.2.tar.gz`。  
   

## Yarn GPU 接口 ##
1. 将 GPU 和 GPUAttribute 添加到 `yarn_protos` 中作为接口。

    源文件:
    hadoop-yarn-project/hadoop-yarn/hadoop-yarn-api/src/main/proto/yarn_protos.proto
    ```
         message ResourceProto {
           optional int32 memory = 1;
           optional int32 virtual_cores = 2;
           optional int32 GPUs = 3;
           optional int64 GPUAttribute = 4;
         }
    ```

2.  获取 / 设置 GPU 及 GPU 属性接口
 GPU属性，以 Bit-map 表示，使用 `long` 类型存储。
    
    源文件：
hadoop-yarn-project/hadoop-yarn/hadoop-yarn-api/src/main/java/org/apache/hadoop/yarn/api/records/Resource.java  
    ```
         1. public static Resource newInstance(int memory, int vCores, int GPUs, long GPUAttribute) 
         2. public abstract int getGPUs();
         3. public abstract void setGPUs(int GPUs);
         4. public abstract long getGPUAttribute();
         5. public abstract void setGPUAttribute(long GPUAttribute);
    ```
3.  YARN 配置
    
    源文件：
    hadoop-yarn-project/hadoop-yarn/hadoop-yarn-common/src/main/resources/yarn-default.xml
        
        Below are some GPU properties required by the revised yarn Resource Manager (RM).
        ```
            <property>
                <description>The minimum allocation for every container request at the RM,  in terms of GPUs. Requests lower than this will throw an InvalidResourceRequestException. </description>
                <name>yarn.scheduler.minimum-allocation-gpus</name>
                <value>0</value>
            </property>
            <property>
                <description>The maximum allocation for every container request at the RM, in terms of GPUs. Requests higher than this will throw an InvalidResourceRequestException. </description>
                <name>yarn.scheduler.maximum-allocation-gpus</name>
                <value>8</value>
            </property>     
            <property>
                <description>Percentage of GPU that can be allocated  for containers. This setting allows users to limit the amount of  GPU that YARN containers use. Currently functional only on Linux using cgroups. The default is to use 100% of GPU.
                </description>
                <name>yarn.nodemanager.resource.percentage-physical-gpu-limit</name>
                <value>100</value>
            </property>
        ```

## YARN 客户端：GPU 资源请求 ##
GPU 资源请求以下列 Resource 对象的形式发送至 RM（Resource Manager）：
*org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest*, through the call *org.apache.hadoop.yarn.client.api.YarnClientaddContainerRequest*   
   
 有以下几种 GPU 资源请求场景：
       
1. 仅请求 GPU 数量: 

    如果 job 只关心 GPU 的数量，而不关心 GPU 位置，则请求资源实例中的 GPUAttribute 必须设置为 0：

        1.Resource res = Resource.newInstance(requireMem, requiredCPU, requiredGPUs, 0)
        2.Res.setGPUAttribute((long)0)

2. 请求 GPU 位置 （GPUAttribute）

    GPU位置信息存储在64位 Bit-map（long）中，每位表示一个 GPU。 GPU ID 映射至 Bit-map 的方式如下所示：

        1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111
         |                                                                |         | 
         |                                                                |         V
         V                                                                V       gpu:0-3
        gpu:60-63                                                      gpu:8-11
        
    一个带位置信息的请求，该 Bit-map 包含在 Resource 实例中。例如，请求 4 个 GPU，位置要求为 GPU 0-3，相应的 Resource 实例为： 

        ```
        Resource res = Resource.newInstance(requireMem, requiredCPU, 4, 15)
        #4 is the request GPU count.
        15 for “1111” is the GPU locality.
        ```

    若 GPU 位置（GPUAttribute）设置为非 0，则 GPU 数量的设置必须与其对应。否则将不会响应该请求。
 
3. 以节点 / 标签请求

    GPU 同样支持以节点 / 标签信息发起请求，方式与官方 Hadoop 2.7.2 相同。

4. 请求放松（Relax） 

      在 GPU 调度中，Relax 为节点级的，GPU 位置无法放松。例如，需为节点 1 请求 2 个 GPU，GPUAttribute 设置为 3（二进制为 11，表示 GPU 0，1），在容器请求中允许放松时，若节点 1 的 GPU 0 或 1 不可用，则 YARN RM 会放松至其他节点的 GPU 0,1（若二者皆可用）。但是 YARN RM 不会放松至节点 1 的其他 GPU 位置上，也不会放松至其他节点的除了 0,1 位置的其他 GPU。

## Resource manger ##

1. GPU 分配算法

    a. 若指定了 GPU 位置，算法将会对满足要求的节点执行一个简单的匹配，RM 只会返回一个资源完全符合要求的容器。
    b. 如果没有GPU位置请求，算法只会将请求的 GPU 数与节点的空闲 GPU 数量进行比较。

2. Scheduler

    CapacityScheduler, FairScheduler, and FifoScheduler 都进行了修改以支持 GPU 调度。在 FairScheduler 中，也支持抢占机制。

3. Resource Calculator 

    *DominantResourceCalculator* 在混合资源环境下进行 GPU 计数。同时创建了一个新的 Calculator *org.apache.hadoop.yarn.api.records.Resource.GPUResourceCalculator* 仅计算 GPU 的资源。


## Node Manager 插件

  源文件： org.apache.hadoop.yarn.util.LinuxResourceCalculatorPlugin
  
  在 Node Manager （NM）中，启动服务时，通过运行 `nvidia-smi` 命令获取节点的 GPU 容量，该步骤仅在NM 初始化时进行。
NM 心跳（heartbeat）不报告 Hadoop 2.7.2 中的资源利用状态。 在 Hadoop 2.8 或更高版本中，NM 心跳会报告本地资源信息，我们将考虑在心跳中添加更多GPU状态。

## Web 应用   ##
 GPU 计数和 GPU 属性信息也显示在 Hadoop 网页中。 用户可以在应用程序信息页面中查看总容量、使用率、空闲情况等。 用户还可以在“节点信息”页面中检查每个节点以 Bit-map 表示的 GPU 使用情况。