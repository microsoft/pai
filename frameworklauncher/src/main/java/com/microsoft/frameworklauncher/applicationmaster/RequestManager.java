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
import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import com.microsoft.frameworklauncher.common.exceptions.NotAvailableException;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.service.AbstractService;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.log4j.Level;
import org.apache.zookeeper.KeeperException.NoNodeException;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

// Manage the CURD to ZK Request
// Note:
//  Public property and interface is considered as underlay Request which does not need to be
//  synchronized with (notified to) AM and it can be changed at any time.
//  So, AM can implicitly support some Requests changed on the fly.
public class RequestManager extends AbstractService {  // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(RequestManager.class);

  private final ApplicationMaster am;
  private final Configuration conf;
  private final ZookeeperStore zkStore;
  private final LauncherClient launcherClient;


  /**
   * REGION BaseRequest
   */
  // AM only need to retrieve LauncherRequest and AggregatedFrameworkRequest
  private volatile LauncherRequest launcherRequest = null;
  private volatile FrameworkDescriptor frameworkDescriptor = null;
  private volatile OverrideApplicationProgressRequest overrideApplicationProgressRequest = null;
  // ContainerId -> MigrateTaskRequest
  private volatile Map<String, MigrateTaskRequest> migrateTaskRequests = null;


  /**
   * REGION ExtensionRequest
   * ExtensionRequest should be always CONSISTENT with BaseRequest
   */
  private volatile ClusterConfiguration clusterConfiguration;
  private volatile UserDescriptor user;
  private volatile PlatformSpecificParametersDescriptor platParams;
  // TaskRoleName -> TaskRoleDescriptor
  private volatile Map<String, TaskRoleDescriptor> taskRoles;
  // TaskRoleName -> RetryPolicyDescriptor
  private volatile Map<String, RetryPolicyDescriptor> taskRetryPolicies;
  // TaskRoleName -> ServiceDescriptor
  private volatile Map<String, ServiceDescriptor> taskServices;
  // TaskRoleName -> ResourceDescriptor
  private volatile Map<String, ResourceDescriptor> taskResources;
  // TaskRoleName -> TaskRolePlatformSpecificParametersDescriptor
  private volatile Map<String, TaskRolePlatformSpecificParametersDescriptor> taskPlatParams;

  /**
   * REGION StateVariable
   */
  // -1: not available, 0: does not exist, 1: exists
  private volatile int existsLocalVersionFrameworkRequest = -1;


  /**
   * REGION AbstractService
   */
  public RequestManager(ApplicationMaster am, Configuration conf, ZookeeperStore zkStore, LauncherClient launcherClient) {
    super(RequestManager.class.getName());
    this.am = am;
    this.conf = conf;
    this.zkStore = zkStore;
    this.launcherClient = launcherClient;
  }

  @Override
  protected Boolean handleException(Exception e) {
    super.handleException(e);

    LOGGER.logError(e,
        "Exception occurred in %1$s. %1$s will be stopped.",
        serviceName);

    // Rethrow is not work in another Thread, so using CallBack
    am.onExceptionOccurred(e);
    return false;
  }

  // No need to initialize for RequestManager
  // No need to recover for RequestManager
  // No need to stop ongoing Thread, since zkStore is Atomic
  @Override
  protected void run() throws Exception {
    super.run();

    new Thread(() -> {
      while (true) {
        try {
          checkAmVersion();
          pullRequest();

          Thread.sleep(conf.getLauncherConfig().getAmRequestPullIntervalSec() * 1000);
        } catch (Exception e) {
          // Directly throw TransientException to AM to actively migrate to another node
          handleException(e);
        }
      }
    }).start();
  }


  /**
   * REGION InternalUtils
   */
  // Throw NonTransientException to stop AM ASAP, in case the LauncherService or the NodeManager is down,
  // which may lead AM process cannot be killed in time.
  private void checkAmVersion() throws Exception {
    // LauncherStatus should always exist.
    LauncherStatus launcherStatus;
    try {
      launcherStatus = zkStore.getLauncherStatus();
    } catch (NoNodeException e) {
      throw new NonTransientException(
          "Failed to getLauncherStatus to checkAmVersion, LauncherStatus is already deleted on ZK", e);
    }

    Integer newAmVersion = launcherStatus.getLauncherConfiguration().getAmVersion();
    if (!newAmVersion.equals(conf.getAmVersion())) {
      throw new NonTransientException(String.format(
          "AmVersion mismatch: Local Version %s, Latest Version %s",
          conf.getAmVersion(), newAmVersion));
    }
  }

