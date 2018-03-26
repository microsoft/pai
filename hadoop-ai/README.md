# Hadoop AI Enhancement
## Overview ##

We enhance Hadoop with GPU support for better AI job scheduling. 
Currently, YARN-3926 also supports GPU scheduling, which treats GPU as countable resource. 
However, GPU placement is very important to deep learning job for better efficiency. 
For example, a 2-GPU job runs on gpu {0,1} could be faster than run on gpu {0, 7}, 
if GPU 0 and 1 are under the same PCI-E switch while 0 and 7 are not. 

We add the GPU support to Hadoop 2.7.2 to enable GPU locality scheduling, which support fine-grained GPU placement. 
A 64-bits bitmap is added to yarn Resource, which indicates both GPU usage and locality information in a node
 (up to 64 GPUs per node). ‘1’ means available and ‘0’ otherwise in the corresponding position of the bit.  

the AI enhancement patch was upload to: 
https://issues.apache.org/jira/browse/YARN-7481
 

## How to Build in Linux environment

  there are two methods to do build:
  **quick build**: Please refer to this [readme](./hadoop-build/README.md) to get the quick way to do the build.
  

   **Step by step build**

   Below are step-by-step build for advance user:

 1. Prepare linux enviroment
 
       Ubuntu 16.04 is the default system. This dependencies must be installed:

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
 

 2. Download hadoop AI Enhancement

    Please download "hadoop-2.7.2-gpu-port.patch" from https://issues.apache.org/jira/browse/YARN-7481 to your local.
   
 3. Get hadoop 2.7.2 source code     
    
	       git clone https://github.com/apache/hadoop.git
	       cd hadoop
	       git checkout branch-2.7.2
	
 4. Build the official hadoop in your linux develop environment

   	Run command “mvn package -Pdist,native -DskipTests -Dtar”
   
    Please make sure you can pass result before move to next steps, you can search the internet to find how to set up the environment and build the official hadoop.
   
   
5. Apply hadoop AI enhancement patch file
   
    copy the downloaded file into your linux hadoop root folder and run:

    git apply hadoop-2.7.2.port-gpu.patch

    if you see the output below you have successfully applied this patch

		../../hadoop-2.7.2.port-gpu:276: trailing whitespace.
		../../hadoop-2.7.2.port-gpu:1630: trailing whitespace.
		../../hadoop-2.7.2.port-gpu:1631: trailing whitespace.
		  public static final long REFRESH_GPU_INTERVAL_MS = 60 * 1000;
		../../hadoop-2.7.2.port-gpu:1632: trailing whitespace.
		../../hadoop-2.7.2.port-gpu:1640: trailing whitespace.
		          Pattern.compile("^\\s*([0-9]{1,2})\\s*,\\s*([0-9]*)\\s*MiB,\\s*([0-9]+)\\s*MiB");
		warning: squelched 94 whitespace errors
		warning: 99 lines add whitespace errors.

   
6. Build hadoop AI enhancement
  
     	Run command “mvn package -Pdist,native -DskipTests -Dtar”

     you will get the `hadoop-2.7.2.tar.gz` under `hadoop-dist/target` folder if everything is good. 

     use `hadoop-2.7.2.tar.gz` to set your hadoop path to deploy into your cluster.  
   

## Yarn GPU Interface ##
1. Add GPUs and GPUAttribute into `yarn_protos` as interface.

    sourcefile:
    hadoop-yarn-project/hadoop-yarn/hadoop-yarn-api/src/main/proto/yarn_protos.proto
    ```
		 message ResourceProto {
		   optional int32 memory = 1;
		   optional int32 virtual_cores = 2;
		   optional int32 GPUs = 3;
		   optional int64 GPUAttribute = 4;
		 }
    ```

