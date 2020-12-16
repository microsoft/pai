# Debug job with MT Web Portal
This article focuses on debugging Spark jobs with web portal. For streaming jobs, please see [Streaming job debugging](./StreamingDebuggability.md).

Debugging and optimization info resides in job detail pages in **[Jobs](./Jobs.md)**. Following section will cover
* Debugging and optimization tabs
    * <a href="#JobGraph"> Job Graph </a> - visulized job execution
    * <a href="#Stage"> Stages </a> - Stage metrics, task scatter, task and executor details per stage
    * <a href="#Err"> Errors </a> - grouped errors
    * <a href="#vCore"> vCore Efficiency </a> - how many vCores have been request, located and used
    * <a href="#Runtime"> Runtime </a> - max, min and average of task metrics in each stage
    * <a href="#Executor"> Executors </a> - Executor scatter, executor details
    * <a href="#Diag"> Diagnostics </a> - Data skew and time skew 
   
* <a href="#Case"> Case study </a> 
  
The information shown below come from the last run. If there are any retries, to view history retry data, user can select from the ‘Retry Attempt’ drop-down box, page information will be refreshed accordingly.

You can get an overview on how job is executed, <a href="#JobGraph"> Job Graph </a> tab is the right place to go. 

If there are failed stages, you can click the failed stage and be directed to <a href="#Stage"> Stages </a> tab, where you can get information of tasks under this stage.  

You can also go directly to <a href="#Err"> Errors </a> tab, where errors are grouped in a manner that are easy to debug.


<a name="JobGraph" id = "JobGraph"></a>
## Job Graph tab
Job graph visulizes how job is executed, and how stages are interlinked. 
* Each column stands for a job; each block stands for a stage, with the following details
   * Stage ID
   * Description of stage
   * Total task number (including reattemtped ones)
   * Data read: sum of input and shuffle read sizes
   * Data write: sum of output and shuffle read sizes
   * Execution time: time between the first task attempt to the last task attempt
   * Row account: sum of niput, output, shuffle read and shuffle records
* Each stage is colored coded with status
* Stages can be filtered by job ID (all stages will be displayed as default)
* Scroll mouse to get a zoomed job graph
* Click through stage blocks to go to <a href="#Stage"> Stage tab </a> for stage details<br>
<img src="./images/jobgraph.png" width = 820>

<a name="Stage" id = "Stage"></a>
## Stages tab
In stage tab, 
* Select stage by stage ID
* Task statistics table in the stage is folded by default. Click to unfold the table<br>
<img src="./images/stage1.png" width = 820>
* Task scatter shows execution time vs. size of tasks in the stage. Hover mouse to see more details; click and drag using mouse to zoom out selected graph area; click legends to hide or unhide each curve<br>
<img src="./images/stage2.png" width = 820>
* Tables below list details of tasks in the stage. Errors occured in tasks are also listed here.<br>
<img src="./images/stage3.png" width = 820>
* In the executor detail pop-up window
   * Select executor by executo ID. Stdout and stderr logs are next to drop down list to be opened for view.  
   * Task scatter shows execution time vs. size of tasks in the executor. Hover mouse to see more details; click and drag using mouse to zoom out selected graph area.<br>>
<img src="./images/taskscatterExecutor.png" width = 820>
   * Executor vCore plotting shows number of vCores used in the executor. Hover mouse to see more details; click and drag using mouse to zoom out selected graph area; click legends to hide or unhide each curve<br>
<img src="./images/executorvcore.png" width = 820>
   * Task run time shows how tasks are executed in sequence in the executor. Hover mouse to see more details; click and drag using mouse to zoom out selected graph area.
<img src="./images/taskruntimeexecutor.png" width = 820>

<a name="Err" id = "Err"></a>
## Errors tab
Error tab aggregates tasks with similar error message. Errors are sorted by their number of occurrences. For each error, the table below it shows the tasks that raise this error.<br>
For each task, user can click its executor id to get its detailed information.<br>
User can also click the stdout and stderr to link to the corresponding output and error msg.
 <br>
<img src="./images/error.png" width = 820>

<a name="vCore" id = "vCore"></a>
## vCore Efficiency tab
vCore efficiency shows how efficienctly your resources have been utilized. 
* vCore efficiency plotting provids counts of
   * Requested vCore
   * Allocated vCore
   * Used vCore<br>
* The higher the ratio of User vCore vs. Allocated vCore, the higher vCore efficiency you job has
* Hover mouse to see more details; click and drag using mouse to zoom out selected graph area; click legends to hide or unhide each curve<br>
<img src="./images/vcoreeff.png" width = 820>

<a name="Runtime" id = "Runtime"></a>
## Runtime tab
Runtime illustrates the following metrics for max, min and average of tasks in each stage.<br>
* Task metrics can be selected from drop down list
* Hover mouse to see more details; click and drag using mouse to zoom out selected graph area; click legends to hide or unhide each bar<br>
<img src="./images/runtime.png" width = 820>



<a name="Executor" id = "Executor"></a>
## Executors tab
Executor tab provides overview of executors in the application.
* Task scatter shows execution time vs. size of tasks in all executors. Hover mouse to see more details; click and drag using mouse to zoom out selected graph area.<br>
<img src="./images/executor1.png" width = 820>
* Tables below list details of executors.<br>
<img src="./images/executor2.png" width = 820>

<a name="Diag" id = "Diag"></a>
## Diagnostics tab
Diagnostics tab provides analysis for data skew and time skew. Definition of both can be adjusted. We wil provide suggestions later.
<img src="./images/diagnostics.png" width = 820>



<a name="Case" id = "Case"></a>
## Case study
(to be updated)