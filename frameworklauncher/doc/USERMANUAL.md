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

# Microsoft FrameworkLauncher User Manual

## <a name="Concepts">Concepts</a>

* Different **TaskRoles** compose a **Framework**
* Same **Tasks** compose a **TaskRole**
* A **User Service** executed by all **Tasks** in a **TaskRole**

## <a name="QuickStart">Quick Start</a>
1. **Prepare Framework**
    1. **Upload Framework Executable to HDFS**

       Upload the [Example Framework Executable](./example/ExampleFramework.sh) to HDFS:

            hadoop fs -mkdir -p /ExampleFramework/
            hadoop fs -put -f ExampleFramework.sh /ExampleFramework/
    2. **Write Framework Description File**

        Just use the [Example Framework Description File](./example/ExampleFramework.json).

            Example Framework Description Explanation:
            • The Example Framework with Version 1 contains 1 TaskRole named LRSMaster.
            • LRSMaster contains 2 Tasks and they will be executed for LRSMaster's TaskService.
            • LRSMaster's TaskService with Version 1 is defined by its EntryPoint, SourceLocations and Resource.
            • The EntryPoint and SourceLocations defines the Service's corresponding Executable which needs to be ran inside Containers. 
            • The Resource defines the Container Resource Guarantee / Limitation.

