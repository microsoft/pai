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
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.service.AbstractService;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.utils.YamlUtils;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.zookeeper.KeeperException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.locks.ReentrantReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock.ReadLock;
import java.util.concurrent.locks.ReentrantReadWriteLock.WriteLock;

import static com.microsoft.frameworklauncher.common.utils.CommonUtils.checkExist;

// Manage the CURD to ZK Request
public class RequestManager extends AbstractService {  // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(RequestManager.class);

  private final WebServer webServer;
  private final LauncherConfiguration conf;
  private final ZookeeperStore zkStore;
  private final ReadLock readLock;
  private final WriteLock writeLock;


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

    // Using FairSync to avoid potential reader starvation for a long time.
    ReentrantReadWriteLock lock = new ReentrantReadWriteLock(true);
    this.readLock = lock.readLock();
    this.writeLock = lock.writeLock();
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
    // Continue previous stopOrphanFrameworks to provide Atomic updateExecutionType, i.e. stopFrameworkRequest
    stopOrphanFrameworks();

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
    // A Framework is DeleteOrphan, if and only if its ParentFramework is not null and Deleted.
    // DeleteOrphan Framework will be Deleted here, if its DeleteOnParentDeleted enabled.
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

  private void updateExecutionTypeInternal(String frameworkName, ExecutionType executionType) throws Exception {
    FrameworkRequest frameworkRequest = YamlUtils.deepCopy(
        checkExist(aggFrameworkRequests.get(frameworkName)).getFrameworkRequest(), FrameworkRequest.class);
    frameworkRequest.getFrameworkDescriptor().setExecutionType(executionType);
    setFrameworkRequest(frameworkName, frameworkRequest);
  }

  private void stopFrameworkRequestInternal(String frameworkName) throws Exception {
    updateExecutionTypeInternal(frameworkName, ExecutionType.STOP);
  }

