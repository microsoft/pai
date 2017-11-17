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

package com.microsoft.frameworklauncher.webserver;

import com.microsoft.frameworklauncher.common.exceptions.BadRequestException;
import com.microsoft.frameworklauncher.common.exceptions.ThrottledRequestException;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.utils.AbstractService;
import com.microsoft.frameworklauncher.utils.DefaultLogger;
import com.microsoft.frameworklauncher.utils.YamlUtils;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.zookeeper.KeeperException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import static com.microsoft.frameworklauncher.utils.CommonUtils.checkExist;

// Manage the CURD to ZK Request
public class RequestManager extends AbstractService {  // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(RequestManager.class);

  private final WebServer webServer;
  private final LauncherConfiguration conf;
  private final ZookeeperStore zkStore;


  /**
   * REGION BaseRequest
   */
  // WebServer only need to maintain AggregatedLauncherRequest, and it is the only maintainer.
  private LauncherRequest launcherRequest;
  // FrameworkName -> AggregatedFrameworkRequest
  private Map<String, AggregatedFrameworkRequest> aggFrameworkRequests;


  /**
   * REGION ExtensionRequest
   * ExtensionRequest should be always CONSISTENT with BaseRequest
   */
  private int totalTaskNumber = 0;


  /**
   * REGION AbstractService
   */
  public RequestManager(WebServer webServer, LauncherConfiguration conf, ZookeeperStore zkStore) {
    super(RequestManager.class.getName());
    this.webServer = webServer;
    this.conf = conf;
    this.zkStore = zkStore;
  }

  @Override
  protected Boolean handleException(Exception e) {
    super.handleException(e);

    LOGGER.logError(e,
        "Exception occurred in %1$s. %1$s will be stopped.",
        serviceName);

    // Rethrow is not work in another Thread, so using CallBack
    webServer.onExceptionOccurred(e);
    return false;
  }

  // No need to initialize for RequestManager
  // No need to run and stop for RequestManager, since all ZK and Mem Request
  // are always CONSISTENT.
  @Override
  protected void recover() throws Exception {
    super.recover();

    try {
      AggregatedLauncherRequest aggLauncherRequest = zkStore.getAggregatedLauncherRequest();
      launcherRequest = aggLauncherRequest.getLauncherRequest();
      aggFrameworkRequests = aggLauncherRequest.getAggregatedFrameworkRequests();
      totalTaskNumber = getTotalTaskNumber();

      LOGGER.logDebug("Total TaskNumber: %s", totalTaskNumber);
    } catch (KeeperException.NoNodeException e) {
      LOGGER.logInfo("Initializing LauncherRequest on ZK.");
      launcherRequest = new LauncherRequest();
      aggFrameworkRequests = new HashMap<>();
      zkStore.setLauncherRequest(launcherRequest);
    }

    // Continue previous deleteOrphanFrameworks to provide Atomic deleteFrameworkRequest
    deleteOrphanFrameworks();

    LOGGER.logInfo("Succeeded to recover %s.", serviceName);
  }


  /**
   * REGION InternalUtils
   */
  private boolean deleteFrameworkRequestInternal(String frameworkName) throws Exception {
    // Should success even if frameworkName does not exist
    zkStore.deleteFrameworkRequest(frameworkName);

    if (aggFrameworkRequests.containsKey(frameworkName)) {
      AggregatedFrameworkRequest aggFrameworkRequest = aggFrameworkRequests.get(frameworkName);
      int oldTotalTaskNumber = totalTaskNumber;
      int frameworkTaskNumber = getFrameworkTaskNumber(aggFrameworkRequest.getFrameworkRequest());
      totalTaskNumber -= frameworkTaskNumber;

      LOGGER.logDebug(
          "[%s]: deleteFrameworkRequestInternal: " +
              "New Total TaskNumber: %s, Old Total TaskNumber: %s, Framework TaskNumber: %s",
          frameworkName, totalTaskNumber, oldTotalTaskNumber, frameworkTaskNumber);
    }
    return aggFrameworkRequests.remove(frameworkName) == null;
  }

