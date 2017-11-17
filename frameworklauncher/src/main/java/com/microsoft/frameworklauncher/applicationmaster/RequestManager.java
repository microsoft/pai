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

import com.microsoft.frameworklauncher.common.LauncherClientInternal;
import com.microsoft.frameworklauncher.common.WebCommon;
import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import com.microsoft.frameworklauncher.common.exceptions.NotAvailableException;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.utils.*;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.commons.lang.StringUtils;
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
  private final LauncherClientInternal launcherClient;


  /**
   * REGION BaseRequest
   */
  // AM only need to retrieve AggregatedFrameworkRequest
  private FrameworkDescriptor frameworkDescriptor = null;
  private OverrideApplicationProgressRequest overrideApplicationProgressRequest = null;
  // ContainerId -> MigrateTaskRequest
  private Map<String, MigrateTaskRequest> migrateTaskRequests = null;


  /**
   * REGION ExtensionRequest
   * ExtensionRequest should be always CONSISTENT with BaseRequest
   */
  private PlatformSpecificParametersDescriptor platParams;
  // TaskRoleName -> TaskRoleDescriptor
  private Map<String, TaskRoleDescriptor> taskRoles;
  // TaskRoleName -> RetryPolicyDescriptor
  private Map<String, RetryPolicyDescriptor> taskRetryPolicies;
  // TaskRoleName -> ServiceDescriptor
  private Map<String, ServiceDescriptor> taskServices;
  // TaskRoleName -> ResourceDescriptor
  private Map<String, ResourceDescriptor> taskResources;


  /**
   * REGION StateVariable
   */
  // -1: not available, 0: does not exist, 1: exists
  private volatile int existsLocalVersionFrameworkRequest = -1;

  // Used to workaround for bug YARN-314.
  // If there are multiple TaskRoles in one Framework and these TaskRoles has different Resource specified,
  // we need to make sure the Priority for each TaskRoles is also different, otherwise some TaskRoles may not get resources to run.
  // Note:
  // 1. With this workaround, User cannot control the Priority anymore.
  // 2. No need to persistent this info, since the bug only happens within one application attempt.
  // TaskRoleName -> RevisedPriority
  private final Map<String, Integer> taskRevisedPriority = new HashMap<>();


  /**
   * REGION AbstractService
   */
  public RequestManager(ApplicationMaster am, Configuration conf, ZookeeperStore zkStore, LauncherClientInternal launcherClient) {
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
        } catch (Exception e) {
          // Directly throw TransientException to AM to actively migrate to another node
          handleException(e);
        } finally {
          try {
            Thread.sleep(conf.getLauncherConfig().getAmRequestPullIntervalSec() * 1000);
          } catch (InterruptedException e) {
            handleException(e);
          }
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
    reviseFrameworkDescriptor(newFrameworkDescriptor);
    updateFrameworkDescriptor(newFrameworkDescriptor);
    updateOverrideApplicationProgressRequest(aggFrameworkRequest.getOverrideApplicationProgressRequest());
    updateMigrateTaskRequests(aggFrameworkRequest.getMigrateTaskRequests());
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

  private void reviseFrameworkDescriptor(FrameworkDescriptor newFrameworkDescriptor) {
    Map<String, TaskRoleDescriptor> frameworkTaskRoles = newFrameworkDescriptor.getTaskRoles();
    for (Map.Entry<String, TaskRoleDescriptor> taskRole : frameworkTaskRoles.entrySet()) {
      String taskRoleName = taskRole.getKey();
      if (!taskRevisedPriority.containsKey(taskRoleName)) {
        taskRevisedPriority.put(taskRoleName, taskRevisedPriority.size());
      }
      taskRole.getValue().setPriority(taskRevisedPriority.get(taskRoleName));
    }
  }

  private void checkUnsupportedOnTheFlyChanges(FrameworkDescriptor newFrameworkDescriptor) throws Exception {
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
    platParams = frameworkDescriptor.getPlatformSpecificParameters();
    taskRoles = frameworkDescriptor.getTaskRoles();
    taskRetryPolicies = new HashMap<>();
    taskServices = new HashMap<>();
    taskResources = new HashMap<>();
    for (Map.Entry<String, TaskRoleDescriptor> taskRole : taskRoles.entrySet()) {
      taskRetryPolicies.put(taskRole.getKey(), taskRole.getValue().getTaskRetryPolicy());
      taskServices.put(taskRole.getKey(), taskRole.getValue().getTaskService());
      taskResources.put(taskRole.getKey(), taskRole.getValue().getTaskService().getResource());
    }
    Map<String, Integer> taskNumbers = getTaskNumbers(taskRoles);
    Map<String, Integer> serviceVersions = getServiceVersions(taskServices);

    // Notify AM to take actions for Request
    if (oldPlatParams == null) {
      // For the first time, send all Request to AM
      am.onTaskNodeLabelUpdated(platParams.getTaskNodeLabel());
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
      if (!StringUtils.equals(oldPlatParams.getTaskNodeLabel(), platParams.getTaskNodeLabel())) {
        am.onTaskNodeLabelUpdated(platParams.getTaskNodeLabel());
      }
      if (!CommonExtensions.equals(getServiceVersions(oldTaskServices), serviceVersions)) {
        am.onServiceVersionsUpdated(serviceVersions);
      }
      if (!CommonExtensions.equals(getTaskNumbers(oldTaskRoles), taskNumbers)) {
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

    migrateTaskRequests = CommonExtensions.asReadOnly(newMigrateTaskRequests);
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
