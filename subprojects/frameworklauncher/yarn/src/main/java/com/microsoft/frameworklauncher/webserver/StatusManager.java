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

import com.microsoft.frameworklauncher.common.definition.FrameworkStateDefinition;
import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import com.microsoft.frameworklauncher.common.exit.FrameworkExitCode;
import com.microsoft.frameworklauncher.common.exit.FrameworkExitInfo;
import com.microsoft.frameworklauncher.common.exit.FrameworkExitSpec;
import com.microsoft.frameworklauncher.common.exts.CommonExts;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.common.service.AbstractService;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

// Manage the CURD to ZK Status
public class StatusManager extends AbstractService { // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(StatusManager.class);

  private final WebServer webServer;
  private final LauncherConfiguration conf;
  private final ZookeeperStore zkStore;

  /**
   * REGION BaseStatus
   */
  // WebServer only need to retrieve AggregatedLauncherStatus
  private volatile LauncherStatus launcherStatus;
  // FrameworkName -> AggregatedFrameworkStatus
  private volatile Map<String, AggregatedFrameworkStatus> aggFrameworkStatuses;


  /**
   * REGION AbstractService
   */
  public StatusManager(WebServer webServer, LauncherConfiguration conf, ZookeeperStore zkStore) {
    super(StatusManager.class.getName());

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

  // No need to initialize for StatusManager
  @Override
  protected void recover() throws Exception {
    super.recover();

    pullStatus();

    LOGGER.logInfo("Succeeded to recover %s.", serviceName);
  }

  // No need to stop ongoing Thread, since zkStore is Atomic
  @Override
  protected void run() throws Exception {
    super.run();

    new Thread(() -> {
      while (true) {
        try {
          // No need to updateCompletedFrameworkStatuses when recover
          updateCompletedFrameworkStatuses();

          Thread.sleep(conf.getWebServerStatusPullIntervalSec() * 1000);

          pullStatus();
        } catch (Exception e) {
          // Directly throw TransientException to WebServer, since it may not be recovered or make progress any more
          handleException(e);
        }
      }
    }).start();
  }

  /**
   * REGION InternalUtils
   */
  private void pullStatus() throws Exception {
    LOGGER.logDebug("Pulling AggregatedLauncherStatus");

    Map<String, AggregatedFrameworkStatus> reusableAggFrameworkStatuses =
        getReusableAggregatedFrameworkStatuses();
    AggregatedLauncherStatus aggLauncherStatus =
        zkStore.getAggregatedLauncherStatus(reusableAggFrameworkStatuses.keySet());
    launcherStatus = aggLauncherStatus.getLauncherStatus();
    Map<String, AggregatedFrameworkStatus> nonreusableAggFrameworkStatuses =
        aggLauncherStatus.getAggregatedFrameworkStatuses();

    // Combine reusable and nonreusable AggregatedFrameworkStatuses
    Map<String, AggregatedFrameworkStatus> newAggFrameworkStatuses = new HashMap<>();
    newAggFrameworkStatuses.putAll(reusableAggFrameworkStatuses);
    newAggFrameworkStatuses.putAll(nonreusableAggFrameworkStatuses);
    reviseAggregatedFrameworkStatuses(newAggFrameworkStatuses);
    aggFrameworkStatuses = CommonExts.asReadOnly(newAggFrameworkStatuses);

    LOGGER.logDebug("Pulled AggregatedLauncherStatus: " +
            "AggregatedFrameworkStatus Reused Percentage: [%s / %s]",
        reusableAggFrameworkStatuses.size(), aggFrameworkStatuses.size());

    // Detect the corrupted AggregatedFrameworkStatus and lead Service.StatusManager.recover to clean
    for (Map.Entry<String, AggregatedFrameworkStatus> aggFrameworkStatusKV : aggFrameworkStatuses.entrySet()) {
      String frameworkName = aggFrameworkStatusKV.getKey();
      AggregatedFrameworkStatus aggFrameworkStatus = aggFrameworkStatusKV.getValue();
      if (aggFrameworkStatus == null) {
        throw new NonTransientException(String.format(
            "[%s]: AggregatedFrameworkStatus is corrupted",
            frameworkName));
      }
    }
  }

  private Map<String, AggregatedFrameworkStatus> getReusableAggregatedFrameworkStatuses() throws Exception {
    Map<String, AggregatedFrameworkStatus> reusableAggFrameworkStatuses = new HashMap<>();

    if (aggFrameworkStatuses == null) {
      return reusableAggFrameworkStatuses;
    }

    List<FrameworkRequest> allFrameworkRequests = webServer.getAllFrameworkRequests();
    for (FrameworkRequest frameworkRequest : allFrameworkRequests) {
      String frameworkName = frameworkRequest.getFrameworkName();
      Integer frameworkVersion = frameworkRequest.getFrameworkDescriptor().getVersion();

      // For a specific requested FrameworkName and FrameworkVersion, its
      // AggregatedFrameworkStatus will be immutable after it is transitioned to FINAL_STATES,
      // so it can be reused directly in next round pullStatus instead of pull from ZK,
      // because it must be in ZK and must be the same as the corresponding data in ZK.
      if (aggFrameworkStatuses.containsKey(frameworkName)) {
        AggregatedFrameworkStatus aggFrameworkStatus = aggFrameworkStatuses.get(frameworkName);
        FrameworkStatus frameworkStatus = aggFrameworkStatus.getFrameworkStatus();
        if (frameworkStatus.getFrameworkVersion().equals(frameworkVersion) &&
            FrameworkStateDefinition.FINAL_STATES.contains(frameworkStatus.getFrameworkState())) {
          reusableAggFrameworkStatuses.put(frameworkName, aggFrameworkStatus);
        }
      }
    }

    return reusableAggFrameworkStatuses;
  }

  // Need to be idempotent since the newAggFrameworkStatuses may contain reusableAggFrameworkStatuses
  private static void reviseAggregatedFrameworkStatuses(
      Map<String, AggregatedFrameworkStatus> newAggFrameworkStatuses) {
    for (AggregatedFrameworkStatus aggFrameworkStatus : newAggFrameworkStatuses.values()) {
      FrameworkStatus frameworkStatus = aggFrameworkStatus.getFrameworkStatus();
      Map<String, AggregatedTaskRoleStatus> aggTaskRoleStatuses = aggFrameworkStatus.getAggregatedTaskRoleStatuses();
      String frameworkName = frameworkStatus.getFrameworkName();

      // Revise FrameworkStatus:
      // Framework is running <-> Exists running Task.
      // This makes the Launcher APIs reflect the real Framework running state, instead of just the
      // raw AM running state.
      // It is hard to make sure the FrameworkStatus is consistent with the TaskStatuses outside
      // WebServer.
      // However, this will make the exposed FrameworkState is not consistent with the backend,
      // but it is fine because the revised state, i.e. APPLICATION_RUNNING and APPLICATION_WAITING
      // are generally exchangeable even in the backend.
      FrameworkState frameworkState = frameworkStatus.getFrameworkState();
      if (frameworkState == FrameworkState.APPLICATION_WAITING ||
          frameworkState == FrameworkState.APPLICATION_RUNNING) {
        FrameworkState revisedFrameworkState =
            aggFrameworkStatus.existsRunningTask() ?
                FrameworkState.APPLICATION_RUNNING :
                FrameworkState.APPLICATION_WAITING;

        if (frameworkState != revisedFrameworkState) {
          frameworkStatus.setFrameworkState(revisedFrameworkState);
          LOGGER.logTrace("Revised Framework [%s] from [%s] to [%s]",
              frameworkName, frameworkState, revisedFrameworkState);
        }
      }

      // Revise TaskStatus:
      // Application is completed <-> All Tasks are completed.
      // This makes the Launcher APIs reflect the inferred up-to-date Tasks completion state
      // from YARN perspective, even after the Application is already completed and thus
      // the AM has no chance to update the TaskStatus anymore.
      // However, this will make the exposed TaskStatus is not consistent with the backend,
      // and the Task in TASK_COMPLETED state may not have an associated Container.
      if (frameworkState == FrameworkState.APPLICATION_COMPLETED ||
          frameworkState == FrameworkState.FRAMEWORK_COMPLETED) {
        Integer taskStoppedExitCode = FrameworkExitCode.TASK_STOPPED_ON_APP_COMPLETION.toInt();
        FrameworkExitInfo taskStoppedExitInfo = FrameworkExitSpec.getExitInfo(taskStoppedExitCode);
        Long appCompletedTimestamp = frameworkStatus.getApplicationCompletedTimestamp();

        for (AggregatedTaskRoleStatus aggTaskRoleStatus : aggTaskRoleStatuses.values()) {
          String taskRoleName = aggTaskRoleStatus.getTaskStatuses().getTaskRoleName();
          List<TaskStatus> taskStatuses = aggTaskRoleStatus.getTaskStatuses().getTaskStatusArray();
          for (TaskStatus taskStatus : taskStatuses) {
            Integer taskIndex = taskStatus.getTaskIndex();
            TaskState taskState = taskStatus.getTaskState();
            TaskState revisedTaskState = TaskState.TASK_COMPLETED;

            if (taskState != revisedTaskState) {
              taskStatus.setContainerExitCode(taskStoppedExitCode);
              taskStatus.setContainerExitDescription(taskStoppedExitInfo.getDescription());
              taskStatus.setContainerExitDiagnostics(null);
              taskStatus.setContainerExitType(taskStoppedExitInfo.getType());
              if (taskStatus.getContainerId() != null) {
                taskStatus.setContainerCompletedTimestamp(appCompletedTimestamp);
              }
              taskStatus.setTaskCompletedTimestamp(appCompletedTimestamp);
              taskStatus.setTaskState(revisedTaskState);
              LOGGER.logTrace("Revised Task [%s][%s][%s] from [%s] to [%s]",
                  frameworkName, taskRoleName, taskIndex, taskState, revisedTaskState);
            }
          }
        }
      }
    }
  }

  private void updateCompletedFrameworkStatuses() throws Exception {
    Map<String, FrameworkStatus> completedFrameworkStatuses = new HashMap<>();
    for (Map.Entry<String, AggregatedFrameworkStatus> aggFrameworkStatusKV : aggFrameworkStatuses.entrySet()) {
      String frameworkName = aggFrameworkStatusKV.getKey();
      FrameworkStatus frameworkStatus = aggFrameworkStatusKV.getValue().getFrameworkStatus();

      if (frameworkStatus.getFrameworkState() == FrameworkState.FRAMEWORK_COMPLETED) {
        completedFrameworkStatuses.put(frameworkName, frameworkStatus);
      }
    }

    // Always notify until GC completely, since CompletedFramework will be GC eventually,
    // even though it is unchanged.
    webServer.onCompletedFrameworkStatusesUpdated(completedFrameworkStatuses);
  }


  /**
   * REGION ReadInterface
   */
  // Returned Status is readonly, caller should not modify it
  public LauncherStatus getLauncherStatus() {
    return launcherStatus;
  }

  public AggregatedFrameworkStatus getAggregatedFrameworkStatus(FrameworkRequest frameworkRequest) {
    String frameworkName = frameworkRequest.getFrameworkName();
    Integer frameworkVersion = frameworkRequest.getFrameworkDescriptor().getVersion();

    AggregatedFrameworkStatus aggFrameworkStatus = aggFrameworkStatuses.get(frameworkName);
    if (aggFrameworkStatus != null &&
        aggFrameworkStatus.getFrameworkStatus().getFrameworkVersion().equals(frameworkVersion)) {
      return aggFrameworkStatus;
    } else {
      // If the real Status has not yet appeared, return the inferred Status according to the Request.
      // So, from the Launcher APIs' view, the Status's life cycle is consistent with the Request.
      // This makes the Launcher APIs more convenient for Client to use.
      // However, we only infer the FrameworkStatus if it does not exist, for other Status, such as the TaskStatuses,
      // Client still needs to poll the API to check whether the Status has been updated according to the Request.
      return AggregatedFrameworkStatus.newInstance(frameworkRequest);
    }
  }

  public FrameworkStatus getFrameworkStatus(FrameworkRequest frameworkRequest) {
    AggregatedFrameworkStatus aggFrameworkStatus = getAggregatedFrameworkStatus(frameworkRequest);
    return aggFrameworkStatus.getFrameworkStatus();
  }
}