  // deleteOrphanFrameworks need to be handled in WebServer side instead of AM side,
  // since AM is not always running, such as when the FrameworkState is not APPLICATION_RUNNING.
  private void deleteOrphanFrameworks() throws Exception {
    // A Framework is Orphan, if and only if its ParentFramework is not null and Deleted.
    // Orphan Framework will be Deleted here, if its DeleteOnParentDeleted enabled.
    boolean frameworkDeletedInThisPass;
    do {
      frameworkDeletedInThisPass = false;

      for (AggregatedFrameworkRequest aggFrameworkRequest : new ArrayList<>(aggFrameworkRequests.values())) {
        FrameworkRequest frameworkRequest = aggFrameworkRequest.getFrameworkRequest();
        String frameworkName = frameworkRequest.getFrameworkName();
        ParentFrameworkDescriptor parentFramework =
            frameworkRequest.getFrameworkDescriptor().getParentFramework();

        if (parentFramework != null) {
          String parentFrameworkName = parentFramework.getParentFrameworkName();
          boolean deleteOnParentDeleted = parentFramework.isDeleteOnParentDeleted();
          if (deleteOnParentDeleted && !aggFrameworkRequests.containsKey(parentFrameworkName)) {
            LOGGER.logInfo(
                "[%s]: deleteOrphanFrameworks: " +
                    "Since its DeleteOnParentDeleted enabled and its ParentFramework [%s] Deleted",
                frameworkName, parentFrameworkName);

            deleteFrameworkRequestInternal(frameworkName);
            frameworkDeletedInThisPass = true;
          }
        }
      }
    } while (frameworkDeletedInThisPass);
  }

  private void gcCompletedFrameworks(Map<String, FrameworkStatus> completedFrameworkStatuses) throws Exception {
    Long currentTimestamp = System.currentTimeMillis();
    for (FrameworkStatus completedFrameworkStatus : completedFrameworkStatuses.values()) {
      String frameworkName = completedFrameworkStatus.getFrameworkName();
      Integer frameworkVersion = completedFrameworkStatus.getFrameworkVersion();
      Long frameworkCompletedTimestamp = completedFrameworkStatus.getFrameworkCompletedTimestamp();

      if (!aggFrameworkRequests.containsKey(frameworkName)) {
        // Framework is already deleted.
        continue;
      }

      FrameworkRequest frameworkRequest = aggFrameworkRequests.get(frameworkName).getFrameworkRequest();
      if (frameworkRequest.getFrameworkDescriptor().getVersion().equals(frameworkVersion)) {
        // Framework is already upgraded.
        // Note although FrameworkStatus maybe older than FrameworkRequest, it is still unchanged if version matched,
        // since CompletedFrameworks are in FINAL_STATES.
        // So, FrameworkStatus should be synced with FrameworkRequest if version matched.
        continue;
      }

      if (frameworkRequest.getLaunchClientType() == LaunchClientType.DATA_DEPLOYMENT) {
        // Framework launched by DataDeployment should be totally managed by DataDeploymentManager.
        continue;
      }

      if (currentTimestamp - frameworkCompletedTimestamp <= conf.getFrameworkCompletedRetainSec()) {
        // Framework should be retained in recent FrameworkCompletedRetainSec.
        continue;
      }

      // Framework is allowed to GC now.
      LOGGER.logInfo(
          "[%s]: gcCompletedFrameworks: " +
              "Since its FrameworkCompletedTime [%s] is beyond the FrameworkCompletedRetainSec [%s] now [{%s}]",
          frameworkName,
          frameworkCompletedTimestamp,
          conf.getFrameworkCompletedRetainSec(),
          currentTimestamp);

      deleteFrameworkRequest(frameworkName);
    }
  }

  private int getFrameworkTaskNumber(FrameworkRequest frameworkRequest) {
    int frameworkTaskNumber = 0;
    for (TaskRoleDescriptor taskRole : frameworkRequest.getFrameworkDescriptor().getTaskRoles().values()) {
      frameworkTaskNumber += taskRole.getTaskNumber();
    }
    return frameworkTaskNumber;
  }

