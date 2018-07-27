// Copyright (c) Microsoft Corporation
// All rights reserved. 
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

package com.microsoft.frameworklauncher.applicationmaster;

import com.microsoft.frameworklauncher.client.LauncherClient;
import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.definition.TaskStateDefinition;
import com.microsoft.frameworklauncher.common.exceptions.AggregateException;
import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import com.microsoft.frameworklauncher.common.exceptions.NotAvailableException;
import com.microsoft.frameworklauncher.common.exit.ExitDiagnostics;
import com.microsoft.frameworklauncher.common.exit.ExitStatusKey;
import com.microsoft.frameworklauncher.common.exit.ExitStatusValue;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.exts.HadoopExts;
import com.microsoft.frameworklauncher.common.log.ChangeAwareLogger;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.service.AbstractService;
import com.microsoft.frameworklauncher.common.service.StopStatus;
import com.microsoft.frameworklauncher.common.service.SystemTaskQueue;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.utils.HadoopUtils;
import com.microsoft.frameworklauncher.common.utils.ValueRangeUtils;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.hdfsstore.HdfsStore;
import com.microsoft.frameworklauncher.hdfsstore.HdfsStoreStructure;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.yarn.api.ApplicationConstants;
import org.apache.hadoop.yarn.api.protocolrecords.RegisterApplicationMasterResponse;
import org.apache.hadoop.yarn.api.records.*;
import org.apache.hadoop.yarn.client.api.AMRMClient.ContainerRequest;
import org.apache.hadoop.yarn.client.api.YarnClient;
import org.apache.hadoop.yarn.client.api.async.AMRMClientAsync;
import org.apache.hadoop.yarn.client.api.async.NMClientAsync;
import org.apache.hadoop.yarn.exceptions.YarnException;
import org.apache.hadoop.yarn.util.ConverterUtils;
import org.apache.hadoop.yarn.util.Records;
import org.apache.log4j.Level;

import java.io.File;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.util.*;

// Maintains the life cycle for one Framework owned by this AM.
// It is the engine to transition Status to satisfy Request eventually.
// It is designed as a micro kernel to connect all its SubServices.
// Note:
//  It does NOT ensure at most one Container running for one Task, but eventually it should be.
public class ApplicationMaster extends AbstractService {
  private static final DefaultLogger LOGGER = new DefaultLogger(ApplicationMaster.class);
  private static final ChangeAwareLogger CHANGE_AWARE_LOGGER = new ChangeAwareLogger(ApplicationMaster.class);

  protected Configuration conf = new Configuration();
  protected SystemTaskQueue transitionTaskStateQueue;

  /**
   * REGION SubServices
   */
  protected ZookeeperStore zkStore;
  protected HdfsStore hdfsStore;
  protected YarnClient yarnClient;
  protected LauncherClient launcherClient;
  protected AMRMClientAsync<ContainerRequest> rmClient;
  // Note we should only use nmClient to start container, and leave other Container
  // managements to rmClient to ensure AM RM timely synced.
  protected NMClientAsync nmClient;
  protected StatusManager statusManager;
  protected RequestManager requestManager;
  protected FrameworkInfoPublisher frameworkInfoPublisher;
  protected SelectionManager selectionManager;
  private RMResyncHandler rmResyncHandler;

  /**
   * REGION StateVariable
   */
  // ContainerId -> ContainerConnectionExceedCount
  private final Map<String, Integer> containerConnectionExceedCount = new HashMap<>();

  /**
   * REGION AbstractService
   */
  public ApplicationMaster() {
    super(ApplicationMaster.class.getName(), true);
  }

  @Override
  protected Boolean handleException(Exception e) {
    super.handleException(e);

    if (e instanceof NonTransientException) {
      String msg = String.format(
          "NonTransientException occurred in %s. Framework will be stopped.",
          serviceName);
      LOGGER.logError(e, msg);
      msg += CommonUtils.toString(e);

      stopForInternalNonTransientError(msg);
      return false;
    } else {
      String msg = String.format(
          "Exception occurred in %1$s. It should be transient. Will migrate %1$s to another node.",
          serviceName);
      LOGGER.logError(e, msg);
      msg += CommonUtils.toString(e);

      stopForInternalTransientNormalError(msg);
      return false;
    }
  }

  @Override
  protected void initialize() throws Exception {
    super.initialize();
    transitionTaskStateQueue = new SystemTaskQueue(this::handleException);

    // Initialize AM NoDependenceConfig
    conf.initializeNoDependenceConfig();

    // Start RMClient to Register AM ASAP in case AM expired by RM
    rmClient = AMRMClientAsync.createAMRMClientAsync(
        conf.getAmRmHeartbeatIntervalSec() * 1000,
        new RMClientCallbackHandler(this));
    rmClient.init(conf.getYarnConfig());
    rmClient.start();
    conf.initializeDependOnRMResponseConfig(registerToRM());

    // Start NMClient
    nmClient = NMClientAsync.createNMClientAsync(
        new NMClientCallbackHandler(this));
    nmClient.init(conf.getYarnConfig());
    nmClient.start();

    // Start YarnClient
    yarnClient = YarnClient.createYarnClient();
    yarnClient.init(conf.getYarnConfig());
    yarnClient.start();
    conf.initializeDependOnYarnClientConfig(yarnClient);

    // Initialize Launcher Store
    zkStore = new ZookeeperStore(conf.getZkConnectString(), conf.getZkRootDir());
    conf.initializeDependOnZKStoreConfig(zkStore);
    hdfsStore = new HdfsStore(conf.getLauncherConfig().getHdfsRootDir());
    hdfsStore.makeFrameworkRootDir(conf.getFrameworkName());
    hdfsStore.makeUserStoreRootDir(conf.getFrameworkName());
    hdfsStore.makeAMStoreRootDir(conf.getFrameworkName());

    // Initialize other components
    launcherClient = new LauncherClient(
        conf.getLauncherConfig().getWebServerAddress(), 30, 10,
        LaunchClientType.APPLICATION_MASTER, conf.getLoggedInUser().getName());

    statusManager = new StatusManager(this, conf, zkStore);
    requestManager = new RequestManager(this, conf, zkStore, launcherClient);
    frameworkInfoPublisher = new FrameworkInfoPublisher(this, conf, zkStore, hdfsStore, statusManager, requestManager);
    selectionManager = new SelectionManager(this, conf, statusManager, requestManager);
    rmResyncHandler = new RMResyncHandler(this, conf);
  }

  @Override
  protected void recover() throws Exception {
    super.recover();
    statusManager.start();

    // Here StatusManager recover completed
    reviseCorruptedTaskStates();
    recoverTransitionTaskStateQueue();

    requestManager.start();
  }

  @Override
  protected void run() throws Exception {
    super.run();
    frameworkInfoPublisher.start();
  }

