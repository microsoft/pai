# Submit jobs via MT Web Portal

Multiple modules are provided to reduce your efforts to deploy jobs to MT. MT clusters are deployed in AP. It is not easy for users to submit jobs from local environments. <br> 

MT mainly supports two kinds of workload: Launcher jobs and Spark jobs.

**Launcher jobs** can run in executable packages (e.g. exe, Jar, python, power shell script etc.) and docker images.
<br>

  * Use [Run Multiple Exe](use/WebPortal/../../[Multitenancy]&#32;Run&#32;Multiple&#32;Exe&#32;New/[Multitenancy]&#32;Run&#32;Multiple&#32;Exe&#32;New.md) module to submit your launcher job, if 
    * Your launcher job does not have dependency libs (e.g. power shell script), or<br>
    * Your launcher job has dependency libs but they can be packaged together with the executable files into one package (e.g. exe, jar); or<br>
    * Your jobs are python jobs which only depends on basic python running environments and does not have extra dependency packages. <br>
<br>

  * Use [Run Multiple Docker](use/WebPortal/../../[Multitenancy]&#32;Run&#32;Multiple&#32;Docker&#32;New/[Multitenancy]&#32;Run&#32;Multiple&#32;Docker&#32;New.md) module to submit your job to MT if
    * Your launcher jobs have dependency libraries, but the dependency libs can not be packaged into a single executable package nor directly added into ‘PATH’ environment variables to take effect.<br>
      
      In this case, package them into a docker image and use [Run Multiple Docker](use/WebPortal/../../[Multitenancy]&#32;Run&#32;Multiple&#32;Docker&#32;New/[Multitenancy]&#32;Run&#32;Multiple&#32;Docker&#32;New.md) module. 

**Spark jobs** can run under Java runtime, python and .net framework. 
<br>

  *  If your Spark jobs are written in **Java or scala**, use [Run Spark jobs on MT](use/WebPortal/../../[Multitenancy]&#32;SparkOnYarn/[Multitenancy]&#32;SparkOnYarn.md) module to submit your jobs.
<br>

  *  If your Spark jobs are written in **c#**, use [Run Spark.Net on MT](use/WebPortal/../../[Multitenancy]&#32;Spark.Net&#32;On&#32;MT/[Multitenancy]Spark.Net&#32;On&#32;MT.md) module to submit your jobs. 
<br>

  * If your Spark jobs are written in **python**, use [Run PySpark on MT](use/Spark/submitPySpark.html) module to submit your jobs.

After selecting a proper module, you can submit your own jobs following [Job submision](./SubmitExample.md).