2. **Launch Framework**

    *Launcher Service need to be started before Launch Framework.*

    *See [README](../README.md) to Start Launcher Service*

    *See [Root URI](#RootURI) to get {LauncherAddress}*

    HTTP PUT the Framework Description File as json to:

        http://{LauncherAddress}/v1/Frameworks/ExampleFramework

    For example, with [curl](https://curl.haxx.se/), you can execute below cmd line:

        curl -X PUT http://{LauncherAddress}/v1/Frameworks/ExampleFramework -d @ExampleFramework.json --header "Content-Type: application/json"

3. **Monitor Framework**

    Check all the Requested Frameworks by:

        http://{LauncherAddress}/v1/Frameworks

    Check ExampleFramework by:

        http://{LauncherAddress}/v1/Frameworks/ExampleFramework

## <a name="Architecture">Architecture</a>
<p style="text-align: left;">
  <img src="img/Architecture.png" title="Architecture" alt="Architecture" />
</p>

**LauncherInterfaces**:
* RestAPI
* Submit Framework Description

**LauncherService**:
* One Central Service
* Manages all Frameworks for the whole Cluster.

**LauncherAM**:
* Per-Framework Service
* Manage Tasks for a single Framework by customized feature requirement

## <a name="Pipeline">Pipeline</a>
<p style="text-align: left;">
  <img src="img/Pipeline.png" title="Pipeline" alt="Pipeline" />
</p>

## <a name="Configuration">Configuration</a>
Launcher Service can be configured by [LauncherConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/LauncherConfiguration.java). You can check the Type, Specification and FeatureUsage inside it.

And we also provide a default configuration for you to refer: [Default LauncherConfiguration File](../conf/frameworklauncher.yml).

## <a name="RestAPI">RestAPI</a>
### <a name="Guarantees">Guarantees</a>
* All APIs are IDEMPOTENT and STATELESS, to allowed trivial Work Preserving Client Restart.
In other words, User do not need to worry about call one API multiple times by different Client instance (such as Client Restart, etc).
* All APIs are DISTRIBUTED THREAD SAFE, to allow multiple distributed Client instances to access.
In other words, User do not need to worry about call them at the same time in Multiple Threads/Processes/Nodes.

### <a name="BestPractices">Best Practices</a>
* LauncherService can only handle a finite, limited request volume. User should try to minimize its overall request frequency and payload, so that the LauncherService is not overloaded. To achieve this, User can centralize requests, space out requests, filter respond and so on.
* Completed Frameworks will ONLY be retained in recent FrameworkCompletedRetainSec, in case Client miss to delete the Framework after FrameworkCompleted. One exclusion is the Framework Launched by DataDeployment, it will be retained until the corresponding FrameworkDescriptionFile deleted in the DataDeployment. To avoid missing the CompletedFrameworkStatus, the polling interval seconds of Client should be less than FrameworkCompletedRetainSec. Check the FrameworkCompletedRetainSec by [GET LauncherStatus](#GET_LauncherStatus).

### <a name="RootURI">Root URI (LauncherAddress)</a>

Configure it as webServerAddress inside [LauncherConfiguration File](../conf/frameworklauncher.yml).

### <a name="Types">Types</a>
* Refer [Data Model](#DataModel) for the Type of HTTP Request and Response.

### <a name="Common_Request_Headers">Common Request Headers</a>
| Headers | Description |
|:---- |:---- |
| UserName | Specifies which User send the Request. It is effective iff webServerAclEnable is true, see [Framework ACL](#Framework_ACL). |

### <a name="APIDetails">API Details</a>
#### <a name="PUT_Framework">PUT Framework</a>
**Request**

    PUT /v1/Frameworks/{FrameworkName}

Type: application/json

Body: [FrameworkDescriptor](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkDescriptor.java)

**Description**

Add a NOT Requested Framework or Update a Requested Framework.
1. Add a NOT Requested Framework: Framework will be Added and Launched (Now it is Requested).
2. Update a Requested Framework:
    1. If FrameworkVersion unchanged:
        1. Framework will be Updated to the FrameworkDescription on the fly (i.e. Work Preserving).
        2. To Update Framework on the fly, it is better to use the corresponding PartialUpdate (such as [PUT TaskNumber](#PUT_TaskNumber)) than PUT the entire FrameworkDescription here. Because, partially update the FrameworkDescription can avoid the Race Condition (or Transaction Conflict) between two PUT Requests. Besides, the behaviour is undefined when change parameters in FrameworkDescription which is not supported by PartialUpdate.
    2. Else:
        1. Framework will be NonRolling Upgraded to new FrameworkVersion. (i.e. Not Work Preserving).
        2. NonRolling Upgrade can be used to change parameters in FrameworkDescription which is not supported by PartialUpdate (such as Framework Queue).
        3. NonRolling Upgrade should be triggered by change FrameworkVersion, instead of DELETE then PUT with the same FrameworkVersion.
3. User is responsible and free to specify the FrameworkName of the Framework, however, the FrameworkName should respect the [Framework ACL](#Framework_ACL).
4. After Accepted Response, its corresponding Status (such as FrameworkStatus and AggregatedFrameworkStatus) exists immediately, too. However, the Status may not be updated according to the Request (FrameworkDescriptor) immediately. So, to check whether it has been updated, Client still needs to poll the GET Status APIs.

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| Accepted(202) | NULL | The Request has been recorded for backend to process, not that the processing of the Request has been completed. |
| BadRequest(400) | ExceptionMessage | The Request validation failed. So, Client is expected to not retry for this non-transient failure and then correct the Request. |
| Forbidden(403) | ExceptionMessage | The Request authorization failed. So, Client is expected to not retry for this non-transient failure and then correct the Request or ask Administrator to grant the Request privilege. This Response may happen only if webServerAclEnable is true, see [Framework ACL](#Framework_ACL). |
| TooManyRequests(429) | ExceptionMessage | The Request is rejected due to the New Total TaskNumber will exceed the Max Total TaskNumber if backend accepted it. So, the Client is expected to retry for this transient failure or migrate the whole Framework to another Cluster. |
| ServiceUnavailable(503) | ExceptionMessage | The Request cannot be recorded for backend to process. In our system, this only happens when target Cluster's Zookeeper is down for a long time. So, the Client is expected to retry for this transient failure or migrate the whole Framework to another Cluster. |


#### <a name="DELETE_Framework">DELETE Framework</a>
**Request**

    DELETE /v1/Frameworks/{FrameworkName}

**Description**

Delete a Framework, no matter it is Requested or not.

Notes:
1. Framework will be Stopped and Deleted (Now it is NOT Requested).
2. After Accepted Response, its corresponding Status does not exist immediately, too.
3. Only recently completed Frameworks will be kept, if Client miss to DELETE the Framework after FrameworkCompleted. One exclusion is the Framework Launched by DataDeployment, it will be kept until the corresponding FrameworkDescriptionFile deleted in the DataDeployment.

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| Accepted(202) | NULL | Same as [PUT Framework](#PUT_Framework) |
| BadRequest(400) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| Forbidden(403) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_FrameworkStatus">GET FrameworkStatus</a>
**Request**

    GET /v1/Frameworks/{FrameworkName}/FrameworkStatus

**Description**

Get the FrameworkStatus of a Requested Framework

Recipes:
1. User Level RetryPolicy (Based on FrameworkState, ApplicationExitCode, ApplicationDiagnostic, ApplicationExitType)
2. Directly Monitor Underlay YARN Application by YARN CLI or RestAPI (Based on ApplicationId or ApplicationTrackingUrl)

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [FrameworkStatus](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkStatus.java) | |
| NotFound(404) | ExceptionMessage | Specified Framework has not been Requested yet. So, Client is expected to not retry for this non-transient failure and then PUT the corresponding Framework first. |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="PUT_TaskNumber">PUT TaskNumber</a>
**Request**

    PUT /v1/Frameworks/{FrameworkName}/TaskRoles/{TaskRoleName}/TaskNumber

Type: application/json

Body: [UpdateTaskNumberRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/UpdateTaskNumberRequest.java)

**Description**

Update TaskNumber for a Requested Framework

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| Accepted(202) | NULL | Same as [PUT Framework](#PUT_Framework) |
| BadRequest(400) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| Forbidden(403) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| NotFound(404) | ExceptionMessage | Same as [GET FrameworkStatus](#GET_FrameworkStatus) |
| TooManyRequests(429) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="PUT_ExecutionType">PUT ExecutionType</a>
**Request**

    PUT /v1/Frameworks/{FrameworkName}/ExecutionType

Type: application/json

Body: [UpdateExecutionTypeRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/UpdateExecutionTypeRequest.java)

**Description**

Update ExecutionType for a Requested Framework

Notes:
1. It is ignored to change Framework ExecutionType from STOP to START, if previous STOP has already caused the Framework of current FrameworkVersion entered FINAL_STATES, i.e. FRAMEWORK_COMPLETED. So, to ensure starting the Framework again after STOP, just change the FrameworkVersion instead.

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| Accepted(202) | NULL | Same as [PUT Framework](#PUT_Framework) |
| BadRequest(400) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| Forbidden(403) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| NotFound(404) | ExceptionMessage | Same as [GET FrameworkStatus](#GET_FrameworkStatus) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="PUT_MigrateTask">PUT MigrateTask</a>
**Request**

    PUT /v1/Frameworks/{FrameworkName}/MigrateTasks/{ContainerId}

Type: application/json

Body: [MigrateTaskRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/MigrateTaskRequest.java)

**Description**

Migrate a Task from current Container to another Container for a Requested Framework
And new Container and old Container will satisfy the AntiAffinityLevel constraint.

Notes:
1. User is responsible for implement Health/Perf Measurement of the Service based on Monitoring TaskStatuses or self-contained communication. And if found some Health/Perf degradations, User can migrate it by calling this API with corresponding ContainerId as parameter.
2. Currently, only support Any AntiAffinityLevel.

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| Accepted(202) | NULL | Same as [PUT Framework](#PUT_Framework) |
| BadRequest(400) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| Forbidden(403) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| NotFound(404) | ExceptionMessage | Same as [GET FrameworkStatus](#GET_FrameworkStatus) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="PUT_ApplicationProgress">PUT ApplicationProgress</a>
**Request**

    PUT /v1/Frameworks/{FrameworkName}/ApplicationProgress

Type: application/json

Body: [OverrideApplicationProgressRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/OverrideApplicationProgressRequest.java)

**Description**

Update ApplicationProgress for a Requested Framework

Notes:
1. If User does not call this API. Default ApplicationProgress is used, and it is calculated as CompletedTaskCount / TotalTaskCount.
2. User is responsible for implement Progress Measurement of the Service based on Monitoring Task logs or self-contained communication. And then feedback the Progress by calling this API to Override the default ApplicationProgress.

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| Accepted(202) | NULL | Same as [PUT Framework](#PUT_Framework) |
| BadRequest(400) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| Forbidden(403) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| NotFound(404) | ExceptionMessage | Same as [GET FrameworkStatus](#GET_FrameworkStatus) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_Framework">GET Framework</a>
**Request**

    GET /v1/Frameworks/{FrameworkName}

**Description**

Get the FrameworkInfo of a Requested Framework

FrameworkInfo = SummarizedFrameworkInfo + AggregatedFrameworkRequest + AggregatedFrameworkStatus

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [FrameworkInfo](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkInfo.java) | |
| NotFound(404) | ExceptionMessage | Same as [GET FrameworkStatus](#GET_FrameworkStatus) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_Frameworks">GET Frameworks</a>
**Request**

    GET /v1/Frameworks

| QueryParameter | Description |
|:---- |:---- |
| UserName | Filter the result to only return Frameworks whose UserName equals the given value. |

**Description**

Get the SummarizedFrameworkInfos of all Requested Frameworks

A Framework's SummarizedFrameworkInfo consists selected fields from its Status and Request

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [SummarizedFrameworkInfos](../src/main/java/com/microsoft/frameworklauncher/common/model/SummarizedFrameworkInfos.java) | |
| BadRequest(400) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| Forbidden(403) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_AggregatedFrameworkStatus">GET AggregatedFrameworkStatus</a>
**Request**

    GET /v1/Frameworks/{FrameworkName}/AggregatedFrameworkStatus

**Description**

Get the AggregatedFrameworkStatus of a Requested Framework

AggregatedFrameworkStatus = FrameworkStatus + all TaskRoles' (TaskRoleStatus + TaskStatuses)

TaskStatuses Recipes:
1. ServiceDecovery (Based on TaskRoleName, ContainerHostName, ContainerIPAddress, ServiceId)
2. TaskLogForwarding (Based on ContainerLogHttpAddress)
3. MasterSlave and MigrateTask (Based on ContainerId)
4. DataPartition (Based on TaskIndex) (Note TaskIndex will not change after Task Restart, Migrated or Upgraded)

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [AggregatedFrameworkStatus](../src/main/java/com/microsoft/frameworklauncher/common/model/AggregatedFrameworkStatus.java) | |
| NotFound(404) | ExceptionMessage | Same as [GET FrameworkStatus](#GET_FrameworkStatus) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_FrameworkRequest">GET FrameworkRequest</a>
**Request**

    GET /v1/Frameworks/{FrameworkName}/FrameworkRequest

**Description**

Get the FrameworkRequest of a Requested Framework

Current [FrameworkDescriptor](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkDescriptor.java) for the Framework is included in FrameworkRequest and it can reflect latest updates.

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [FrameworkRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkRequest.java) | |
| NotFound(404) | ExceptionMessage | Same as [GET FrameworkStatus](#GET_FrameworkStatus) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_AggregatedFrameworkRequest">GET AggregatedFrameworkRequest</a>
**Request**

    GET /v1/Frameworks/{FrameworkName}/AggregatedFrameworkRequest

**Description**

Get the AggregatedFrameworkRequest of a Requested Framework

AggregatedFrameworkRequest = FrameworkRequest + all other feedback Request

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [AggregatedFrameworkRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/AggregatedFrameworkRequest.java) | |
| NotFound(404) | ExceptionMessage | Same as [GET FrameworkStatus](#GET_FrameworkStatus) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_LauncherRequest">GET LauncherRequest</a>
**Request**

    GET /v1/LauncherRequest

**Description**

Get the LauncherRequest

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [LauncherRequest](../src/main/java/com/microsoft/frameworklauncher/common/model/LauncherRequest.java) | |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_LauncherStatus">GET LauncherStatus</a>
**Request**

    GET /v1/LauncherStatus

**Description**

Get the LauncherStatus

Current [LauncherConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/LauncherConfiguration.java) is included in LauncherStatus and it can reflect latest updates.

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [LauncherStatus](../src/main/java/com/microsoft/frameworklauncher/common/model/LauncherStatus.java) | |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="PUT_ClusterConfiguration">PUT ClusterConfiguration</a>
**Request**

    PUT /v1/LauncherRequest/ClusterConfiguration

Type: application/json

Body: [ClusterConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/ClusterConfiguration.java)

**Description**

Update the ClusterConfiguration for all Frameworks on the fly

Besides the cluster information provided by YARN, Administrator can use this API to provide external information about current cluster configuration, which helps Launcher to schedule Task based on that. And below features depend on it:
1. taskGpuType

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| Accepted(202) | NULL | Same as [PUT Framework](#PUT_Framework) |
| BadRequest(400) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| Forbidden(403) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_ClusterConfiguration">GET ClusterConfiguration</a>
**Request**

    GET /v1/LauncherRequest/ClusterConfiguration

**Description**

Get the ClusterConfiguration

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [ClusterConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/ClusterConfiguration.java) | |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="PUT_AclConfiguration">PUT AclConfiguration</a>
**Request**

    PUT /v1/LauncherRequest/AclConfiguration

Type: application/json

Body: [AclConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/AclConfiguration.java)

**Description**

Update the AclConfiguration

It takes effects immediately after the Response iff webServerAclEnable is true, see [Framework ACL](#Framework_ACL).

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | NULL | |
| BadRequest(400) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| Forbidden(403) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


#### <a name="GET_AclConfiguration">GET AclConfiguration</a>
**Request**

    GET /v1/LauncherRequest/AclConfiguration

**Description**

Get the AclConfiguration

**Response**

| HttpStatusCode | Body | Description |
|:---- |:---- |:---- |
| OK(200) | [AclConfiguration](../src/main/java/com/microsoft/frameworklauncher/common/model/AclConfiguration.java) | |
| ServiceUnavailable(503) | ExceptionMessage | Same as [PUT Framework](#PUT_Framework) |


## <a name="DataModel">DataModel</a>
You can check the Type, Specification and FeatureUsage inside Launcher Data Model:

    ../src/main/java/com/microsoft/frameworklauncher/common/model/*

For example:

A Framework is Defined and Requested by FrameworkDescriptor data structure. To find the feature usage inside FrameworkDescriptor, you can refer the comment inside [FrameworkDescriptor](../src/main/java/com/microsoft/frameworklauncher/common/model/FrameworkDescriptor.java).


## <a name="EnvironmentVariables">EnvironmentVariables</a>
Launcher sets up below EnvironmentVariables for each User Service to use:
1. Used to locate itself during the whole Framework life cycle. So, they will not be changed after Migration or Restart.

| EnvironmentVariable | Description |
|:---- |:---- |
| LAUNCHER_ADDRESS | |
| FRAMEWORK_NAME | |
| FRAMEWORK_VERSION | |
| TASKROLE_NAME | |
| TASK_INDEX | |
| SERVICE_NAME | |
| SERVICE_VERSION | |

2. Used to locate itself during a specific execution attempt. So, they will be changed to a different one after Migration or Restart.

| EnvironmentVariable | Description |
|:---- |:---- |
| APP_ID | Framework's current associated Application ID. |
| CONTAINER_ID | Task's current associated Container ID. |

3. Used to get the assigned Resource, only set when corresponding feature is enabled.

| EnvironmentVariable | Description |
|:---- |:---- |
| CONTAINER_IP | Only set when generateInstanceHostList is enabled. |
| CONTAINER_GPUS | Only set when gpuNumber is greater than 0. It is a Number, each bit of this number represents a Gpu. for example, 3 represents gpu0 and gpu1  |
| CONTAINER_PORTS | Only set when portDefinitions is set, the format is: portLabel1:port1,port2,port3;portLabel2:port4,port5,port6|


## <a name="ExitStatus_Convention">ExitStatus Convention</a>
You can check the all the defined ExitStatus by: [ExitType](../src/main/java/com/microsoft/frameworklauncher/common/model/ExitType.java), [RetryPolicyDescriptor](../src/main/java/com/microsoft/frameworklauncher/common/model/RetryPolicyDescriptor.java), [RetryPolicyState](../src/main/java/com/microsoft/frameworklauncher/common/model/RetryPolicyState.java), [ExitDiagnostics](../src/main/java/com/microsoft/frameworklauncher/common/exit/ExitDiagnostics.java).

Recipes:
1. Your LauncherClient can depend on the ExitStatus Convention
2. If your Service failed, the Service can optionally return the ExitCode of USER_APP_TRANSIENT_ERROR and USER_APP_NON_TRANSIENT_ERROR to help FancyRetryPolicy to identify your Service's TRANSIENT_NORMAL and NON_TRANSIENT ExitType. If neither ExitCode is returned, the Service is considered to exit due to UNKNOWN ExitType.


## <a name="Framework_ACL">Framework ACL</a>
### <a name="Framework_ACL_Overview">Overview</a>
Framework ACL specifies which Users/Groups are able to access a specific FrameworkName, no matter the FrameworkName exists or not. So, essentially, it is the ACL for Users/Groups against FrameworkName's Namespace.

Framework ACL helps to:
1. Avoid one User/Group to occupy the FrameworkName (by Add Framework) reserved for other User/Group.
2. Avoid one User/Group to modify the Framework (by Update Framework) launched by other User/Group.

### <a name="Framework_ACL_Assumption">Assumption</a>
1. No naming conflict among UserNames and GroupNames.
2. UserNames and GroupNames satisfy regex ^[A-Za-z0-9\\-._]{1,254}$.

### <a name="Framework_ACL_Usage">Usage</a>
Framework ACL is enabled iff the webServerAclEnable is true, check it by [GET LauncherStatus](#GET_LauncherStatus).

1. If it is disabled, any User/Group can Read and Write the whole namespace. We assume it is enabled for simplicity below.
2. Administrator can always Read and Write the whole namespace, this fact will be omitted for simplicity below.

**Namespace Privilege**:

Namespace Write Privilege: Add or Update Framework in the Namespace

Namespace Read Privilege: Get Framework in the Namespace

**Namespace Mechanism**:

    {Namespace}~(AnyName)

1. It is pre-created, so no need to create the namespace in advance.
2. All Users/Groups can Read the namespace.
3. Initially, only the User named {Namespace} can Write the namespace. To grant the Write Privilege to more Users, see [PUT AclConfiguration](#PUT_AclConfiguration).
4. Based on the Assumption and Namespace Mechanism, the suggested Usage Pattern for Users/Groups can be derived below.

### <a name="Framework_ACL_Best_Practices_Usage">Best Practices: Usage Pattern</a>
**User Usage Pattern**:

The private namespace for the User named {UserName} is:

    {UserName}~(AnyName)

1. It is pre-created, so no need to create the namespace in advance.
2. Only this User can Write the namespace. However, all other Users/Groups can Read the namespace.

For example, User UA can fully control the namespace:

    UA~(AnyName)

**Group Usage Pattern**:

The private namespace for the Group named {GroupName} is:

The shared namespace for the Users belongs to {GroupName} is:

    {GroupName}~(AnyName)

1. It is pre-created, so no need to create the namespace in advance.
2. Initially, no User can Write the namespace. Administrator needs to add the UserNames belongs to the {GroupName} to the namespace {GroupName}, see [PUT AclConfiguration](#PUT_AclConfiguration). Only then, these Users can Write the namespace. However, all other Users/Groups can Read the namespace.

For example, Administrator adds User UA and UB belongs to Group GA to the namespace GA, and then UA and UB can work together to fully control the namespace:

    GA~(AnyName)

### <a name="Framework_ACL_Best_Practices_Naming">Best Practices: Naming within Namespace</a>
Launcher does not enforce Users/Groups how to further partition his private namespace or how to avoid naming conflict within his private namespace. Different Users/Groups might choose to use his private namespace differently, depending on their exact requirement, scenario and assumption.

So, here, we just provide the best practices for two scenarios:

**Batch Framework**:

Batch Framework User tends to Add a new Framework each time instead of Update the existing one.

So, he should ensure the name is not reused within his private namespace each time to call [PUT Framework](#PUT_Framework).

**Service Framework**:

Service Framework User tends to frequently Update the existing Framework instead of Add a new one. And he tends to specify a well-known name which he might want to expose to the Users of the Service itself.

So, he should ensure the name is reused within his small set well-known Services each time to call [PUT Framework](#PUT_Framework).

Anyway, If he really want to ensure to Add a new one, he needs to check his small set well-known Services, and then pick a new one.


## <a name="Best_Practices">Best Practices</a>
1. The **Initial Working Directory** of your EntryPoint is the root directory of the EntryPoint.
Your Service can read data anywhere, however it can ONLY write data under the Initial Working Directory with the Service Directory excluded. And if the Source is a **ZIP file**, it will be uncompressed before starting your Service.
For example:

        EntryPoint=HbaseRS.zip/start.bat
        SourceLocations=hdfs:///HbaseRS.zip, hdfs:///HbaseCom <- HbaseRS.zip is a ZIP file

    The two Sources HbaseRS.zip and HbaseCom will be downloaded (and uncompressed) to local machine as below structure:

        ./   <- The Initial Working Directory
        ├─HbaseRS.zip <- Service Directory <- HbaseRS.zip is a directory uncompressed from original ZIP file
        └─HbaseCom <- Service Directory

2. Launcher will not restart the succeeded Task (i.e. the process started by EntryPoint ends with exit code 0) in any RetryPolicy. So, if you want to always restart Service on the same machine irrespective of its exit code, you need to **warp the original EntryPoint** by another script, such as:

        while true; do
            # call the original EntryPoint
        done

3. Increase the replication number your data and binary on target HDFS (Higher ReplicationNumber means faster downloading, higher availability and higher durability).

        hadoop fs -setrep -w <ReplicationNumber> <HDFS Path>

4. Do not modify your data and binary on target HDFS. To use new data and binary, upload them to a different HDFS Path and then change the FrameworkVersion and SourceLocations.