2.	Interface to get/set the GPU and GPU attribute

    GPUAttribute, the bitmap, is represented as a long variable. 
    
    sourcefile: hadoop-yarn-project/hadoop-yarn/hadoop-yarn-api/src/main/java/org/apache/hadoop/yarn/api/records/Resource.java	
    ```
		 1. public static Resource newInstance(int memory, int vCores, int GPUs, long GPUAttribute) 
		 2. public abstract int getGPUs();
		 3. public abstract void setGPUs(int GPUs);
		 4. public abstract long getGPUAttribute();
		 5. public abstract void setGPUAttribute(long GPUAttribute);
    ```
3.	Yarn configuration
    
        sourcefile: hadoop-yarn-project/hadoop-yarn/hadoop-yarn-common/src/main/resources/yarn-default.xml
        
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

## Yarn Client: GPU Resource Request ##

   The GPU request is sent to RM in a Resource object described in *org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest*, through the call *org.apache.hadoop.yarn.client.api.YarnClientaddContainerRequest*   
   
   There are several GPU request scenarios.
      
1. Request GPU by count only: 

    If a job only care about the number of GPU, not GPU placement, GPUAttribute must set to 0 in the request resource instance. 

		1.Resource res = Resource.newInstance(requireMem, requiredCPU, requiredGPUs, 0)
		2.Res.setGPUAttribute((long)0)

2. Request GPU with locality (GPU attribute):

    The GPU locality information is stored in a 64-bit bitmap (long), each bit represents a GPU. The GPU IDs map to the bitmap as follows.

		1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111 1111
		 |                                                                |         | 
		 |                                                                |         V
		 V                                                                V       gpu:0-3
		gpu:60-63                                                      gpu:8-11
		
	In a locality-aware request, the bitmap is included in the Resource instance. For example, If 4 GPUs are required, and the GPU placement requirement is GPU 0-3, the corresponding request instance will look like:		
		
		```
		Resource res = Resource.newInstance(requireMem, requiredCPU, 4, 15)
		#4 is the request GPU count.
		15 for “1111” is the GPU locality.
		```

     If the GPU attribute is set to none-zero, the requested GPU count must match with it. Otherwise the request will not success. 

3. Request with Node/Label

    This is also supported in GPU, and the behavior is the same as the official Hadoop 2.7.2.

4. Request with Relax 
  
	In GPU scheduling, the Relax is node level relax, GPU locality cannot be relaxed. 
	For example, if it is requested for Node 1 with a GPU count 2, GPU attribute set to 3 for GPU 0, 1.
	When Relax is enabled in the container request, if Node 1’s GPU 0 or 1 is unavailable, 
	yarn RM might relax to other node's GPU 0 and 1 (if both are available). 
	But yarn RM will not relax to other GPUs in Node 1, or to GPUs other than 0 and 1 in other nodes. 

## Resource manger ##

1. GPU allocation algorithm

	a.	If GPU locality specified, the algorithm performs a simple “match” for the requested locality with Nodes’ GPU attribute. RM will only return a container with the resource exactly matches the requirement. 

	b.	If requested without GPU locality, the algorithm only compares the requested GPU count with Nodes’s free GPU count.
	
2. Scheduler

	CapacityScheduler, FairScheduler, and FifoScheduler are all revised to support GPU scheduling. In the FairScheduler, preemption is also supported. 

3. Resource Calculator 

	The GPU count is considered in *DominantResourceCalculator* for the mix resource environment. 
	Meanwhile,  a new Calculator *org.apache.hadoop.yarn.api.records.Resource.GPUResourceCalculator* is created to only calculate resource by GPU.   


## Node Manager Plugin ##

  sourcefile: org.apache.hadoop.yarn.util.LinuxResourceCalculatorPlugin

   In the node manager, the node's GPU capacity is collected by running a nvidia-smi command when the Node Manager service starts. We only collect the GPU capacity during NM's initialization.  
   Node manager heartbeat does not report resource utilization status in Hadoop 2.7.2. In Hadoop 2.8 or later, Node Manager heartbeat is reporting the local resource information, we will consider adding more GPU status in the heartbeat.

## Web apps   ##

   The GPU count and GPU attribute information are also displayed in the Hadoop web. User can check the overall capacity, used, free information in app information page. User can also check each node’s GPUs utilization information in bitmap format in Node Information page. 

   