  // THREAD SAFE
  @Override
  public synchronized void stop(StopStatus stopStatus) {
    // Best Effort to stop Gracefully
    super.stop(stopStatus);

    AggregateException ae = new AggregateException();

    // Stop AM's SubServices
    // No need to stop nmClient, since it may be time consuming to stop all Containers, leave it for RM.
    // Since here is Best Effort, leave the GC work of zkStore and hdfsStore to LauncherService.
    try {
      if (yarnClient != null) {
        yarnClient.stop();
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    try {
      if (statusManager != null) {
        statusManager.stop(stopStatus);
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    try {
      if (requestManager != null) {
        requestManager.stop(stopStatus);
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    try {
      if (frameworkInfoPublisher != null) {
        frameworkInfoPublisher.stop(stopStatus);
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    // Stop rmClient at last, since there is no work left in current AM, and only then RM is
    // allowed to process the application, such as generate application's diagnostics.
    try {
      if (rmClient != null) {
        if (stopStatus.getNeedUnregister()) {
          LOGGER.logInfo("Unregistering %s to RM", serviceName);
          rmClient.unregisterApplicationMaster(
              stopStatus.getCode() == 0 ?
                  FinalApplicationStatus.SUCCEEDED :
                  FinalApplicationStatus.FAILED,
              stopStatus.getDiagnostics(), conf.getAmTrackingUrl());
        }
        rmClient.stop();
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    try {
      if (zkStore != null) {
        zkStore.stop();
      }
    } catch (Exception e) {
      ae.addException(e);
    }

    if (ae.getExceptions().size() > 0) {
      LOGGER.logWarning(ae, "Failed to stop %s gracefully", serviceName);
    }

    LOGGER.logInfo("%s stopped", serviceName);
    System.exit(stopStatus.getCode());
  }

  /**
   * REGION InternalUtils
   */
  private RegisterApplicationMasterResponse registerToRM() throws Exception {
    LOGGER.logInfo("Registering %s to RM", serviceName);
    RegisterApplicationMasterResponse rmResp =
        rmClient.registerApplicationMaster(conf.getAmHostName(), conf.getAmRpcPort(), conf.getAmTrackingUrl());

    // Dump out Response from RM
    LOGGER.logInfo("Running Framework [%s] in Queue [%s]", conf.getFrameworkName(), rmResp.getQueue());
    // No need to use it, since we can get the it from RM Resync
    LOGGER.logInfo("Got %s Containers from previous attempts", rmResp.getContainersFromPreviousAttempts().size());
    return rmResp;
  }

  private void stopForContainerCompletion(int exitCode, String diagnostics, String customizedDiagnostics) {
    ExitStatusValue partialValue = new ExitStatusValue(exitCode, diagnostics, null);

    String fullDiagnostics = ExitDiagnostics.generateDiagnostics(partialValue, customizedDiagnostics);
    ExitStatusKey exitStatusKey = ExitDiagnostics.extractExitStatusKey(fullDiagnostics);

    stop(new StopStatus(exitStatusKey.toInt(), true, fullDiagnostics));
  }

  private void stopForApplicationCompletion(
      String applicationCompletionReason, List<TaskStatus> completedTaskStatuses) throws IOException {
    TaskStatus lastCompletedTaskStatus = completedTaskStatuses.get(0);
    for (TaskStatus completedTaskStatus : completedTaskStatuses) {
      if (lastCompletedTaskStatus.getTaskCompletedTimestamp() < completedTaskStatus.getTaskCompletedTimestamp()) {
        lastCompletedTaskStatus = completedTaskStatus;
      }
    }

    stopForContainerCompletion(
        lastCompletedTaskStatus.getContainerExitCode(),
        lastCompletedTaskStatus.getContainerExitDiagnostics(),
        generateApplicationCompletionDiagnostics(applicationCompletionReason, lastCompletedTaskStatus));
  }

  private void stopForApplicationCompletion(String applicationCompletionReason) {
    String diagnostics = ExitDiagnostics.generateDiagnostics(
        ExitStatusKey.SUCCEEDED,
        generateApplicationCompletionDiagnostics(applicationCompletionReason));

    stop(new StopStatus(ExitStatusKey.SUCCEEDED.toInt(), true, diagnostics));
  }

  private void stopForInternalTransientNormalError(String customizedDiagnostics) {
    String diagnostics = ExitDiagnostics.generateDiagnostics(
        ExitStatusKey.AM_INTERNAL_TRANSIENT_NORMAL_ERROR, customizedDiagnostics);

    // Do not unregister, so that RM will start new attempt if AMAttemptMaxCount and
    // AMAttemptFailuresValidityIntervalSec is allowed.
    stop(new StopStatus(ExitStatusKey.AM_INTERNAL_TRANSIENT_NORMAL_ERROR.toInt(), false, diagnostics));
  }

  private void stopForInternalTransientConflictError(String customizedDiagnostics) {
    String diagnostics = ExitDiagnostics.generateDiagnostics(
        ExitStatusKey.AM_INTERNAL_TRANSIENT_CONFLICT_ERROR, customizedDiagnostics);

    // Unregister to leverage Framework FancyRetryPolicy
    stop(new StopStatus(ExitStatusKey.AM_INTERNAL_TRANSIENT_CONFLICT_ERROR.toInt(), true, diagnostics));
  }

  private void stopForInternalNonTransientError(String customizedDiagnostics) {
    String diagnostics = ExitDiagnostics.generateDiagnostics(
        ExitStatusKey.AM_INTERNAL_NON_TRANSIENT_ERROR, customizedDiagnostics);

    stop(new StopStatus(ExitStatusKey.AM_INTERNAL_NON_TRANSIENT_ERROR.toInt(), true, diagnostics));
  }

  private void stopForInternalUnKnownError(String customizedDiagnostics) {
    String diagnostics = ExitDiagnostics.generateDiagnostics(
        ExitStatusKey.AM_INTERNAL_UNKNOWN_ERROR, customizedDiagnostics);

    // Do not unregister to treat it conservatively.
    stop(new StopStatus(ExitStatusKey.AM_INTERNAL_UNKNOWN_ERROR.toInt(), false, diagnostics));
  }

  // Principle to setup ContainerRequest for a Task:
  // 1. Exactly match the Task's Requirement
  //    -> Keeps Waiting Allocation, i.e. containerRequestTimeoutSec = -1
  // 2. Too Relax for the Task's Requirement
  //    -> Reject Allocation and Re-Request, See testContainer
  // 3. Too Strict for the Task's Requirement
  //    -> Timeout Request and Re-Request, i.e. containerRequestTimeoutSec != -1
  private ContainerRequest setupContainerRequest(TaskStatus taskStatus) throws Exception {
    String taskRoleName = taskStatus.getTaskRoleName();
    Priority requestPriority = statusManager.getNextContainerRequestPriority();
    String requestNodeLabel = requestManager.getTaskRolePlatParams(taskRoleName).getTaskNodeLabel();

    ResourceDescriptor requestResource = requestManager.getTaskResource(taskRoleName);
    ResourceDescriptor maxResource = conf.getMaxResource();

    if (!ResourceDescriptor.fitsIn(requestResource, maxResource)) {
      LOGGER.logWarning(
          "Request Resource does not fit in the Max Resource configured in current cluster, " +
              "request may fail or never get satisfied: " +
              "Request Resource: [%s], Max Resource: [%s]",
          requestResource, maxResource);
    }
    if (requestResource.getGpuNumber() > 0 || requestResource.getPortNumber() > 0) {
      updateNodeReports(yarnClient.getNodeReports(NodeState.RUNNING));
      SelectionResult selectionResult = selectionManager.selectSingleNode(taskRoleName);

      ResourceDescriptor optimizedRequestResource = selectionResult.getOptimizedResource();
      if (selectionResult.getNodeHosts().size() > 0) {
        return HadoopUtils.toContainerRequest(optimizedRequestResource, requestPriority, null, selectionResult.getNodeHosts().get(0));
      }
      return HadoopUtils.toContainerRequest(optimizedRequestResource, requestPriority, requestNodeLabel, null);
    }
    return HadoopUtils.toContainerRequest(requestResource, requestPriority, requestNodeLabel, null);
  }

  private String generateContainerLocations(TaskStatus taskStatus) {
    return generateContainerLocations(taskStatus, "");
  }

  private String generateContainerLocations(TaskStatus taskStatus, String linePrefix) {
    String containerId = taskStatus.getContainerId();
    String hostName = taskStatus.getContainerHost();
    String logHttpAddress = taskStatus.getContainerLogHttpAddress();

    return String.format("" +
            "%4$sContainerLogHttpAddress: %1$s\n" +
            "%4$sContainerLogNetworkPath: %2$s\n" +
            "%4$sContainerCacheNetworkPath: %3$s",
        logHttpAddress,
        HadoopUtils.getContainerLogNetworkPath(hostName, conf.getAmLogDirs(), containerId),
        HadoopUtils.getContainerCacheNetworkPath(hostName, conf.getAmLocalDirs(), containerId),
        linePrefix);
  }

  private String generateApplicationCompletionDiagnostics(String applicationCompletionReason) {
    return "[ApplicationCompletionReason]: " + applicationCompletionReason;
  }

  private String generateApplicationCompletionDiagnostics(
      String applicationCompletionReason, TaskStatus lastCompletedTaskStatus) throws IOException {
    String taskRoleName = lastCompletedTaskStatus.getTaskRoleName();

    return String.format("" +
            "[%s]: [LastCompletedTask]: [TaskStatus]:\n%s\n" +
            "[%s]: [LastCompletedTask]: [ContainerLocations]:\n%s\n%s\n%s",
        taskRoleName, WebCommon.toJson(lastCompletedTaskStatus),
        taskRoleName, generateContainerLocations(lastCompletedTaskStatus),
        GlobalConstants.LINE,
        generateApplicationCompletionDiagnostics(applicationCompletionReason));
  }

  private void attemptToStop(TaskStatus taskStatus) throws IOException {
    String taskRoleName = taskStatus.getTaskRoleName();
    ExitType exitType = taskStatus.getContainerExitType();

    TaskRoleApplicationCompletionPolicyDescriptor applicationCompletionPolicy =
        requestManager.getTaskRoleApplicationCompletionPolicy(taskRoleName);
    Integer minFailedTaskCount = applicationCompletionPolicy.getMinFailedTaskCount();
    Integer minSucceededTaskCount = applicationCompletionPolicy.getMinSucceededTaskCount();

    if (exitType != ExitType.SUCCEEDED && minFailedTaskCount != null) {
      List<TaskStatus> failedTaskStatuses = statusManager.getFailedTaskStatus(taskRoleName);
      if (minFailedTaskCount <= failedTaskStatuses.size()) {
        String applicationCompletionReason = String.format(
            "[%s]: FailedTaskCount %s has reached MinFailedTaskCount %s.",
            taskRoleName, failedTaskStatuses.size(), minFailedTaskCount);
        stopForApplicationCompletion(applicationCompletionReason, failedTaskStatuses);
      }
    }

    if (exitType == ExitType.SUCCEEDED && minSucceededTaskCount != null) {
      List<TaskStatus> succeededTaskStatuses = statusManager.getSucceededTaskStatus(taskRoleName);
      if (minSucceededTaskCount <= succeededTaskStatuses.size()) {
        String applicationCompletionReason = String.format(
            "[%s]: SucceededTaskCount %s has reached MinSucceededTaskCount %s.",
            taskRoleName, succeededTaskStatuses.size(), minSucceededTaskCount);
        stopForApplicationCompletion(applicationCompletionReason, succeededTaskStatuses);
      }
    }

    if (statusManager.isAllTaskInFinalState()) {
      int totalTaskCount = statusManager.getTaskCount();
      List<TaskStatus> failedTaskStatuses = statusManager.getFailedTaskStatus();
      String applicationCompletionReason = String.format(
          "All Tasks completed and no ApplicationCompletionPolicy has ever been triggered: " +
              "TotalTaskCount: %s, FailedTaskCount: %s.",
          totalTaskCount, failedTaskStatuses.size());
      stopForApplicationCompletion(applicationCompletionReason);
    }
  }

  // Only can be used in completeContainer, onTaskToRemove or to release a not live associated Container.
  // Should use completeContainer to release a live associated Container or need to log
  // the diagnostics of a Container.
  private Boolean tryToReleaseContainer(String containerId) {
    try {
      LOGGER.logDebug("[%s]: releaseAssignedContainer", containerId);
      rmClient.releaseAssignedContainer(ConverterUtils.toContainerId(containerId));
      return true;
    } catch (Exception e) {
      LOGGER.logError(e, "[%s]: Failed to releaseAssignedContainer", containerId);
      return false;
    }
  }

  private float getApplicationProgress() throws Exception {
    String requestManagerLogScope = "RequestManager_GetApplicationProgress";
    String statusManagerLogScope = "StatusManager_GetApplicationProgress";
    CHANGE_AWARE_LOGGER.initializeScope(requestManagerLogScope, Level.DEBUG);
    CHANGE_AWARE_LOGGER.initializeScope(statusManagerLogScope, Level.DEBUG);

    try {
      return requestManager.getApplicationProgress();
    } catch (Exception reqEx) {
      CHANGE_AWARE_LOGGER.log(requestManagerLogScope,
          "Failed to getApplicationProgress from RequestManager.%s",
          CommonUtils.toString(reqEx));

      try {
        return statusManager.getApplicationProgress();
      } catch (Exception statEx) {
        CHANGE_AWARE_LOGGER.log(statusManagerLogScope,
            "Failed to getApplicationProgress from StatusManager. Return 0 Progress.%s",
            CommonUtils.toString(reqEx));
        return 0;
      }
    }
  }

  private TaskStatus findTask(Container container) {
    Priority priority = container.getPriority();
    if (statusManager.containsTask(priority)) {
      TaskStatus taskStatus = statusManager.getTaskStatus(priority);
      assert (taskStatus.getTaskState() == TaskState.CONTAINER_REQUESTED);
      return taskStatus;
    }
    return null;
  }

  private Boolean testContainerNode(String containerId, String containerHostName) {
    String logPrefix = String.format("[%s][%s]: testContainerNode: ", containerId, containerHostName);
    String rejectedLogPrefix = logPrefix + "Rejected: ";
    String acceptedLogPrefix = logPrefix + "Accepted: ";

    Boolean aaAllocation = requestManager.getPlatParams().getAntiaffinityAllocation();
    if (aaAllocation) {
      if (statusManager.isHostNameLiveAssociated(containerHostName)) {
        LOGGER.logWarning(rejectedLogPrefix + "Node is not an antiaffinity allocation.");
        return false;
      } else {
        LOGGER.logInfo(acceptedLogPrefix + "Node is an antiaffinity allocation.");
      }
    }
    return true;
  }

  // To keep all tasks have the same ports in a task role.
  // Will reject this container if the ports are not the same.
  private Boolean testContainerPorts(Container container, String taskRoleName) throws Exception {
    Boolean samePortAllocation = requestManager.getTaskRolePlatParams(taskRoleName).getSamePortAllocation();
    List<ValueRange> allocatedPorts = statusManager.getAnyLiveAssociatedContainerPorts(taskRoleName);
    List<ValueRange> containerPorts = ResourceDescriptor.fromResource(container.getResource()).getPortRanges();

    String logPrefix = String.format("[%s][%s]: testContainerPorts: ", container.getId().toString(), taskRoleName);
    String rejectedLogPrefix = logPrefix + "Rejected: ";
    String acceptedLogPrefix = logPrefix + "Accepted: ";

    if (samePortAllocation) {
      if (ValueRangeUtils.getValueNumber(allocatedPorts) > 0) {
        if (!ValueRangeUtils.isEqualRangeList(containerPorts, allocatedPorts)) {
          LOGGER.logWarning(rejectedLogPrefix + "Container ports are not the same as previous allocated ports.");
          return false;
        }
      }
      LOGGER.logInfo(acceptedLogPrefix + "Container ports are the same as previous allocated ports.");
    }
    return true;
  }

  private Boolean testContainer(Container container, String taskRoleName) throws Exception {
    String containerId = container.getId().toString();
    String containerHostName = container.getNodeId().getHost();

    if (!testContainerNode(containerId, containerHostName)) {
      return false;
    }
    if (!testContainerPorts(container, taskRoleName)) {
      return false;
    }
    return true;
  }

  private ContainerLaunchContext setupContainerLaunchContext(TaskStatus taskStatus) throws Exception {
    HdfsStoreStructure hdfsStruct = hdfsStore.getHdfsStruct();

    String taskRoleName = taskStatus.getTaskRoleName();
    Integer taskIndex = taskStatus.getTaskIndex();
    Integer serviceVersion = getServiceVersion(taskRoleName);

    UserDescriptor user = requestManager.getUser();
    List<String> sourceLocations = requestManager.getTaskService(taskRoleName).getSourceLocations();
    String entryPoint = requestManager.getTaskService(taskRoleName).getEntryPoint();

    // SetupLocalResources
    Map<String, LocalResource> localResources = new HashMap<>();
    try {
      for (String location : sourceLocations) {
        HadoopUtils.addToLocalResources(localResources, location);
      }
    } catch (Exception e) {
      // User is likely to set an invalid SourceLocations, and it contains HDFS OP,
      // so handle the corresponding Exception ASAP
      handleException(e);
    }

    // SetupLocalEnvironment
    Map<String, String> localEnvs = new HashMap<>();
    localEnvs.put(GlobalConstants.ENV_VAR_LAUNCHER_LOG_DIR, ApplicationConstants.LOG_DIR_EXPANSION_VAR);

    localEnvs.put(GlobalConstants.ENV_VAR_HADOOP_USER_NAME, user.getName());

    localEnvs.put(GlobalConstants.ENV_VAR_FRAMEWORK_NAME, conf.getFrameworkName());
    localEnvs.put(GlobalConstants.ENV_VAR_FRAMEWORK_VERSION, conf.getFrameworkVersion().toString());
    localEnvs.put(GlobalConstants.ENV_VAR_TASK_ROLE_NAME, taskRoleName);
    localEnvs.put(GlobalConstants.ENV_VAR_TASK_INDEX, taskIndex.toString());
    localEnvs.put(GlobalConstants.ENV_VAR_SERVICE_VERSION, serviceVersion.toString());

    localEnvs.put(GlobalConstants.ENV_VAR_ZK_CONNECT_STRING, conf.getZkConnectString());
    localEnvs.put(GlobalConstants.ENV_VAR_ZK_ROOT_DIR, conf.getZkRootDir());
    localEnvs.put(GlobalConstants.ENV_VAR_HDFS_ROOT_DIR, conf.getLauncherConfig().getHdfsRootDir());
    localEnvs.put(GlobalConstants.ENV_VAR_HDFS_USER_STORE_ROOT_DIR, hdfsStruct.getUserStoreRootPath(conf.getFrameworkName()));
    localEnvs.put(GlobalConstants.ENV_VAR_HDFS_FRAMEWORK_INFO_FILE, hdfsStruct.getFrameworkInfoFilePath(conf.getFrameworkName()));

    localEnvs.put(GlobalConstants.ENV_VAR_AM_VERSION, conf.getAmVersion().toString());
    localEnvs.put(GlobalConstants.ENV_VAR_APP_ID, conf.getApplicationId());
    localEnvs.put(GlobalConstants.ENV_VAR_ATTEMPT_ID, conf.getAttemptId());
    localEnvs.put(GlobalConstants.ENV_VAR_CONTAINER_IP, taskStatus.getContainerIp());
    localEnvs.put(GlobalConstants.ENV_VAR_CONTAINER_GPUS, taskStatus.getContainerGpus().toString());
    localEnvs.put(GlobalConstants.ENV_VAR_CONTAINER_PORTS, taskStatus.getContainerPorts());


    // SetupEntryPoint
    String command = String.format(
        "%1$s 1>%2$sstdout 2>%2$sstderr",
        entryPoint,
        GlobalConstants.REF_ENV_VAR_LAUNCHER_LOG_DIR + File.separator);

    ContainerLaunchContext launchContext = Records.newRecord(ContainerLaunchContext.class);
    launchContext.setLocalResources(localResources);
    launchContext.setCommands(Collections.singletonList(command));
    launchContext.setServiceData(new HashMap<>());
    launchContext.setEnvironment(localEnvs);

    return launchContext;
  }

  private void updateNodeReports(List<NodeReport> nodeReports) throws Exception {
    for (NodeReport nodeReport : nodeReports) {
      NodeState state = nodeReport.getNodeState();
      if (state.isUnusable()) {
        selectionManager.removeNode(nodeReport);
      } else {
        selectionManager.addNode(nodeReport);
      }
      // TODO: Update TaskStatus.ContainerIsDecommissioning
    }
  }

  /**
   * REGION TaskStateMachine
   */
  // Method which will cause transitionTaskState
  // Note they should be called in single thread, such as from transitionTaskStateQueue

  // Should be called after StatusManager recover completed
  private void reviseCorruptedTaskStates() throws Exception {
    LOGGER.logInfo(
        "reviseCorruptedTaskStates: %s",
        CommonExts.toString(TaskStateDefinition.STATE_CORRUPTED_AFTER_RESTART_STATES));

    List<TaskStatus> corruptedTaskStatuses = statusManager.getTaskStatus(
        TaskStateDefinition.STATE_CORRUPTED_AFTER_RESTART_STATES);
    for (TaskStatus taskStatus : corruptedTaskStatuses) {
      TaskState taskState = taskStatus.getTaskState();
      TaskStatusLocator taskLocator = new TaskStatusLocator(taskStatus.getTaskRoleName(), taskStatus.getTaskIndex());

      // Previous Requested Container may not receive onContainersAllocated after AM Restart
      if (taskState == TaskState.CONTAINER_REQUESTED) {
        statusManager.transitionTaskState(taskLocator, TaskState.TASK_WAITING);
      }

      // Previous Allocated Container will lost the Container object to Launch after AM Restart
      // Previous Launched Container may not receive onContainerStarted after AM Restart
      // Because misjudge a ground truth Running Container to be TASK_WAITING (lose Task) is more serious than
      // misjudge a ground truth not Running Container to Running. (The misjudged Container will be expired
      // by RM eventually, so the only impact is longer time to run all Tasks)
      if (taskState == TaskState.CONTAINER_ALLOCATED ||
          taskState == TaskState.CONTAINER_LAUNCHED) {
        statusManager.transitionTaskState(taskLocator, TaskState.CONTAINER_RUNNING);
      }
    }
  }

  private void recoverTransitionTaskStateQueue() {
    // No need to recover TransitionTaskStateQueue for:
    // 1. STATE_CORRUPTED_AFTER_RESTART_STATES, since they are revised to other States by reviseCorruptedTaskStates
    // 2. CONTAINER_RUNNING, since it can be handled by RMResyncHandler and RMClientCallbackHandler
    // 3. TASK_COMPLETED, since it is FinalState
    LOGGER.logInfo(
        "recoverTransitionTaskStateQueue for TaskState: %s",
        CommonExts.toString(TaskStateDefinition.QUEUE_CORRUPTED_AFTER_RESTART_STATES));

    // There may be a lot of corrupted SystemTasks, so we queue them as one SystemTask per State
    transitionTaskStateQueue.queueSystemTask(() -> {
      addContainerRequest();
    });
    LOGGER.logInfo("All the previous TASK_WAITING Tasks have been driven");

    transitionTaskStateQueue.queueSystemTask(() -> {
      attemptToRetry();
    });
    LOGGER.logInfo("All the previous CONTAINER_COMPLETED Tasks have been driven");
  }

  private void addContainerRequest(TaskStatus taskStatus) throws Exception {
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());
    String logPrefix = String.format("%s: addContainerRequest: ", taskLocator);
    LOGGER.logInfo(logPrefix + "Start");

    // 1. setupContainerRequest, retry later if request is not available.
    Integer setupContainerRequestRetryIntervalSec = CommonUtils.getRandomNumber(
        conf.getLauncherConfig().getAmSetupContainerRequestMinRetryIntervalSec(),
        conf.getLauncherConfig().getAmSetupContainerRequestMaxRetryIntervalSec());

    ContainerRequest request;
    try {
      request = setupContainerRequest(taskStatus);
    } catch (NotAvailableException e) {
      LOGGER.logWarning(e, logPrefix +
              "Failed to setupContainerRequest: " +
              "ContainerRequest may be temporarily not available. " +
              "Will retry after %ss.",
          setupContainerRequestRetryIntervalSec);

      TaskStatus taskStatusSnapshot = YamlUtils.deepCopy(taskStatus, TaskStatus.class);
      transitionTaskStateQueue.queueSystemTaskDelayed(() -> {
        if (statusManager.containsTask(taskStatusSnapshot)) {
          addContainerRequest(taskStatusSnapshot);
        } else {
          LOGGER.logWarning(logPrefix + "Task not found in Status. Ignore it.");
        }
      }, setupContainerRequestRetryIntervalSec * 1000);
      return;
    }

    // 2. addContainerRequest, retry later if request is timeout.
    Integer containerRequestTimeoutSec = CommonUtils.getRandomNumber(
        conf.getLauncherConfig().getAmContainerRequestMinTimeoutSec(),
        conf.getLauncherConfig().getAmContainerRequestMaxTimeoutSec());

    LOGGER.logInfo(logPrefix +
            "Send ContainerRequest to RM with timeout %ss. ContainerRequest: [%s]",
        containerRequestTimeoutSec, HadoopExts.toString(request));
    rmClient.addContainerRequest(request);
    selectionManager.addContainerRequest(request);

    statusManager.transitionTaskState(taskLocator, TaskState.CONTAINER_REQUESTED,
        new TaskEvent().setContainerRequest(request));

    transitionTaskStateQueue.queueSystemTaskDelayed(() -> {
      if (statusManager.containsTask(request.getPriority())) {
        LOGGER.logWarning(logPrefix +
                "ContainerRequest cannot be satisfied within timeout %ss. " +
                "Cancel it and Request again. ContainerRequest: [%s]",
            containerRequestTimeoutSec, HadoopExts.toString(request));

        removeContainerRequest(taskStatus);
        statusManager.transitionTaskState(taskLocator, TaskState.TASK_WAITING);
        addContainerRequest(taskStatus);
      }
    }, containerRequestTimeoutSec * 1000);
  }

  private void addContainerRequest() throws Exception {
    List<TaskStatus> taskStatuses = statusManager.getTaskStatus(
        new HashSet<>(Collections.singletonList(TaskState.TASK_WAITING)));

    // Higher Priority for Lower TaskIndex, since updateTaskNumbers update tail Tasks firstly.
    taskStatuses.sort(Comparator.comparing(TaskStatus::getTaskIndex));
    for (TaskStatus taskStatus : taskStatuses) {
      addContainerRequest(taskStatus);
    }
  }

  private void completeTask(TaskStatus taskStatus) throws Exception {
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());

    LOGGER.logSplittedLines(Level.INFO,
        "%s: completeTask: TaskStatus:\n%s",
        taskLocator, WebCommon.toJson(taskStatus));

    statusManager.transitionTaskState(taskLocator, TaskState.TASK_COMPLETED);
    attemptToStop(taskStatus);
  }

  private void retryTask(TaskStatus taskStatus, RetryPolicyState newRetryPolicyState) throws Exception {
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());

    LOGGER.logSplittedLines(Level.INFO,
        "%s: retryTask: NewRetryPolicyState:\n%s",
        taskLocator, WebCommon.toJson(newRetryPolicyState));

    statusManager.transitionTaskState(taskLocator, TaskState.TASK_WAITING,
        new TaskEvent().setNewRetryPolicyState(newRetryPolicyState));
    addContainerRequest(taskStatus);
  }

  // Implement TaskRetryPolicy
  private void attemptToRetry(TaskStatus taskStatus) throws Exception {
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());
    Integer exitCode = taskStatus.getContainerExitCode();
    ExitType exitType = taskStatus.getContainerExitType();
    Integer retriedCount = taskStatus.getTaskRetryPolicyState().getRetriedCount();
    RetryPolicyState newRetryPolicyState = YamlUtils.deepCopy(taskStatus.getTaskRetryPolicyState(), RetryPolicyState.class);

    RetryPolicyDescriptor retryPolicy = requestManager.getTaskRetryPolicy(taskRoleName);
    Boolean fancyRetryPolicy = retryPolicy.getFancyRetryPolicy();
    Integer maxRetryCount = retryPolicy.getMaxRetryCount();

    String logPrefix = String.format("%s: attemptToRetry: ", taskLocator);

    LOGGER.logSplittedLines(Level.INFO,
        logPrefix + "ContainerExitCode: [%s], ContainerExitType: [%s], RetryPolicyState:\n[%s]",
        exitCode, exitType, WebCommon.toJson(newRetryPolicyState));

    String completeTaskLogPrefix = logPrefix + "Will completeTask. Reason: ";
    String retryTaskLogPrefix = logPrefix + "Will retryTask with new Container. Reason: ";

    // 1. FancyRetryPolicy
    String fancyRetryPolicyLogSuffix = String.format("FancyRetryPolicy: Task exited due to %s.", exitType);
    if (exitType == ExitType.TRANSIENT_NORMAL) {
      newRetryPolicyState.setTransientNormalRetriedCount(newRetryPolicyState.getTransientNormalRetriedCount() + 1);
      if (fancyRetryPolicy) {
        LOGGER.logWarning(retryTaskLogPrefix + fancyRetryPolicyLogSuffix);
        retryTask(taskStatus, newRetryPolicyState);
        return;
      }
    } else if (exitType == ExitType.TRANSIENT_CONFLICT) {
      newRetryPolicyState.setTransientConflictRetriedCount(newRetryPolicyState.getTransientConflictRetriedCount() + 1);
      if (fancyRetryPolicy) {
        LOGGER.logWarning(retryTaskLogPrefix + fancyRetryPolicyLogSuffix);
        retryTask(taskStatus, newRetryPolicyState);
        return;
      }
    } else if (exitType == ExitType.NON_TRANSIENT) {
      newRetryPolicyState.setNonTransientRetriedCount(newRetryPolicyState.getNonTransientRetriedCount() + 1);
      if (fancyRetryPolicy) {
        LOGGER.logWarning(completeTaskLogPrefix + fancyRetryPolicyLogSuffix);
        completeTask(taskStatus);
        return;
      }
    } else {
      if (exitType == ExitType.SUCCEEDED) {
        newRetryPolicyState.setSucceededRetriedCount(newRetryPolicyState.getSucceededRetriedCount() + 1);
      } else {
        newRetryPolicyState.setUnKnownRetriedCount(newRetryPolicyState.getUnKnownRetriedCount() + 1);
      }
      if (fancyRetryPolicy) {
        // FancyRetryPolicy only handle exit due to transient and non-transient failure specially,
        // Leave exit due to others to NormalRetryPolicy
        LOGGER.logInfo(logPrefix +
            "Transfer the RetryDecision to NormalRetryPolicy. Reason: " +
            fancyRetryPolicyLogSuffix);
      }
    }

    // 2. NormalRetryPolicy
    if (maxRetryCount == GlobalConstants.USING_EXTENDED_UNLIMITED_VALUE ||
        (exitType != ExitType.SUCCEEDED && maxRetryCount == GlobalConstants.USING_UNLIMITED_VALUE) ||
        (exitType != ExitType.SUCCEEDED && retriedCount < maxRetryCount)) {
      newRetryPolicyState.setRetriedCount(newRetryPolicyState.getRetriedCount() + 1);

      LOGGER.logWarning(retryTaskLogPrefix +
              "RetriedCount %s has not reached MaxRetryCount %s.",
          retriedCount, maxRetryCount);
      retryTask(taskStatus, newRetryPolicyState);
      return;
    } else {
      if (exitType == ExitType.SUCCEEDED) {
        LOGGER.logInfo(completeTaskLogPrefix +
            "Task exited due to %s.", exitType);
        completeTask(taskStatus);
        return;
      } else {
        LOGGER.logWarning(completeTaskLogPrefix +
                "RetriedCount %s has reached MaxRetryCount %s.",
            retriedCount, maxRetryCount);
        completeTask(taskStatus);
        return;
      }
    }
  }

  private void attemptToRetry() throws Exception {
    for (TaskStatus taskStatus : statusManager.getTaskStatus(
        new HashSet<>(Collections.singletonList(TaskState.CONTAINER_COMPLETED)))) {
      attemptToRetry(taskStatus);
    }
  }

  private void completeContainer(String containerId, int exitCode, String diagnostics, Boolean needToRelease) throws Exception {
    if (needToRelease) {
      tryToReleaseContainer(containerId);
      if (exitCode == ExitStatusKey.CONTAINER_MIGRATE_TASK_REQUESTED.toInt()) {
        requestManager.onMigrateTaskRequestContainerReleased(containerId);
      }
    }

    String logSuffix = String.format(
        "[%s]: completeContainer: ExitCode: %s, ExitDiagnostics: %s, NeedToRelease: %s",
        containerId, exitCode, diagnostics, needToRelease);

    if (!statusManager.isContainerIdLiveAssociated(containerId)) {
      LOGGER.logDebug("[NotLiveAssociated]%s", logSuffix);
      return;
    }

    TaskStatus taskStatus = statusManager.getTaskStatusWithLiveAssociatedContainerId(containerId);
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());
    String linePrefix = String.format("%s: ", taskLocator);

    LOGGER.logSplittedLines(Level.INFO,
        "%s%s\n%s",
        taskLocator, logSuffix, generateContainerLocations(taskStatus, linePrefix));

    statusManager.transitionTaskState(taskLocator, TaskState.CONTAINER_COMPLETED,
        new TaskEvent().setContainerExitCode(exitCode).setContainerExitDiagnostics(diagnostics));

    // Post-mortem CONTAINER_COMPLETED Task
    attemptToRetry(taskStatus);
  }

  private void completeContainer(List<String> containerIds, int exitCode, String diagnostics, Boolean needToRelease) throws Exception {
    for (String containerId : containerIds) {
      completeContainer(containerId, exitCode, diagnostics, needToRelease);
    }
  }

  private void completeContainer(List<ContainerStatus> containerStatuses) throws Exception {
    for (ContainerStatus containerStatus : containerStatuses) {
      completeContainer(
          containerStatus.getContainerId().toString(),
          containerStatus.getExitStatus(),
          containerStatus.getDiagnostics(),
          false);
    }
  }

  private Set<String> resyncTasksWithLiveContainers(Set<String> liveContainerIds) throws Exception {
    String logScope = "resyncTasksWithLiveContainers";
    CHANGE_AWARE_LOGGER.initializeScope(logScope, Level.INFO, Level.DEBUG);

    Set<String> retainContainerIds = new HashSet<>();
    if (liveContainerIds == null) {
      CHANGE_AWARE_LOGGER.log(logScope,
          "Got null live Containers from RM, so RMResync is incomplete. " +
              "resetContainerConnectionLostCount for all tasks, since around this time RMResync must also be incomplete.");
      statusManager.resetContainerConnectionLostCount();
    } else {
      CHANGE_AWARE_LOGGER.log(logScope,
          "Got %s live Containers from RM, start to resync them.",
          liveContainerIds.size());

      for (String containerId : liveContainerIds) {
        if (statusManager.isContainerIdLiveAssociated(containerId)) {
          statusManager.resetContainerConnectionLostCount(containerId);
          retainContainerIds.add(containerId);
        } else {
          if (!containerConnectionExceedCount.containsKey(containerId)) {
            containerConnectionExceedCount.put(containerId, 0);
          }
          containerConnectionExceedCount.put(containerId, containerConnectionExceedCount.get(containerId) + 1);
          Integer exceedCount = containerConnectionExceedCount.get(containerId);

          LOGGER.logWarning(
              "Cannot find resynced live Container %s in live associated Containers. " +
                  "IncreaseContainerConnectionExceedCount to %s.",
              containerId, exceedCount);

          Integer maxExceedCount = requestManager.getPlatParams().getContainerConnectionMaxExceedCount();
          if (exceedCount > maxExceedCount) {
            LOGGER.logWarning(
                "Live Container %s's ContainerConnectionExceedCount %s " +
                    "exceed ContainerConnectionMaxExceedCount %s. " +
                    "Will complete it with RMResyncExceed ExitStatus",
                containerId, exceedCount, maxExceedCount);

            // This may Release the Container which is Allocated in RM, but AM has not got notified
            // through the onContainersAllocated.
            // To avoid this, we need to ensure the Release happens after onContainersAllocated, i.e.
            // AMRMHeartbeatIntervalSec < ContainerConnectionMaxExceedCount * AMRMResyncIntervalSec
            completeContainer(
                containerId,
                ExitStatusKey.CONTAINER_RM_RESYNC_EXCEED.toInt(),
                "Container exceed after RMResynced",
                true);

            // Pending Exceed Container now is settled to definitely Exceed Container
            containerConnectionExceedCount.remove(containerId);
          } else {
            retainContainerIds.add(containerId);
          }
        }
      }

      List<String> liveAssociatedContainerIds = statusManager.getLiveAssociatedContainerIds();
      for (String containerId : liveAssociatedContainerIds) {
        if (!liveContainerIds.contains(containerId)) {
          TaskStatus taskStatus = statusManager.getTaskStatusWithLiveAssociatedContainerId(containerId);
          String taskRoleName = taskStatus.getTaskRoleName();
          TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());

          statusManager.increaseContainerConnectionLostCount(containerId);
          Integer lostCount = taskStatus.getContainerConnectionLostCount();
          LOGGER.logWarning(
              "%s: Cannot find live associated Container %s in resynced live Containers. " +
                  "increaseContainerConnectionLostCount to %s.",
              taskLocator, containerId, lostCount);

          Integer maxLostCount = requestManager.getPlatParams().getContainerConnectionMaxLostCount();
          if (maxLostCount == GlobalConstants.USING_DEFAULT_VALUE) {
            maxLostCount = conf.getLauncherConfig().getAmRmResyncFrequency();
          }

          // This may Mis-Complete the Container, when liveContainerIds is incomplete.
          // If miss judging rate is still too high, we need to combine the ContainerStatus from NM to
          // double confirm the Container is lost/complete.
          if (maxLostCount != GlobalConstants.USING_UNLIMITED_VALUE &&
              lostCount > maxLostCount) {
            LOGGER.logWarning(
                "%s: Live associated Container %s's ContainerConnectionLostCount %s " +
                    "exceed ContainerConnectionMaxLostCount %s. " +
                    "Will complete it with RMResyncLost ExitStatus",
                taskLocator, containerId, lostCount, maxLostCount);

            completeContainer(
                containerId,
                ExitStatusKey.CONTAINER_RM_RESYNC_LOST.toInt(),
                "Container lost after RMResynced",
                true);
          } else {
            retainContainerIds.add(containerId);
          }
        }
      }
    }

    return retainContainerIds;
  }

  private void removeContainerRequest(TaskStatus taskStatus) {
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskStatus.getTaskRoleName(), taskStatus.getTaskIndex());
    if (!statusManager.containsTask(taskLocator)) {
      return;
    }
    ContainerRequest request = statusManager.getContainerRequest(taskLocator);
    if (request == null) {
      return;
    }

    try {
      rmClient.removeContainerRequest(request);
    } catch (Exception e) {
      LOGGER.logError(e, "%s: Failed to rmClient.removeContainerRequest", taskLocator);
    }

    try {
      selectionManager.removeContainerRequest(request);
    } catch (Exception e) {
      LOGGER.logError(e, "%s: Failed to selectionManager.removeContainerRequest", taskLocator);
    }
  }

  private void allocateContainer(Container container) throws Exception {
    String containerId = container.getId().toString();

    LOGGER.logInfo(
        "[%s]: allocateContainer: Try to Allocate Container to Task: Container: %s",
        containerId, HadoopExts.toString(container));

    // 0. findTask
    TaskStatus taskStatus = findTask(container);
    if (taskStatus == null) {
      LOGGER.logDebug(
          "[%s]: Cannot find a suitable Task to accept the Allocate Container. It should be exceeded.",
          containerId);
      tryToReleaseContainer(containerId);
      return;
    }
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());

    // 1. removeContainerRequest
    removeContainerRequest(taskStatus);

    // 2. testContainer
    if (!testContainer(container, taskRoleName)) {
      LOGGER.logInfo(
          "%s[%s]: Container is Rejected, Release Container and Request again",
          taskLocator, containerId);
      tryToReleaseContainer(containerId);
      statusManager.transitionTaskState(taskLocator, TaskState.TASK_WAITING);
      addContainerRequest(taskStatus);
      return;
    }

    // 3. allocateContainer
    Map<String, Ports> portDefinitions = requestManager.getTaskResource(taskRoleName).getPortDefinitions();
    try {
      statusManager.transitionTaskState(taskLocator, TaskState.CONTAINER_ALLOCATED,
          new TaskEvent().setContainer(container).setPortDefinitions(portDefinitions));
    } catch (Exception e) {
      LOGGER.logWarning(e,
          "%s[%s]: Failed to Allocate Container to Task, Release Container and Request again",
          taskLocator, containerId);
      tryToReleaseContainer(containerId);
      statusManager.transitionTaskState(taskLocator, TaskState.TASK_WAITING);
      addContainerRequest(taskStatus);
      return;
    }

    LOGGER.logInfo("%s[%s]: Succeeded to Allocate Container to Task", taskLocator, containerId);
    if (containerConnectionExceedCount.containsKey(containerId)) {
      // Pending Exceed Container now is settled to live associated Container
      containerConnectionExceedCount.remove(containerId);
    }

    // 4. launchContainer
    Boolean gangAllocation = requestManager.getPlatParams().getGangAllocation();
    if (!gangAllocation) {
      launchContainer(taskStatus);
    }
  }

  private void allocateContainer(List<Container> containers) throws Exception {
    LOGGER.logInfo(
        "allocateContainer: Try to Allocate %s Containers to Tasks",
        containers.size());

    for (Container container : containers) {
      allocateContainer(container);
    }
  }

  private void launchContainer(TaskStatus taskStatus) throws Exception {
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());
    Container container = statusManager.getAllocatedContainer(taskLocator);
    String containerId = container.getId().toString();

    LOGGER.logInfo("%s[%s]: launchContainer", taskLocator, containerId);

    ContainerLaunchContext launchContext = setupContainerLaunchContext(taskStatus);
    nmClient.startContainerAsync(container, launchContext);
    statusManager.transitionTaskState(taskLocator, TaskState.CONTAINER_LAUNCHED);
  }

  private void onContainerStartSucceeded(String containerId) throws Exception {
    String logSuffix = String.format("[%s]: onContainerStartSucceeded", containerId);

    if (!statusManager.isContainerIdLiveAssociated(containerId)) {
      LOGGER.logWarning("[NotLiveAssociated]%s", logSuffix);
      return;
    }

    TaskStatus taskStatus = statusManager.getTaskStatusWithLiveAssociatedContainerId(containerId);
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());
    String linePrefix = String.format("%s: ", taskLocator);

    LOGGER.logSplittedLines(Level.INFO,
        "%s%s\n%s",
        taskLocator, logSuffix, generateContainerLocations(taskStatus, linePrefix));

    statusManager.transitionTaskState(taskLocator, TaskState.CONTAINER_RUNNING);
  }

