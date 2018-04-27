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
    LOGGER.logInfo("Pulling AggregatedLauncherStatus");

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
    aggFrameworkStatuses = CommonExts.asReadOnly(newAggFrameworkStatuses);

    LOGGER.logInfo("Pulled AggregatedLauncherStatus: " +
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