  private void pullRequest() throws Exception {
    // Pull LauncherRequest
    LOGGER.logDebug("Pulling LauncherRequest");
    LauncherRequest newLauncherRequest = zkStore.getLauncherRequest();
    LOGGER.logDebug("Pulled LauncherRequest");

    // newLauncherRequest is always not null
    updateLauncherRequest(newLauncherRequest);

    // Pull AggregatedFrameworkRequest
    AggregatedFrameworkRequest aggFrameworkRequest;
    try {
      LOGGER.logDebug("Pulling AggregatedFrameworkRequest");
      aggFrameworkRequest = zkStore.getAggregatedFrameworkRequest(conf.getFrameworkName());
      LOGGER.logDebug("Pulled AggregatedFrameworkRequest");
    } catch (NoNodeException e) {
      existsLocalVersionFrameworkRequest = 0;
      throw new NonTransientException(
          "Failed to getAggregatedFrameworkRequest, FrameworkRequest is already deleted on ZK", e);
    }

    // newFrameworkDescriptor is always not null
    FrameworkDescriptor newFrameworkDescriptor = aggFrameworkRequest.getFrameworkRequest().getFrameworkDescriptor();
    checkFrameworkVersion(newFrameworkDescriptor);
    flattenFrameworkDescriptor(newFrameworkDescriptor);
    updateFrameworkDescriptor(newFrameworkDescriptor);
    updateOverrideApplicationProgressRequest(aggFrameworkRequest.getOverrideApplicationProgressRequest());
    updateMigrateTaskRequests(aggFrameworkRequest.getMigrateTaskRequests());
  }

  private void updateLauncherRequest(LauncherRequest newLauncherRequest) throws Exception {
    if (YamlUtils.deepEquals(launcherRequest, newLauncherRequest)) {
      return;
    }

    LOGGER.logSplittedLines(Level.DEBUG,
        "Detected LauncherRequest changes. Updating to new LauncherRequest:\n%s",
        WebCommon.toJson(newLauncherRequest));

    launcherRequest = newLauncherRequest;
    clusterConfiguration = launcherRequest.getClusterConfiguration();
  }

  private void checkFrameworkVersion(FrameworkDescriptor newFrameworkDescriptor) throws Exception {
    if (!newFrameworkDescriptor.getVersion().equals(conf.getFrameworkVersion())) {
      existsLocalVersionFrameworkRequest = 0;
      throw new NonTransientException(String.format(
          "FrameworkVersion mismatch: Local Version %s, Latest Version %s",
          conf.getFrameworkVersion(), newFrameworkDescriptor.getVersion()));
    } else {
      existsLocalVersionFrameworkRequest = 1;
    }
  }

  private void flattenFrameworkDescriptor(FrameworkDescriptor newFrameworkDescriptor) {
    PlatformSpecificParametersDescriptor platParams = newFrameworkDescriptor.getPlatformSpecificParameters();
    for (TaskRoleDescriptor taskRoleDescriptor : newFrameworkDescriptor.getTaskRoles().values()) {
      TaskRolePlatformSpecificParametersDescriptor taskRolePlatParams = taskRoleDescriptor.getPlatformSpecificParameters();

      // taskRolePlatParams inherits platParams if it is null.
      if (taskRolePlatParams.getTaskNodeLabel() == null) {
        taskRolePlatParams.setTaskNodeLabel(platParams.getTaskNodeLabel());
      }
      if (taskRolePlatParams.getTaskNodeGpuType() == null) {
        taskRolePlatParams.setTaskNodeGpuType(platParams.getTaskNodeGpuType());
      }
    }
  }

  private void checkUnsupportedOnTheFlyChanges(FrameworkDescriptor newFrameworkDescriptor) {
    if (frameworkDescriptor == null) {
      return;
    }

    Boolean detectedUnsupportedChanges = false;
    FrameworkDescriptor clonedNewFrameworkDescriptor = YamlUtils.deepCopy(newFrameworkDescriptor, FrameworkDescriptor.class);
    Map<String, TaskRoleDescriptor> clonedNewTaskRoles = clonedNewFrameworkDescriptor.getTaskRoles();
    Map<String, TaskRoleDescriptor> frameworkTaskRoles = frameworkDescriptor.getTaskRoles();
    for (Map.Entry<String, TaskRoleDescriptor> taskRole : frameworkTaskRoles.entrySet()) {
      String taskRoleName = taskRole.getKey();
      if (!clonedNewTaskRoles.containsKey(taskRoleName)) {
        detectedUnsupportedChanges = true;
        break;
      }

      TaskRoleDescriptor clonedNewTaskRoleDescriptor = clonedNewTaskRoles.get(taskRoleName);
      // Set supported changes
      clonedNewTaskRoleDescriptor.setTaskNumber(taskRole.getValue().getTaskNumber());
    }

    if (!detectedUnsupportedChanges) {
      if (!YamlUtils.deepEquals(frameworkDescriptor, clonedNewFrameworkDescriptor)) {
        detectedUnsupportedChanges = true;
      }
    }

    if (detectedUnsupportedChanges) {
      LOGGER.logWarning("Detected unsupported FrameworkDescriptor changes on the fly, the behaviour is undefined.");
    }
  }