  private void onContainerStartFailed(String containerId, Throwable e) throws Exception {
    String logSuffix = String.format(
        "[%s]: onContainerStartFailed.%s",
        containerId, CommonUtils.toString(e));

    if (!statusManager.isContainerIdLiveAssociated(containerId)) {
      LOGGER.logWarning("[NotLiveAssociated]%s", logSuffix);
      return;
    }

    TaskStatus taskStatus = statusManager.getTaskStatusWithLiveAssociatedContainerId(containerId);
    String taskRoleName = taskStatus.getTaskRoleName();
    TaskStatusLocator taskLocator = new TaskStatusLocator(taskRoleName, taskStatus.getTaskIndex());

    String diagnostics = String.format("%s%s", taskLocator, logSuffix);
    LOGGER.logInfo(diagnostics);
    completeContainer(
        containerId,
        ExitStatusKey.CONTAINER_START_FAILED.toInt(),
        diagnostics,
        true);
  }

  /**
   * REGION Callbacks
   */
  // AM integrate and process all Callbacks from all its SubServices
  // Note, if a Callback may change TaskState/TaskStatus, it should be queued in transitionTaskStateQueue
  // to let Callee(SystemTaskQueue) to handle it in order.
  // Note:
  //  1. Queued SystemTask need to double check whether the input param still valid at the time being Executed.
  //  2. For Status: Do not queue SystemTask with Status as the input param otherwise need to double check its
  //  validity inside the SystemTask.
  //  3. For Request: Always need to double check the corresponding Request's validity inside the SystemTask,
  //  since RequestManager is not synchronized.
  // For AM:
  //  1. For Status: Status is not queued.
  //  2. For Request: Since AM does not support change TaskRole on the fly, it does not need to double check the Request.

