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

import com.microsoft.frameworklauncher.common.exceptions.NonTransientException;
import com.microsoft.frameworklauncher.common.exceptions.NotFoundException;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.utils.AbstractService;
import com.microsoft.frameworklauncher.utils.CommonExtensions;
import com.microsoft.frameworklauncher.utils.DefaultLogger;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;

import java.util.HashMap;
import java.util.Map;

import static com.microsoft.frameworklauncher.utils.CommonUtils.checkExist;

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
  private LauncherStatus launcherStatus;
  // FrameworkName -> AggregatedFrameworkStatus
  private Map<String, AggregatedFrameworkStatus> aggFrameworkStatuses;


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
          Thread.sleep(conf.getWebServerStatusPullIntervalSec() * 1000);
        } catch (InterruptedException e) {
          handleException(e);
        }

        try {
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

    AggregatedLauncherStatus aggLauncherStatus = zkStore.getAggregatedLauncherStatus();
    launcherStatus = aggLauncherStatus.getLauncherStatus();
    aggFrameworkStatuses = CommonExtensions.asReadOnly(aggLauncherStatus.getAggregatedFrameworkStatuses());

    LOGGER.logDebug("Pulled AggregatedLauncherStatus");

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

    updateCompletedFrameworkStatuses();
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

  public AggregatedFrameworkStatus getAggregatedFrameworkStatus(String frameworkName) throws NotFoundException {
    return checkExist(aggFrameworkStatuses.get(frameworkName));
  }

  public FrameworkStatus getFrameworkStatus(String frameworkName) throws NotFoundException {
    return checkExist(aggFrameworkStatuses.get(frameworkName))
        .getFrameworkStatus();
  }

  public TaskRoleStatus getTaskRoleStatus(String frameworkName, String taskRoleName) throws NotFoundException {
    return checkExist(checkExist(aggFrameworkStatuses.get(frameworkName))
        .getAggregatedTaskRoleStatuses().get(taskRoleName)).getTaskRoleStatus();
  }

  public TaskStatuses getTaskStatuses(String frameworkName, String taskRoleName) throws NotFoundException {
    return checkExist(checkExist(aggFrameworkStatuses.get(frameworkName))
        .getAggregatedTaskRoleStatuses().get(taskRoleName)).getTaskStatuses();
  }
}