  private void updateFrameworkDescriptor(FrameworkDescriptor newFrameworkDescriptor) throws Exception {
    if (YamlUtils.deepEquals(frameworkDescriptor, newFrameworkDescriptor)) {
      return;
    }

    LOGGER.logSplittedLines(Level.INFO,
        "Detected FrameworkDescriptor changes. Updating to new FrameworkDescriptor:\n%s",
        WebCommon.toJson(newFrameworkDescriptor));

    checkUnsupportedOnTheFlyChanges(newFrameworkDescriptor);

    // Replace on the fly FrameworkDescriptor with newFrameworkDescriptor.
    // The operation is Atomic, since it only modifies the reference.
    // So, the on going read for the old FrameworkDescriptor will not get intermediate results
    frameworkDescriptor = newFrameworkDescriptor;

    // Backup old to detect changes
    PlatformSpecificParametersDescriptor oldPlatParams = platParams;
    Map<String, TaskRoleDescriptor> oldTaskRoles = taskRoles;
    Map<String, ServiceDescriptor> oldTaskServices = taskServices;

    // Update ExtensionRequest
    user = frameworkDescriptor.getUser();
    platParams = frameworkDescriptor.getPlatformSpecificParameters();
    taskRoles = frameworkDescriptor.getTaskRoles();
    Map<String, RetryPolicyDescriptor> newTaskRetryPolicies = new HashMap<>();
    Map<String, ServiceDescriptor> newTaskServices = new HashMap<>();
    Map<String, ResourceDescriptor> newTaskResources = new HashMap<>();
    Map<String, TaskRolePlatformSpecificParametersDescriptor> newTaskPlatParams = new HashMap<>();
    for (Map.Entry<String, TaskRoleDescriptor> taskRole : taskRoles.entrySet()) {
      String taskRoleName = taskRole.getKey();
      TaskRoleDescriptor taskRoleDescriptor = taskRole.getValue();
      newTaskRetryPolicies.put(taskRoleName, taskRoleDescriptor.getTaskRetryPolicy());
      newTaskServices.put(taskRoleName, taskRoleDescriptor.getTaskService());
      newTaskResources.put(taskRoleName, taskRoleDescriptor.getTaskService().getResource());
      newTaskPlatParams.put(taskRoleName, taskRoleDescriptor.getPlatformSpecificParameters());
    }
    taskRetryPolicies = newTaskRetryPolicies;
    taskServices = newTaskServices;
    taskResources = newTaskResources;
    taskPlatParams = newTaskPlatParams;
    Map<String, Integer> taskNumbers = getTaskNumbers(taskRoles);
    Map<String, Integer> serviceVersions = getServiceVersions(taskServices);

    // Notify AM to take actions for Request
    if (oldPlatParams == null) {
      // For the first time, send all Request to AM
      am.onServiceVersionsUpdated(serviceVersions);
      am.onTaskNumbersUpdated(taskNumbers);
      {
        // Only start them for the first time
        am.onStartRMResyncHandler();
        // Start TransitionTaskStateQueue at last, in case some Tasks in the queue
        // depend on the Request or previous AM Notify.
        am.onStartTransitionTaskStateQueue();
      }
    } else {
      // For the other times, only send changed Request to AM
      if (!CommonExts.equals(getServiceVersions(oldTaskServices), serviceVersions)) {
        am.onServiceVersionsUpdated(serviceVersions);
      }
      if (!CommonExts.equals(getTaskNumbers(oldTaskRoles), taskNumbers)) {
        am.onTaskNumbersUpdated(taskNumbers);
      }
    }
  }