  // Callbacks from SubServices
  public void onExceptionOccurred(Exception e) {
    LOGGER.logInfo(e, "onExceptionOccurred");

    // Handle SubService Exception ASAP
    handleException(e);
  }

  // Callbacks from StatusManager and RequestManager
  // TaskRoleName -> ServiceVersion
  // AM may need to double check whether ServiceVersions is changed or not according to StatusManager
  public void onServiceVersionsUpdated(Map<String, Integer> serviceVersions) {
    LOGGER.logInfo("onServiceVersionsUpdated: ServiceVersions: %s", CommonExts.toString(serviceVersions));

    // TODO: Implement Service Rolling Upgrade
    // Just invalidate old Service cache
    HadoopUtils.invalidateLocalResourcesCache();
  }

  // TaskRoleName -> TaskNumber
  // AM may need to double check whether TaskNumbers is changed or not according to StatusManager
  public void onTaskNumbersUpdated(Map<String, Integer> taskNumbers) {
    LOGGER.logInfo("onTaskNumbersUpdated: TaskNumbers: %s", CommonExts.toString(taskNumbers));

    transitionTaskStateQueue.queueSystemTask(() -> {
      statusManager.updateTaskNumbers(taskNumbers);

      // In case TaskNumbers Increased
      addContainerRequest();
    });
  }

