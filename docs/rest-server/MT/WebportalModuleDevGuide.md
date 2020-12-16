# MT module develop guide
*This doc target to help user to develop both Aether module and Webportal module. This doc is still under organization, currently only for team internal use.*


## Module System Remain Parameter

| Hemera | Webportal | Notes |
| ----- | ----- | ----- |
|%CLUSTER% | subCluster | Specify job running subcluster |
|JobNodeLabel | JobNodeLabel | Specify job nodelabel |
|JobQueue | JobQueue | Specify job queue |
|FrameworkName | FrameworkName  | Specify the jobwrapper job name |
|JobGroupId| JobGroupId | Specify the job group id  |
|JobDriverMemGB | JobDriverMemGB  | Specify the jobwrapper memory |
|JobDriverVCores| JobDriverVCores | Specify the jobwrapper vcores |

## How to expose message to job exit diagnostics?
In module script, you can write your exit diagnostics message to %LOG_DIRS%/exit_diagnostics_file. Please close the file before exit your script. We prefer below style<br>
For example: echo 'Error_message' > %LOG_DIRS%/exit_diagnostics_file

## How to leverage group id in module?
For launcher job please add "{"GroupTag":"$Env:JOB_GROUP_TAG"}" to description field.
For Spark job please add $JobName = $Env:JOB_GROUP_TAG + '_' + $JobName in your job name;