  private void updateOverrideApplicationProgressRequest(
      OverrideApplicationProgressRequest newOverrideApplicationProgressRequest) throws IOException {
    if (YamlUtils.deepEquals(overrideApplicationProgressRequest, newOverrideApplicationProgressRequest)) {
      return;
    }

    LOGGER.logSplittedLines(Level.INFO,
        "Detected OverrideApplicationProgressRequest changes. Updating to new OverrideApplicationProgressRequest:\n%s",
        WebCommon.toJson(newOverrideApplicationProgressRequest));

    // No need to notify AM, since getApplicationProgress is CallIn instead of CallBack
    overrideApplicationProgressRequest = newOverrideApplicationProgressRequest;
  }

  private void updateMigrateTaskRequests(Map<String, MigrateTaskRequest> newMigrateTaskRequests) throws IOException {
    if (YamlUtils.deepEquals(migrateTaskRequests, newMigrateTaskRequests)) {
      return;
    }

    // MigrateTaskRequest only can be Added by User and Deleted by AM,
    // so here we only need to notify AM the Added.
    if (newMigrateTaskRequests != null) {
      for (String containerId : newMigrateTaskRequests.keySet()) {
        if (migrateTaskRequests == null || !migrateTaskRequests.containsKey(containerId)) {
          am.onMigrateTaskRequested(containerId, newMigrateTaskRequests.get(containerId));
        }
      }
    }

    migrateTaskRequests = CommonExts.asReadOnly(newMigrateTaskRequests);
  }

  private Map<String, Integer> getTaskNumbers(Map<String, TaskRoleDescriptor> taskRoles) {
    Map<String, Integer> taskNumbers = new HashMap<>();
    for (Map.Entry<String, TaskRoleDescriptor> taskRole : taskRoles.entrySet()) {
      taskNumbers.put(taskRole.getKey(), taskRole.getValue().getTaskNumber());
    }
    return taskNumbers;
  }

  private Map<String, Integer> getServiceVersions(Map<String, ServiceDescriptor> taskServices) {
    Map<String, Integer> serviceVersions = new HashMap<>();
    for (Map.Entry<String, ServiceDescriptor> taskService : taskServices.entrySet()) {
      serviceVersions.put(taskService.getKey(), taskService.getValue().getVersion());
    }
    return serviceVersions;
  }


  /**
   * REGION ReadInterface
   */
  public ClusterConfiguration getClusterConfiguration() {
    return clusterConfiguration;
  }

  public UserDescriptor getUser() {
    return user;
  }

  public PlatformSpecificParametersDescriptor getPlatParams() {
    return platParams;
  }

  public Map<String, TaskRoleDescriptor> getTaskRoles() {
    return taskRoles;
  }

  public Map<String, RetryPolicyDescriptor> getTaskRetryPolicies() {
    return taskRetryPolicies;
  }

  public Map<String, ServiceDescriptor> getTaskServices() {
    return taskServices;
  }

  public Map<String, ResourceDescriptor> getTaskResources() {
    return taskResources;
  }

  public int getTotalGpuCount() {
    int gpuCount = 0;
    Map<String, TaskRoleDescriptor> taskRolesSnapshot = taskRoles;
    for (TaskRoleDescriptor taskRoleDescriptor : taskRolesSnapshot.values()) {
      gpuCount += taskRoleDescriptor.getTaskService().getResource().getGpuNumber() * taskRoleDescriptor.getTaskNumber();
    }
    return gpuCount;
  }

  public Map<String, TaskRolePlatformSpecificParametersDescriptor> getTaskPlatParams() {
    return taskPlatParams;
  }

  public Integer getServiceVersion(String taskRoleName) {
    return taskRoles.get(taskRoleName).getTaskService().getVersion();
  }

  public Float getApplicationProgress() throws Exception {
    Float progress = overrideApplicationProgressRequest.getApplicationProgress().floatValue();
    if (progress >= 0) {
      return progress;
    } else {
      throw new Exception(String.format(
          "ApplicationProgress %s is not nonnegative", progress));
    }
  }

  public boolean existsLocalVersionFrameworkRequest() throws NotAvailableException {
    if (existsLocalVersionFrameworkRequest == -1) {
      throw new NotAvailableException("FrameworkRequest for local FrameworkVersion is not available");
    }
    return existsLocalVersionFrameworkRequest == 1;
  }

  /**
   * REGION Callbacks
   */
  public void onMigrateTaskRequestContainerReleased(String containerId) {
    try {
      LOGGER.logDebug("[%s]: onMigrateTaskRequestContainerReleased", containerId);
      launcherClient.deleteMigrateTask(conf.getFrameworkName(), containerId);
    } catch (Exception e) {
      // Best Effort to deleteMigrateTask
      LOGGER.logWarning(e,
          "[%s]: Failed to deleteMigrateTask", containerId);
    }
  }
}