  public void onTaskToReleaseContainer(TaskStatus taskStatus) {
    String containerId = taskStatus.getContainerId();
    TaskState taskState = taskStatus.getTaskState();

    if (TaskStateDefinition.CONTAINER_LIVE_ASSOCIATED_STATES.contains(taskState)) {
      tryToReleaseContainer(containerId);
    }
  }

  // Cleanup Task level external resource [RM] before RemoveTask by DecreaseTaskNumber
  public void onTaskToRemove(TaskStatus taskStatus) {
    // No need to completeContainer, since it is to be Removed afterwards
    onTaskToReleaseContainer(taskStatus);
    removeContainerRequest(taskStatus);
  }

  public void onOutstandingTaskDisappeared() {
    Boolean gangAllocation = requestManager.getPlatParams().getGangAllocation();

    if (gangAllocation) {
      String logPrefix = "onOutstandingTaskDisappeared: GangAllocation Satisfied: ";
      LOGGER.logInfo(logPrefix + "Schedule to Launch allocated Tasks if any.");

      transitionTaskStateQueue.queueSystemTask(() -> {
        int outstandingTaskCount = statusManager.getOutstandingStateTaskCount();
        if (outstandingTaskCount == 0) {
          List<TaskStatus> taskStatuses = statusManager.getTaskStatus(
              new HashSet<>(Collections.singletonList(TaskState.CONTAINER_ALLOCATED)));

          LOGGER.logInfo(logPrefix + "Launch %s allocated Tasks.", taskStatuses.size());
          for (TaskStatus taskStatus : taskStatuses) {
            launchContainer(taskStatus);
          }
        }
      });
    }
  }