  private int getTotalTaskNumber() {
    int totalTaskNumber = 0;
    for (AggregatedFrameworkRequest aggFrameworkRequest : aggFrameworkRequests.values()) {
      FrameworkRequest frameworkRequest = aggFrameworkRequest.getFrameworkRequest();
      totalTaskNumber += getFrameworkTaskNumber(frameworkRequest);
    }
    return totalTaskNumber;
  }

  /**
   * REGION ReadInterface
   */
  public synchronized LauncherRequest getLauncherRequest() throws Exception {
    return YamlUtils.deepCopy(launcherRequest, LauncherRequest.class);
  }

  public synchronized RequestedFrameworkNames getFrameworkNames(LaunchClientType clientType) {
    ArrayList<String> frameworkNames = new ArrayList<>();

    for (AggregatedFrameworkRequest aggFrameworkRequest : aggFrameworkRequests.values()) {
      if (clientType == null ||
          clientType == aggFrameworkRequest.getFrameworkRequest().getLaunchClientType()) {
        frameworkNames.add(aggFrameworkRequest.getFrameworkRequest().getFrameworkName());
      }
    }

    RequestedFrameworkNames requestedFrameworkNames = new RequestedFrameworkNames();
    requestedFrameworkNames.setFrameworkNames(frameworkNames);
    return requestedFrameworkNames;
  }

  public synchronized AggregatedFrameworkRequest getAggregatedFrameworkRequest(String frameworkName) throws Exception {
    return YamlUtils.deepCopy(checkExist(aggFrameworkRequests.get(frameworkName)), AggregatedFrameworkRequest.class);
  }

  public synchronized FrameworkRequest getFrameworkRequest(String frameworkName) throws Exception {
    return YamlUtils.deepCopy(checkExist(aggFrameworkRequests.get(frameworkName)).getFrameworkRequest(), FrameworkRequest.class);
  }


  /**
   * REGION ModifyInterface
   */
  // Note to avoid update partially modified Request on ZK
  public synchronized void setFrameworkRequest(
      String frameworkName, FrameworkRequest frameworkRequest)
      throws Exception {
    ParentFrameworkDescriptor parentFramework = frameworkRequest.getFrameworkDescriptor().getParentFramework();
    if (parentFramework != null) {
      String parentFrameworkName = parentFramework.getParentFrameworkName();
      boolean deleteOnParentDeleted = parentFramework.isDeleteOnParentDeleted();
      if (deleteOnParentDeleted && !aggFrameworkRequests.containsKey(parentFrameworkName) &&
          !frameworkName.equals(parentFrameworkName)) {
        // Reject future child Frameworks
        throw new BadRequestException(String.format(
            "[%s]: setFrameworkRequest Rejected: " +
                "Since its DeleteOnParentDeleted enabled and its ParentFramework [%s] Deleted",
            frameworkName, parentFrameworkName));
      }
    }

    int frameworkTaskNumber = getFrameworkTaskNumber(frameworkRequest);
    int newTotalTaskNumber = totalTaskNumber + frameworkTaskNumber;
    if (aggFrameworkRequests.containsKey(frameworkName)) {
      FrameworkRequest oldFrameworkRequest = aggFrameworkRequests.get(frameworkName).getFrameworkRequest();
      newTotalTaskNumber -= getFrameworkTaskNumber(oldFrameworkRequest);
    }

    if (newTotalTaskNumber > conf.getMaxTotalTaskNumber()) {
      throw new ThrottledRequestException(String.format(
          "[%s]: setFrameworkRequest Rejected: " +
              "Since the New Total TaskNumber %s will exceed the Max Total TaskNumber %s",
          frameworkName, newTotalTaskNumber, conf.getMaxTotalTaskNumber()));
    } else {
      zkStore.setFrameworkRequest(frameworkName, frameworkRequest);

      LOGGER.logDebug("[%s]: setFrameworkRequest: " +
              "New Total TaskNumber: %s, Old Total TaskNumber: %s, Framework TaskNumber: %s",
          frameworkName, newTotalTaskNumber, totalTaskNumber, frameworkTaskNumber);
      totalTaskNumber = newTotalTaskNumber;
    }

    if (!aggFrameworkRequests.containsKey(frameworkName)) {
      aggFrameworkRequests.put(frameworkName, new AggregatedFrameworkRequest());
    }
    aggFrameworkRequests.get(frameworkName).setFrameworkRequest(frameworkRequest);
  }

