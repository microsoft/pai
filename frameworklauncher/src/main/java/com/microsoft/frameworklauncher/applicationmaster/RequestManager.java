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
import com.microsoft.frameworklauncher.common.exceptions.TransientException;
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
  private volatile AggregatedFrameworkRequest aggFrameworkRequest = null;
  private volatile FrameworkDescriptor frameworkDescriptor = null;
  private volatile OverrideApplicationProgressRequest overrideApplicationProgressRequest = null;
  // ContainerId -> MigrateTaskRequest
  private volatile Map<String, MigrateTaskRequest> migrateTaskRequests = null;


  /**
   * REGION StateVariable
   */
  private volatile Boolean existsLocalVersionFrameworkRequest;


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
  @Override
  protected void recover() throws Exception {
    super.recover();

    checkAmVersion();
    pullRequest();

    LOGGER.logInfo("Succeeded to recover %s.", serviceName);
  }

  // No need to stop ongoing Thread, since zkStore is Atomic
  @Override
  protected void run() throws Exception {
    super.run();

    new Thread(() -> {
      while (true) {
        try {
          Thread.sleep(conf.getLauncherConfig().getAmRequestPullIntervalSec() * 1000);

          checkAmVersion();
          pullRequest();
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
    AggregatedFrameworkRequest newAggFrameworkRequest;
    try {
      LOGGER.logDebug("Pulling AggregatedFrameworkRequest");
      newAggFrameworkRequest = zkStore.getAggregatedFrameworkRequest(conf.getFrameworkName());
      LOGGER.logDebug("Pulled AggregatedFrameworkRequest");
    } catch (NoNodeException e) {
      existsLocalVersionFrameworkRequest = false;
      throw new NonTransientException(
          "Failed to getAggregatedFrameworkRequest, FrameworkRequest is already deleted on ZK", e);
    }

    // newFrameworkDescriptor is always not null
    FrameworkDescriptor newFrameworkDescriptor = newAggFrameworkRequest.getFrameworkRequest().getFrameworkDescriptor();
    updateFrameworkDescriptor(newFrameworkDescriptor);
    updateOverrideApplicationProgressRequest(newAggFrameworkRequest.getOverrideApplicationProgressRequest());
    updateMigrateTaskRequests(newAggFrameworkRequest.getMigrateTaskRequests());
    aggFrameworkRequest = newAggFrameworkRequest;
  }

  private void updateLauncherRequest(LauncherRequest newLauncherRequest) throws Exception {
    if (YamlUtils.deepEquals(launcherRequest, newLauncherRequest)) {
      return;
    }

    LOGGER.logSplittedLines(Level.DEBUG,
        "Detected LauncherRequest changes. Updating to new LauncherRequest:\n%s",
        WebCommon.toJson(newLauncherRequest));

    launcherRequest = newLauncherRequest;
  }

  private void checkFrameworkVersion(FrameworkDescriptor newFrameworkDescriptor) throws Exception {
    if (!newFrameworkDescriptor.getVersion().equals(conf.getFrameworkVersion())) {
      existsLocalVersionFrameworkRequest = false;
      throw new NonTransientException(String.format(
          "FrameworkVersion mismatch: Local Version %s, Latest Version %s",
          conf.getFrameworkVersion(), newFrameworkDescriptor.getVersion()));
    } else {
      existsLocalVersionFrameworkRequest = true;
    }
  }

  private void flattenFrameworkDescriptor(FrameworkDescriptor newFrameworkDescriptor) {
    PlatformSpecificParametersDescriptor platParams = newFrameworkDescriptor.getPlatformSpecificParameters();

    // platParams inherits YARN default params if it is null.
    if (platParams.getTaskNodeLabel() == null) {
      platParams.setTaskNodeLabel(platParams.getAmNodeLabel());
    }
    if (platParams.getTaskNodeLabel() == null) {
      platParams.setTaskNodeLabel(conf.getAmQueueDefaultNodeLabel());
    }

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

  // This is already validated at LauncherWebServer, so here should be transient error,
  // and should migrate to another node afterwards.
  private void checkUnsupportedHadoopFeatures(FrameworkDescriptor newFrameworkDescriptor) throws Exception {
    if (!ResourceDescriptor.checkHadoopLibrarySupportsGpu() && newFrameworkDescriptor.containsGpuResource()) {
      throw new TransientException(
          "Found Gpu in Resource Request, but local hadoop library doesn't support Gpu");
    }
    if (!ResourceDescriptor.checkHadoopLibrarySupportsPort() && newFrameworkDescriptor.containsPortResource()) {
      throw new TransientException(
          "Found Port in Resource Request, but local hadoop library doesn't support Port");
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
    flattenFrameworkDescriptor(newFrameworkDescriptor);

    if (YamlUtils.deepEquals(frameworkDescriptor, newFrameworkDescriptor)) {
      return;
    }

    LOGGER.logSplittedLines(Level.INFO,
        "Detected FrameworkDescriptor changes. Updating to new flattened FrameworkDescriptor:\n%s",
        WebCommon.toJson(newFrameworkDescriptor));

    checkFrameworkVersion(newFrameworkDescriptor);
    checkUnsupportedHadoopFeatures(newFrameworkDescriptor);
    checkUnsupportedOnTheFlyChanges(newFrameworkDescriptor);

    // Backup old to detect changes
    FrameworkDescriptor oldFrameworkDescriptor = frameworkDescriptor;

    // Replace on the fly FrameworkDescriptor with newFrameworkDescriptor.
    // The operation is Atomic, since it only modifies the reference.
    // So, the on going read for the old FrameworkDescriptor will not get intermediate results
    frameworkDescriptor = newFrameworkDescriptor;
    Map<String, Integer> serviceVersions = frameworkDescriptor.extractServiceVersions();
    Map<String, Integer> taskNumbers = frameworkDescriptor.extractTaskNumbers();

    // Notify AM to take actions for Request
    if (oldFrameworkDescriptor == null) {
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
      if (!CommonExts.equals(oldFrameworkDescriptor.extractServiceVersions(), serviceVersions)) {
        am.onServiceVersionsUpdated(serviceVersions);
      }
      if (!CommonExts.equals(oldFrameworkDescriptor.extractTaskNumbers(), taskNumbers)) {
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

  /**
   * REGION ReadInterface
   */
  public ClusterConfiguration getClusterConfiguration() {
    return launcherRequest.getClusterConfiguration();
  }

  public AggregatedFrameworkRequest getAggregatedFrameworkRequest() {
    return aggFrameworkRequest;
  }

  public UserDescriptor getUser() {
    return frameworkDescriptor.getUser();
  }

  public PlatformSpecificParametersDescriptor getPlatParams() {
    return frameworkDescriptor.getPlatformSpecificParameters();
  }

  public int getTotalGpuCount() {
    return frameworkDescriptor.calcTotalGpuCount();
  }

  public TaskRoleDescriptor getTaskRole(String taskRoleName) {
    return frameworkDescriptor.getTaskRoles().get(taskRoleName);
  }

  public RetryPolicyDescriptor getTaskRetryPolicy(String taskRoleName) {
    return getTaskRole(taskRoleName).getTaskRetryPolicy();
  }

  public TaskRoleApplicationCompletionPolicyDescriptor getTaskRoleApplicationCompletionPolicy(String taskRoleName) {
    return getTaskRole(taskRoleName).getApplicationCompletionPolicy();
  }

  public TaskRolePlatformSpecificParametersDescriptor getTaskRolePlatParams(String taskRoleName) {
    return getTaskRole(taskRoleName).getPlatformSpecificParameters();
  }

  public ServiceDescriptor getTaskService(String taskRoleName) {
    return getTaskRole(taskRoleName).getTaskService();
  }

  public ResourceDescriptor getTaskResource(String taskRoleName) {
    return getTaskService(taskRoleName).getResource();
  }

  public Integer getServiceVersion(String taskRoleName) {
    return getTaskService(taskRoleName).getVersion();
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

  public Boolean existsLocalVersionFrameworkRequest() {
    return existsLocalVersionFrameworkRequest;
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