  public void onOutstandingTaskAppeared(int outstandingTaskAppearedRound, int outstandingTaskCount) {
    Boolean gangAllocation = requestManager.getPlatParams().getGangAllocation();
    Integer gangAllocationTimeoutSec = conf.getLauncherConfig().getAmGangAllocationTimeoutSec();

    if (gangAllocation) {
      String logPrefix = String.format(
          "onOutstandingTaskAppeared[%s]: GangAllocation Unsatisfied: ",
          outstandingTaskAppearedRound);

      LOGGER.logInfo(logPrefix +
              "Waiting for %s outstanding Tasks with timeout %ss.",
          outstandingTaskCount, gangAllocationTimeoutSec);

      transitionTaskStateQueue.queueSystemTaskDelayed(() -> {
        if (outstandingTaskAppearedRound == statusManager.getOutstandingTaskAppearedRound()) {
          int currentOutstandingTaskCount = statusManager.getOutstandingStateTaskCount();
          if (currentOutstandingTaskCount > 0) {
            stopForInternalTransientConflictError(String.format(
                "GangAllocation cannot be satisfied in time: " +
                    "Still waiting for %s outstanding Tasks after timeout %ss, " +
                    "maybe current available resource for the application is not enough, please retry later.",
                currentOutstandingTaskCount, gangAllocationTimeoutSec));
          }
        }
      }, gangAllocationTimeoutSec * 1000);
    }
  }