  public synchronized void deleteFrameworkRequest(
      String frameworkName)
      throws Exception {
    // Should success even if frameworkName does not exist
    if (deleteFrameworkRequestInternal(frameworkName)) {
      // Delete existing child Frameworks
      deleteOrphanFrameworks();
    }
  }

  public synchronized void deleteMigrateTaskRequest(
      String frameworkName, String containerId)
      throws Exception {
    // Should success even if frameworkName and containerId does not exist
    zkStore.deleteMigrateTaskRequest(frameworkName, containerId);
    try {
      aggFrameworkRequests.get(frameworkName).getMigrateTaskRequests().remove(containerId);
    } catch (Exception ignored) {
    }
  }

  public synchronized void updateTaskNumber(
      String frameworkName, String taskRoleName, UpdateTaskNumberRequest updateTaskNumberRequest)
      throws Exception {
    FrameworkRequest frameworkRequest = YamlUtils.deepCopy(
        checkExist(aggFrameworkRequests.get(frameworkName)).getFrameworkRequest(), FrameworkRequest.class);
    Map<String, TaskRoleDescriptor> taskRoles = frameworkRequest.getFrameworkDescriptor().getTaskRoles();
    TaskRoleDescriptor taskRole = checkExist(taskRoles.get(taskRoleName));
    taskRole.setTaskNumber(updateTaskNumberRequest.getTaskNumber());
    setFrameworkRequest(frameworkName, frameworkRequest);
  }

  public synchronized void updateMigrateTask(
      String frameworkName, String containerId, MigrateTaskRequest migrateTaskRequest)
      throws Exception {
    // Check whether frameworkName exists first
    AggregatedFrameworkRequest aggFrameworkRequest = checkExist(aggFrameworkRequests.get(frameworkName));
    zkStore.setMigrateTaskRequest(frameworkName, containerId, migrateTaskRequest);
    if (aggFrameworkRequest.getMigrateTaskRequests() == null) {
      aggFrameworkRequest.setMigrateTaskRequests(new HashMap<>());
    }
    aggFrameworkRequest.getMigrateTaskRequests().put(containerId, migrateTaskRequest);
  }

  public synchronized void updateApplicationProgress(
      String frameworkName, OverrideApplicationProgressRequest overrideApplicationProgressRequest)
      throws Exception {
    // Check whether frameworkName exists first
    AggregatedFrameworkRequest aggFrameworkRequest = checkExist(aggFrameworkRequests.get(frameworkName));
    zkStore.setOverrideApplicationProgressRequest(frameworkName, overrideApplicationProgressRequest);
    aggFrameworkRequest.setOverrideApplicationProgressRequest(overrideApplicationProgressRequest);
  }

  public synchronized void updateDataDeploymentVersion(UpdateDataDeploymentVersionRequest updateDataDeploymentVersionRequest) throws Exception {
    LauncherRequest newLauncherRequest = YamlUtils.deepCopy(launcherRequest, LauncherRequest.class);
    if (updateDataDeploymentVersionRequest.getDataDeploymentVersionType() == DataDeploymentVersionType.LAUNCHING) {
      newLauncherRequest.setLaunchingDataDeploymentVersion(updateDataDeploymentVersionRequest.getDataDeploymentVersion());
    } else if (updateDataDeploymentVersionRequest.getDataDeploymentVersionType() == DataDeploymentVersionType.LAUNCHED) {
      newLauncherRequest.setLaunchedDataDeploymentVersion(updateDataDeploymentVersionRequest.getDataDeploymentVersion());
    }
    zkStore.setLauncherRequest(newLauncherRequest);
    launcherRequest = newLauncherRequest;
  }

  /**
   * REGION Callbacks
   */
  public synchronized void onCompletedFrameworkStatusesUpdated(
      Map<String, FrameworkStatus> completedFrameworkStatuses)
      throws Exception {
    if (completedFrameworkStatuses.size() > 0) {
      gcCompletedFrameworks(completedFrameworkStatuses);
    }
  }
}