  // stopOrphanFrameworks need to be handled in WebServer side instead of AM side,
  // since AM is not always running, such as when the FrameworkState is not APPLICATION_RUNNING.
  private void stopOrphanFrameworks() throws Exception {
    // A Framework is StopOrphan, if and only if its ParentFramework is not null and Stopped.
    // StopOrphan Framework will be Stopped here, if its StopOnParentStopped enabled.
    boolean frameworkStoppedInThisPass;
    do {
      frameworkStoppedInThisPass = false;

      for (AggregatedFrameworkRequest aggFrameworkRequest : new ArrayList<>(aggFrameworkRequests.values())) {
        FrameworkRequest frameworkRequest = aggFrameworkRequest.getFrameworkRequest();
        String frameworkName = frameworkRequest.getFrameworkName();
        FrameworkDescriptor frameworkDescriptor = frameworkRequest.getFrameworkDescriptor();
        ExecutionType executionType = frameworkDescriptor.getExecutionType();
        ParentFrameworkDescriptor parentFramework = frameworkDescriptor.getParentFramework();

        if (parentFramework != null) {
          String parentFrameworkName = parentFramework.getParentFrameworkName();
          boolean stopOnParentStopped = parentFramework.isStopOnParentStopped();
          if (stopOnParentStopped && executionType != ExecutionType.STOP &&
              aggFrameworkRequests.containsKey(parentFrameworkName) &&
              aggFrameworkRequests.get(parentFrameworkName).getFrameworkRequest().
                  getFrameworkDescriptor().getExecutionType() == ExecutionType.STOP) {
            LOGGER.logInfo(
                "[%s]: stopOrphanFrameworks: " +
                    "Since its StopOnParentStopped enabled and its ParentFramework [%s] Stopped",
                frameworkName, parentFrameworkName);

            stopFrameworkRequestInternal(frameworkName);
            frameworkStoppedInThisPass = true;
          }
        }
      }
    } while (frameworkStoppedInThisPass);
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
      if (!frameworkRequest.getFrameworkDescriptor().getVersion().equals(frameworkVersion)) {
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

      if (currentTimestamp - frameworkCompletedTimestamp <= conf.getFrameworkCompletedRetainSec() * 1000) {
        // Framework should be retained in recent FrameworkCompletedRetainSec.
        continue;
      }

      // Framework is allowed to GC now.
      LOGGER.logInfo(
          "[%s]: gcCompletedFrameworks: " +
              "Since its FrameworkCompletedTime [%sms] is beyond the FrameworkCompletedRetainSec [%ss] now [%sms]",
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
   * For some data which will not be partially updated, such as launcherRequest and frameworkRequest,
   * we can just return a reference instead of a cloned snapshot in case of later changes.
   */
  public LauncherRequest getLauncherRequest() throws Exception {
    return CommonUtils.executeWithLock(readLock, () -> launcherRequest);
  }

  public List<FrameworkRequest> getFrameworkRequests(LaunchClientType clientType, String userName) throws Exception {
    return CommonUtils.executeWithLock(readLock, () -> {
      List<FrameworkRequest> frameworkRequests = new ArrayList<>();

      for (AggregatedFrameworkRequest aggFrameworkRequest : aggFrameworkRequests.values()) {
        FrameworkRequest frameworkRequest = aggFrameworkRequest.getFrameworkRequest();

        if (clientType != null &&
            !clientType.equals(frameworkRequest.getLaunchClientType())) {
          continue;
        }
        if (userName != null &&
            !userName.equals(frameworkRequest.getFrameworkDescriptor().getUser().getName())) {
          continue;
        }

        frameworkRequests.add(frameworkRequest);
      }

      return frameworkRequests;
    });
  }

  public AggregatedFrameworkRequest getAggregatedFrameworkRequest(String frameworkName) throws Exception {
    return CommonUtils.executeWithLock(readLock, () ->
        YamlUtils.deepCopy(checkExist(aggFrameworkRequests.get(frameworkName)), AggregatedFrameworkRequest.class));
  }

  public FrameworkRequest getFrameworkRequest(String frameworkName) throws Exception {
    return CommonUtils.executeWithLock(readLock, () ->
        checkExist(aggFrameworkRequests.get(frameworkName)).getFrameworkRequest());
  }

  public ClusterConfiguration getClusterConfiguration() throws Exception {
    return CommonUtils.executeWithLock(readLock, () -> launcherRequest.getClusterConfiguration());
  }

  public AclConfiguration getAclConfiguration() throws Exception {
    return CommonUtils.executeWithLock(readLock, () -> launcherRequest.getAclConfiguration());
  }

  /**
   * REGION ModifyInterface
   */
  // Note to avoid update partially modified Request on ZK
  public void setFrameworkRequest(
      String frameworkName, FrameworkRequest frameworkRequest)
      throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      FrameworkDescriptor frameworkDescriptor = frameworkRequest.getFrameworkDescriptor();
      ExecutionType executionType = frameworkDescriptor.getExecutionType();
      ParentFrameworkDescriptor parentFramework = frameworkDescriptor.getParentFramework();

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

        boolean stopOnParentStopped = parentFramework.isStopOnParentStopped();
        if (stopOnParentStopped && executionType != ExecutionType.STOP &&
            aggFrameworkRequests.containsKey(parentFrameworkName) &&
            aggFrameworkRequests.get(parentFrameworkName).getFrameworkRequest().
                getFrameworkDescriptor().getExecutionType() == ExecutionType.STOP) {
          // Stop future child Frameworks
          executionType = ExecutionType.STOP;
          frameworkDescriptor.setExecutionType(executionType);
        }
      }

      Long currentTimestamp = System.currentTimeMillis();
      int frameworkTaskNumber = getFrameworkTaskNumber(frameworkRequest);
      int newTotalTaskNumber = totalTaskNumber + frameworkTaskNumber;
      if (aggFrameworkRequests.containsKey(frameworkName)) {
        FrameworkRequest oldFrameworkRequest = aggFrameworkRequests.get(frameworkName).getFrameworkRequest();
        newTotalTaskNumber -= getFrameworkTaskNumber(oldFrameworkRequest);
        frameworkRequest.setFirstRequestTimestamp(oldFrameworkRequest.getFirstRequestTimestamp());
      } else {
        frameworkRequest.setFirstRequestTimestamp(currentTimestamp);
      }
      frameworkRequest.setLastRequestTimestamp(currentTimestamp);

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

      if (executionType == ExecutionType.STOP) {
        // Stop existing child Frameworks
        stopOrphanFrameworks();
      }
    });
  }

  public void deleteFrameworkRequest(
      String frameworkName)
      throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      // Should success even if frameworkName does not exist
      if (deleteFrameworkRequestInternal(frameworkName)) {
        // Delete existing child Frameworks
        deleteOrphanFrameworks();
      }
    });
  }

  public void deleteMigrateTaskRequest(
      String frameworkName, String containerId)
      throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      // Should success even if frameworkName and containerId does not exist
      zkStore.deleteMigrateTaskRequest(frameworkName, containerId);
      try {
        aggFrameworkRequests.get(frameworkName).getMigrateTaskRequests().remove(containerId);
      } catch (Exception ignored) {
      }
    });
  }

  public void updateTaskNumber(
      String frameworkName, String taskRoleName, UpdateTaskNumberRequest updateTaskNumberRequest)
      throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      FrameworkRequest frameworkRequest = YamlUtils.deepCopy(
          checkExist(aggFrameworkRequests.get(frameworkName)).getFrameworkRequest(), FrameworkRequest.class);
      Map<String, TaskRoleDescriptor> taskRoles = frameworkRequest.getFrameworkDescriptor().getTaskRoles();
      TaskRoleDescriptor taskRole = checkExist(taskRoles.get(taskRoleName));
      taskRole.setTaskNumber(updateTaskNumberRequest.getTaskNumber());
      setFrameworkRequest(frameworkName, frameworkRequest);
    });
  }

  public void updateExecutionType(
      String frameworkName, UpdateExecutionTypeRequest updateExecutionTypeRequest)
      throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      updateExecutionTypeInternal(frameworkName, updateExecutionTypeRequest.getExecutionType());
    });
  }

  public void updateMigrateTask(
      String frameworkName, String containerId, MigrateTaskRequest migrateTaskRequest)
      throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      // Check whether frameworkName exists first
      AggregatedFrameworkRequest aggFrameworkRequest = checkExist(aggFrameworkRequests.get(frameworkName));
      zkStore.setMigrateTaskRequest(frameworkName, containerId, migrateTaskRequest);
      if (aggFrameworkRequest.getMigrateTaskRequests() == null) {
        aggFrameworkRequest.setMigrateTaskRequests(new HashMap<>());
      }
      aggFrameworkRequest.getMigrateTaskRequests().put(containerId, migrateTaskRequest);
    });
  }

  public void updateApplicationProgress(
      String frameworkName, OverrideApplicationProgressRequest overrideApplicationProgressRequest)
      throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      // Check whether frameworkName exists first
      AggregatedFrameworkRequest aggFrameworkRequest = checkExist(aggFrameworkRequests.get(frameworkName));
      zkStore.setOverrideApplicationProgressRequest(frameworkName, overrideApplicationProgressRequest);
      aggFrameworkRequest.setOverrideApplicationProgressRequest(overrideApplicationProgressRequest);
    });
  }

  public void updateDataDeploymentVersion(UpdateDataDeploymentVersionRequest updateDataDeploymentVersionRequest) throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      LauncherRequest newLauncherRequest = YamlUtils.deepCopy(launcherRequest, LauncherRequest.class);
      if (updateDataDeploymentVersionRequest.getDataDeploymentVersionType() == DataDeploymentVersionType.LAUNCHING) {
        newLauncherRequest.setLaunchingDataDeploymentVersion(updateDataDeploymentVersionRequest.getDataDeploymentVersion());
      } else if (updateDataDeploymentVersionRequest.getDataDeploymentVersionType() == DataDeploymentVersionType.LAUNCHED) {
        newLauncherRequest.setLaunchedDataDeploymentVersion(updateDataDeploymentVersionRequest.getDataDeploymentVersion());
      }
      zkStore.setLauncherRequest(newLauncherRequest);
      launcherRequest = newLauncherRequest;
    });
  }

  public void updateClusterConfiguration(ClusterConfiguration clusterConfiguration) throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      LauncherRequest newLauncherRequest = YamlUtils.deepCopy(launcherRequest, LauncherRequest.class);
      newLauncherRequest.setClusterConfiguration(clusterConfiguration);
      zkStore.setLauncherRequest(newLauncherRequest);
      launcherRequest = newLauncherRequest;
    });
  }

  public void updateAclConfiguration(AclConfiguration aclConfiguration) throws Exception {
    CommonUtils.executeWithLock(writeLock, () -> {
      LauncherRequest newLauncherRequest = YamlUtils.deepCopy(launcherRequest, LauncherRequest.class);
      newLauncherRequest.setAclConfiguration(aclConfiguration);
      zkStore.setLauncherRequest(newLauncherRequest);
      launcherRequest = newLauncherRequest;
    });
  }

  /**
   * REGION Callbacks
   */
  public void onCompletedFrameworkStatusesUpdated(
      Map<String, FrameworkStatus> completedFrameworkStatuses)
      throws Exception {
    if (completedFrameworkStatuses.size() > 0) {
      CommonUtils.executeWithLock(writeLock, () ->
          gcCompletedFrameworks(completedFrameworkStatuses));
    }
  }
}