  public void onStartRMResyncHandler() {
    LOGGER.logInfo("onStartRMResyncHandler");
    rmResyncHandler.start();
    LOGGER.logInfo("All the previous CONTAINER_RUNNING Tasks have been driven");
  }

  public void onStartTransitionTaskStateQueue() {
    LOGGER.logInfo("onStartTransitionTaskStateQueue");
    transitionTaskStateQueue.start();
    LOGGER.logInfo("Running TransitionTaskStateQueue");
  }

  public void onMigrateTaskRequested(String containerId, MigrateTaskRequest migrateTaskRequest) throws IOException {
    LOGGER.logSplittedLines(Level.INFO,
        "onMigrateTask: ContainerId: %s MigrateTaskRequest:\n%s",
        containerId, WebCommon.toJson(migrateTaskRequest));

    transitionTaskStateQueue.queueSystemTask(() -> {
      completeContainer(
          containerId,
          ExitStatusKey.CONTAINER_MIGRATE_TASK_REQUESTED.toInt(),
          "Container killed due to MigrateTaskRequest",
          true);
    });
  }


  // Callbacks from RMResyncHandler
  public void queueResyncWithRM(int delaySec) {
    transitionTaskStateQueue.queueSystemTaskDelayed(() -> {
      rmResyncHandler.resyncWithRM();
    }, delaySec * 1000);
  }

  public void onLiveContainersUpdated(Set<String> liveContainerIds) throws Exception {
    // onLiveContainersUpdated is already in queue, so queue it again will disorder
    // the result of resyncWithRM and other SystemTasks
    resyncTasksWithLiveContainers(liveContainerIds);
  }


  // Callbacks from RMClient
  public void onError(Throwable e) {
    // YarnException indicates exceptions from yarn servers, and IOException indicates exceptions from RPC layer.
    // So, consider YarnException as NonTransientError, and IOException as TransientError.
    if (e instanceof YarnException) {
      stopForInternalNonTransientError(String.format(
          "onError called into AM from RM due to non-transient error, maybe application is non-compliant.%s",
          CommonUtils.toString(e)));
    } else if (e instanceof IOException) {
      stopForInternalTransientNormalError(String.format(
          "onError called into AM from RM due to transient error, maybe YARN RM is down.%s",
          CommonUtils.toString(e)));
    } else {
      stopForInternalUnKnownError(String.format(
          "onError called into AM from RM due to unknown error.%s",
          CommonUtils.toString(e)));
    }
  }

  public void onShutdownRequest() {
    stopForInternalTransientNormalError(
        "onShutdownRequest called into AM from RM, maybe this Attempt does not exist in RM.");
  }

  public float getProgress() throws Exception {
    // Note queueSystemTask and wait its result here will block the RMClient
    // Deliver ApplicationProgress to RM on next heartbeat
    float progress = getApplicationProgress();

    String logScope = "getApplicationProgress";
    CHANGE_AWARE_LOGGER.initializeScope(logScope, Level.DEBUG);
    CHANGE_AWARE_LOGGER.log(logScope,
        "getProgress called into AM from RM: Progress: [%s]", progress);

    return progress;
  }

  public void onNodesUpdated(List<NodeReport> nodeReports) {
    if (nodeReports.size() <= 0) {
      return;
    }
    LOGGER.logDebug("onNodesUpdated: nodeReports: %s", nodeReports.size());

    transitionTaskStateQueue.queueSystemTask(() -> {
      updateNodeReports(nodeReports);
    });
  }

  public void onContainersAllocated(List<Container> containers) {
    if (containers.size() <= 0) {
      return;
    }

    LOGGER.logInfo(
        "onContainersAllocated: Allocated Containers: %s.",
        containers.size());

    transitionTaskStateQueue.queueSystemTask(() -> {
      allocateContainer(containers);
    });
  }

  public void onContainersCompleted(List<ContainerStatus> containerStatuses) {
    if (containerStatuses.size() <= 0) {
      return;
    }

    LOGGER.logInfo(
        "onContainersCompleted: Completed Containers: %s.",
        containerStatuses.size());

    transitionTaskStateQueue.queueSystemTask(() -> {
      completeContainer(containerStatuses);
    });
  }

  public void onPreemptionMessage(PreemptionMessage message) {
    //TODO: Do some work to save current work, otherwise, the container will be released by RM.
    //By default, no action take is ok.
  }

  // Callbacks from NMClient
  public void onContainerStarted(ContainerId containerId, Map<String, ByteBuffer> allServiceResponse) {
    transitionTaskStateQueue.queueSystemTask(() -> {
      onContainerStartSucceeded(containerId.toString());
    });
  }

  public void onStartContainerError(ContainerId containerId, Throwable e) {
    transitionTaskStateQueue.queueSystemTask(() -> {
      onContainerStartFailed(containerId.toString(), e);
    });
  }

  // Since we should only use nmClient to start container, below Callbacks will never occur
  public void onContainerStopped(ContainerId containerId) {
  }

  public void onStopContainerError(ContainerId containerId, Throwable e) {
  }

  public void onContainerStatusReceived(ContainerId containerId, ContainerStatus containerStatus) {
  }

  public void onGetContainerStatusError(ContainerId containerId, Throwable e) {
  }

  /**
   * REGION ReadInterface
   */
  public List<String> getLiveAssociatedHostNames() {
    List<String> hostNames = new ArrayList<>();
    hostNames.add(conf.getAmHostName());
    hostNames.addAll(statusManager.getLiveAssociatedHostNames());
    return hostNames;
  }

  public Integer getServiceVersion(String taskRoleName) {
    return requestManager.getServiceVersion(taskRoleName);
  }

  public Boolean existsLocalVersionFrameworkRequest() {
    return requestManager.existsLocalVersionFrameworkRequest();
  }
}
