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

package com.microsoft.frameworklauncher.service;

import com.microsoft.frameworklauncher.common.WebCommon;
import com.microsoft.frameworklauncher.common.model.*;
import com.microsoft.frameworklauncher.utils.*;
import com.microsoft.frameworklauncher.zookeeperstore.ZookeeperStore;
import org.apache.hadoop.yarn.api.records.ApplicationReport;
import org.apache.hadoop.yarn.api.records.ApplicationSubmissionContext;
import org.apache.log4j.Level;
import org.apache.zookeeper.KeeperException;

import java.io.IOException;
import java.util.*;

// Manage the CURD to ZK Status
public class StatusManager extends AbstractService {  // THREAD SAFE
  private static final DefaultLogger LOGGER = new DefaultLogger(StatusManager.class);

  private final Service service;
  private final LauncherConfiguration conf;
  private final ZookeeperStore zkStore;


  /**
   * REGION BaseStatus
   */
  // Service only need to maintain LauncherStatus and AllFrameworkStatuses, and it is the only maintainer.
  private LauncherStatus launcherStatus = null;
  // FrameworkName -> FrameworkStatus
  private Map<String, FrameworkStatus> frameworkStatuses = null;


  /**
   * REGION ExtensionStatus
   * ExtensionStatus should be always CONSISTENT with BaseStatus
   */
  // Used to invert index FrameworkStatus by ApplicationId/FrameworkState instead of FrameworkName
  // FrameworkState -> FrameworkNames
  private final Map<FrameworkState, HashSet<String>> frameworkStateLocators = new HashMap<>();
  // Associated ApplicationId -> FrameworkName
  private final Map<String, String> associatedApplicationIdLocators = new HashMap<>();
  // Live Associated ApplicationId -> FrameworkName
  private final Map<String, String> liveAssociatedApplicationIdLocators = new HashMap<>();


  /**
   * REGION AbstractService
   */
  public StatusManager(Service service, LauncherConfiguration conf, ZookeeperStore zkStore) {
    super(StatusManager.class.getName());
    this.service = service;
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
    service.onExceptionOccurred(e);
    return false;
  }

  @Override
  protected void initialize() throws Exception {
    super.initialize();

    for (FrameworkState frameworkState : FrameworkState.values()) {
      frameworkStateLocators.put(frameworkState, new HashSet<>());
    }
  }

  @Override
  protected void recover() throws Exception {
    super.recover();

    // Recover LauncherStatus to ZK
    LauncherStatus launcherStatus = new LauncherStatus();
    launcherStatus.setLauncherConfiguration(conf);
    updateLauncherStatus(launcherStatus);

    // Recover AllFrameworkStatuses from ZK and clean the corrupted AggregatedFrameworkStatus
    frameworkStatuses = new HashMap<>();
    AggregatedLauncherStatus aggLauncherStatus = zkStore.getAggregatedLauncherStatus();
    for (Map.Entry<String, AggregatedFrameworkStatus> aggFrameworkStatusKV :
        aggLauncherStatus.getAggregatedFrameworkStatuses().entrySet()) {
      String frameworkName = aggFrameworkStatusKV.getKey();
      AggregatedFrameworkStatus aggFrameworkStatus = aggFrameworkStatusKV.getValue();
      if (aggFrameworkStatus != null) {
        frameworkStatuses.put(frameworkName, aggFrameworkStatus.getFrameworkStatus());
        addExtensionFrameworkStatus(frameworkName);
      } else {
        // When Service removeFramework, there is little chance that the running AM cannot be killed by RM immediately
        // (such as AM container node lost), but Service consider the AM is killed then delete its FrameworkStatus.
        // And then the running AM can may create null FrameworkStatus, null TaskRoleStatus or partial TaskStatuses on ZK.
        // So, WebServer.StatusManager need to detect the corrupted AggregatedFrameworkStatus and
        // Service.StatusManager need to clean it when recover.
        FrameworkStatus frameworkStatus = null;

        try {
          frameworkStatus = zkStore.getFrameworkStatus(frameworkName);
        } catch (KeeperException.NoNodeException e) {
        } catch (KeeperException e) {
          throw e;
        } catch (Exception e) {
          LOGGER.logError(e,
              "[%s]: FrameworkStatus is corrupted, delete it on ZK",
              frameworkName);
          zkStore.deleteFrameworkStatus(frameworkName);
        }

        if (frameworkStatus != null) {
          LOGGER.logError(
              "[%s]: FrameworkStatus children: TaskRoleStatus or TaskStatuses is corrupted, delete them on ZK",
              frameworkName);
          zkStore.deleteFrameworkStatus(frameworkName, true);

          // If frameworkStatus is the new version, it should be recovered, otherwise it can also be recovered.
          // Because any frameworkStatus can be driven by RequestManager and FrameworkStateMachine.
          frameworkStatuses.put(frameworkName, frameworkStatus);
          addExtensionFrameworkStatus(frameworkName);
        }
      }
    }

    LOGGER.logInfo("Succeeded to recover %s.", serviceName);

    // Here ZK and Mem Status is the same.
    // Since Request may be ahead of Status even when Running,
    // so here the Recovery of Service StatusManager is completed.
  }

  // No need to run and stop for StatusManager, since all ZK and Mem Status
  // are always CONSISTENT between SystemTasks.


  /**
   * REGION InternalUtils
   */
  private void updateLauncherStatus(LauncherStatus newLauncherStatus) throws Exception {
    if (YamlUtils.deepEquals(launcherStatus, newLauncherStatus)) {
      return;
    }

    LOGGER.logInfo(
        "updateLauncherStatus: Update from [%s] to [%s]",
        WebCommon.toJson(launcherStatus), WebCommon.toJson(newLauncherStatus));
    launcherStatus = newLauncherStatus;
    zkStore.setLauncherStatus(launcherStatus);
  }

  private void addExtensionFrameworkStatus(String frameworkName) {
    FrameworkStatus frameworkStatus = getFrameworkStatus(frameworkName);
    String applicationId = frameworkStatus.getApplicationId();
    FrameworkState frameworkState = frameworkStatus.getFrameworkState();

    frameworkStateLocators.get(frameworkState).add(frameworkName);
    if (FrameworkStateDefinition.APPLICATION_ASSOCIATED_STATES.contains(frameworkState)) {
      associatedApplicationIdLocators.put(applicationId, frameworkName);
    }
    if (FrameworkStateDefinition.APPLICATION_LIVE_ASSOCIATED_STATES.contains(frameworkState)) {
      updateExtensionFrameworkStatusWithApplicationLiveness(frameworkName, true);
    }
  }

  private void removeExtensionFrameworkStatus(String frameworkName) {
    FrameworkStatus frameworkStatus = getFrameworkStatus(frameworkName);
    String applicationId = frameworkStatus.getApplicationId();
    FrameworkState frameworkState = frameworkStatus.getFrameworkState();

    frameworkStateLocators.get(frameworkState).remove(frameworkName);
    if (FrameworkStateDefinition.APPLICATION_ASSOCIATED_STATES.contains(frameworkState)) {
      associatedApplicationIdLocators.remove(applicationId);
    }
    if (FrameworkStateDefinition.APPLICATION_LIVE_ASSOCIATED_STATES.contains(frameworkState)) {
      updateExtensionFrameworkStatusWithApplicationLiveness(frameworkName, false);
    }
  }

  // Should call disassociateFrameworkWithApplication if associateFrameworkWithApplication failed
  private void associateFrameworkWithApplication(String frameworkName, ApplicationSubmissionContext applicationContext) {
    FrameworkStatus frameworkStatus = getFrameworkStatus(frameworkName);
    String applicationId = applicationContext.getApplicationId().toString();

    // Construct BaseStatus
    frameworkStatus.setApplicationId(applicationId);
    frameworkStatus.setApplicationProgress((float) 0);

    // Construct ExtensionStatus
    associatedApplicationIdLocators.put(applicationId, frameworkName);
  }

  private void disassociateFrameworkWithApplication(String frameworkName) {
    FrameworkStatus frameworkStatus = getFrameworkStatus(frameworkName);
    String applicationId = frameworkStatus.getApplicationId();

    // Destruct ExtensionStatus
    associatedApplicationIdLocators.remove(applicationId);

    // Destruct BaseStatus
    frameworkStatus.setApplicationId(null);
    frameworkStatus.setApplicationProgress(null);
    frameworkStatus.setApplicationTrackingUrl(null);
    frameworkStatus.setApplicationLaunchedTimestamp(null);
    frameworkStatus.setApplicationCompletedTimestamp(null);
    frameworkStatus.setApplicationExitCode(null);
    frameworkStatus.setApplicationExitDiagnostics(null);
    frameworkStatus.setApplicationExitType(ExitType.NOT_AVAILABLE);
  }

  private void updateExtensionFrameworkStatusWithApplicationLiveness(String frameworkName, boolean isLive) {
    FrameworkStatus frameworkStatus = getFrameworkStatus(frameworkName);
    String applicationId = frameworkStatus.getApplicationId();

    if (isLive) {
      liveAssociatedApplicationIdLocators.put(applicationId, frameworkName);
    } else {
      liveAssociatedApplicationIdLocators.remove(applicationId);
    }
  }

  private void addFramework(FrameworkRequest frameworkRequest) throws Exception {
    String frameworkName = frameworkRequest.getFrameworkName();
    Integer frameworkVersion = frameworkRequest.getFrameworkDescriptor().getVersion();

    LOGGER.logInfo("[%s][%s]: addFramework", frameworkName, frameworkVersion);
    assert !frameworkStatuses.containsKey(frameworkName);

    FrameworkStatus frameworkStatus = new FrameworkStatus();
    frameworkStatus.setFrameworkName(frameworkName);
    frameworkStatus.setFrameworkVersion(frameworkVersion);
    frameworkStatus.setFrameworkState(FrameworkState.FRAMEWORK_WAITING);
    frameworkStatus.setFrameworkRetryPolicyState(new RetryPolicyState());
    frameworkStatus.setFrameworkCreatedTimestamp(System.currentTimeMillis());

    // Update Mem Status
    frameworkStatuses.put(frameworkName, frameworkStatus);
    addExtensionFrameworkStatus(frameworkName);

    // Update ZK Status
    zkStore.setFrameworkStatus(frameworkName, frameworkStatus);

    // The external resource will be setup by following CreateApplication
  }

  private void removeFramework(String frameworkName, boolean skipRemoveHdfsResource) throws Exception {
    FrameworkStatus frameworkStatus = getFrameworkStatus(frameworkName);
    Integer frameworkVersion = frameworkStatus.getFrameworkVersion();

    LOGGER.logInfo("[%s][%s]: removeFramework", frameworkName, frameworkVersion);

    // Notify Service to Cleanup Framework level external resource [HDFS, RM]
    service.onFrameworkToRemove(frameworkStatus, skipRemoveHdfsResource);

    // Update Mem Status
    removeExtensionFrameworkStatus(frameworkName);
    frameworkStatuses.remove(frameworkName);

    // Update ZK Status
    zkStore.deleteFrameworkStatus(frameworkName);
  }


  /**
   * REGION ReadInterface
   */
  public synchronized Set<String> getFrameworkNames() {
    return frameworkStatuses.keySet();
  }

  public synchronized boolean containsFrameworkStatus(String frameworkName) {
    return frameworkStatuses.containsKey(frameworkName);
  }

  public synchronized boolean containsFrameworkStatus(FrameworkStatus frameworkStatus) throws IOException {
    String frameworkName = frameworkStatus.getFrameworkName();

    if (!containsFrameworkStatus(frameworkName)) {
      LOGGER.logDebug("FrameworkName not found in Status. FrameworkName: %s", frameworkName);
      return false;
    }

    FrameworkStatus thisFrameworkStatus = getFrameworkStatus(frameworkName);
    if (!YamlUtils.deepEquals(thisFrameworkStatus, frameworkStatus)) {
      LOGGER.logSplittedLines(Level.DEBUG,
          "FrameworkStatus not found in Status. FrameworkStatus:\n%s\nCurrent FrameworkStatus in Status:\n%s",
          WebCommon.toJson(frameworkStatus), WebCommon.toJson(thisFrameworkStatus));
      return false;
    }

    return true;
  }

  // Returned FrameworkStatus is readonly, caller should not modify it
  public synchronized FrameworkStatus getFrameworkStatus(String frameworkName) {
    assert containsFrameworkStatus(frameworkName);
    return frameworkStatuses.get(frameworkName);
  }

  // Returned FrameworkStatus is readonly, caller should not modify it
  public synchronized List<FrameworkStatus> getFrameworkStatus(Set<FrameworkState> frameworkStateSet) {
    return getFrameworkStatus(frameworkStateSet, true);
  }

  // Returned FrameworkStatus is readonly, caller should not modify it
  public synchronized List<FrameworkStatus> getFrameworkStatus(Set<FrameworkState> frameworkStateSet, boolean contains) {
    Set<FrameworkState> acceptableFrameworkStateSet = new HashSet<>();
    if (contains) {
      acceptableFrameworkStateSet.addAll(frameworkStateSet);
    } else {
      for (FrameworkState frameworkState : FrameworkState.values()) {
        if (!frameworkStateSet.contains(frameworkState)) {
          acceptableFrameworkStateSet.add(frameworkState);
        }
      }
    }

    List<FrameworkStatus> frameworkStatuses = new ArrayList<>();
    for (FrameworkState frameworkState : acceptableFrameworkStateSet) {
      for (String frameworkName : frameworkStateLocators.get(frameworkState)) {
        frameworkStatuses.add(getFrameworkStatus(frameworkName));
      }
    }
    return frameworkStatuses;
  }

  // Returned FrameworkStatus is readonly, caller should not modify it
  public synchronized FrameworkStatus getFrameworkStatusWithLiveAssociatedApplicationId(String applicationId) {
    assert isApplicationIdLiveAssociated(applicationId);
    return getFrameworkStatus(liveAssociatedApplicationIdLocators.get(applicationId));
  }

  public synchronized List<String> getLiveAssociatedApplicationIds() {
    return new ArrayList<>(liveAssociatedApplicationIdLocators.keySet());
  }

  public synchronized boolean isApplicationIdLiveAssociated(String applicationId) {
    return liveAssociatedApplicationIdLocators.containsKey(applicationId);
  }

  // Returned FrameworkStatus is readonly, caller should not modify it
  public synchronized FrameworkStatus getFrameworkStatusWithAssociatedApplicationId(String applicationId) {
    assert isApplicationIdAssociated(applicationId);
    return getFrameworkStatus(associatedApplicationIdLocators.get(applicationId));
  }

  public synchronized List<String> getAssociatedApplicationIds() {
    return new ArrayList<>(associatedApplicationIdLocators.keySet());
  }

  public synchronized boolean isApplicationIdAssociated(String applicationId) {
    return associatedApplicationIdLocators.containsKey(applicationId);
  }

  /**
   * REGION ModifyInterface
   */
  // Note to avoid update partially modified Status on ZK

  // This is the only interface to modify FrameworkState for both internal and external
  public synchronized void transitionFrameworkState(
      String frameworkName,
      FrameworkState dstState) throws Exception {
    transitionFrameworkState(frameworkName, dstState, null, ExitStatusKey.NOT_AVAILABLE.toInt(), "", null);
  }

  public synchronized void transitionFrameworkState(
      String frameworkName,
      FrameworkState dstState,
      ApplicationSubmissionContext applicationContext) throws Exception {
    transitionFrameworkState(frameworkName, dstState, applicationContext, ExitStatusKey.NOT_AVAILABLE.toInt(), "", null);
  }

  public synchronized void transitionFrameworkState(
      String frameworkName,
      FrameworkState dstState,
      ApplicationSubmissionContext applicationContext,
      int applicationExitCode) throws Exception {
    transitionFrameworkState(frameworkName, dstState, applicationContext, applicationExitCode, "", null);
  }

  public synchronized void transitionFrameworkState(
      String frameworkName,
      FrameworkState dstState,
      ApplicationSubmissionContext applicationContext,
      int applicationExitCode,
      String applicationExitDiagnostics) throws Exception {
    transitionFrameworkState(frameworkName, dstState, applicationContext, applicationExitCode, applicationExitDiagnostics, null);
  }

  public synchronized void transitionFrameworkState(
      String frameworkName,
      FrameworkState dstState,
      ApplicationSubmissionContext applicationContext,
      int applicationExitCode,
      String applicationExitDiagnostics,
      RetryPolicyState newRetryPolicyState) throws Exception {

    FrameworkStatus frameworkStatus = getFrameworkStatus(frameworkName);
    FrameworkState srcState = frameworkStatus.getFrameworkState();

    // State transition function between each FrameworkStates
    // Attempt to transition
    if (srcState == dstState) {
      return;
    }

    assert !FrameworkStateDefinition.FINAL_STATES.contains(srcState);

    if (!FrameworkStateDefinition.APPLICATION_ASSOCIATED_STATES.contains(srcState) &&
        FrameworkStateDefinition.APPLICATION_ASSOCIATED_STATES.contains(dstState)) {
      assert (applicationContext != null);

      String applicationId = applicationContext.getApplicationId().toString();
      try {
        associateFrameworkWithApplication(frameworkName, applicationContext);
        LOGGER.logInfo("Associated Framework [%s] with Application %s", frameworkName, applicationId);
      } catch (Exception e) {
        disassociateFrameworkWithApplication(frameworkName);
        throw new Exception(
            String.format("Failed to associate Application %s to Framework [%s]",
                applicationId, frameworkName), e);
      }
    }

    if (!FrameworkStateDefinition.APPLICATION_LIVE_ASSOCIATED_STATES.contains(srcState) &&
        FrameworkStateDefinition.APPLICATION_LIVE_ASSOCIATED_STATES.contains(dstState)) {
      updateExtensionFrameworkStatusWithApplicationLiveness(frameworkName, true);
    }

    if (FrameworkStateDefinition.APPLICATION_LIVE_ASSOCIATED_STATES.contains(srcState) &&
        !FrameworkStateDefinition.APPLICATION_LIVE_ASSOCIATED_STATES.contains(dstState)) {
      updateExtensionFrameworkStatusWithApplicationLiveness(frameworkName, false);
    }

    if (FrameworkStateDefinition.APPLICATION_ASSOCIATED_STATES.contains(srcState) &&
        !FrameworkStateDefinition.APPLICATION_ASSOCIATED_STATES.contains(dstState)) {
      disassociateFrameworkWithApplication(frameworkName);
    }

    if (dstState == FrameworkState.APPLICATION_RETRIEVING_DIAGNOSTICS ||
        dstState == FrameworkState.APPLICATION_COMPLETED) {
      frameworkStatus.setApplicationExitCode(applicationExitCode);
      frameworkStatus.setApplicationExitDiagnostics(applicationExitDiagnostics);

      // No need to Cleanup ZK here, since it will be Cleanuped by next Application
      // No need to Cleanup HDFS here, since it will be overwrote by next Application
      // No need to Cleanup RM here, since it already Cleanuped before here
      if (dstState == FrameworkState.APPLICATION_COMPLETED) {
        assert (applicationExitCode != ExitStatusKey.NOT_AVAILABLE.toInt());
      }

      frameworkStatus.setApplicationExitType(DiagnosticsUtils.lookupExitType(
          applicationExitCode, applicationExitDiagnostics));
    }

    // Framework will be Retried
    if (srcState == FrameworkState.APPLICATION_COMPLETED && dstState == FrameworkState.FRAMEWORK_WAITING) {
      // Cleanup previous Application level external resource [ZK]
      zkStore.deleteFrameworkStatus(frameworkName, true);

      // Ensure transitionFrameworkState and RetryPolicyState is Transactional
      assert (newRetryPolicyState != null);
      frameworkStatus.setFrameworkRetryPolicyState(newRetryPolicyState);
    }

    // Record Timestamps
    Long currentTimestamp = System.currentTimeMillis();
    if (dstState == FrameworkState.FRAMEWORK_COMPLETED) {
      frameworkStatus.setFrameworkCompletedTimestamp(currentTimestamp);
    } else if (dstState == FrameworkState.APPLICATION_LAUNCHED) {
      frameworkStatus.setApplicationLaunchedTimestamp(currentTimestamp);
    } else if (dstState == FrameworkState.APPLICATION_COMPLETED) {
      frameworkStatus.setApplicationCompletedTimestamp(currentTimestamp);
    }

    // Start Transition
    frameworkStateLocators.get(srcState).remove(frameworkName);
    frameworkStateLocators.get(dstState).add(frameworkName);
    frameworkStatus.setFrameworkState(dstState);

    // Update ZK Status
    zkStore.setFrameworkStatus(frameworkName, frameworkStatus);
    LOGGER.logInfo("Transitioned Framework [%s] from [%s] to [%s]", frameworkName, srcState, dstState);
  }

  public synchronized void updateFrameworkRequests(Map<String, FrameworkRequest> frameworkRequests) throws Exception {
    // Add/Update Framework
    for (FrameworkRequest frameworkRequest : frameworkRequests.values()) {
      String frameworkName = frameworkRequest.getFrameworkName();
      Integer frameworkVersion = frameworkRequest.getFrameworkDescriptor().getVersion();

      String logPrefix = String.format(
          "[%s][%s]: updateFrameworkRequests: ",
          frameworkName, frameworkVersion);

      if (!frameworkStatuses.containsKey(frameworkName)) {
        LOGGER.logDebug(logPrefix + "Add new Framework");
        addFramework(frameworkRequest);
      } else {
        FrameworkStatus frameworkStatus = frameworkStatuses.get(frameworkName);
        if (!frameworkStatus.getFrameworkVersion().equals(frameworkVersion)) {
          LOGGER.logDebug(logPrefix + "NonRolling Upgrade Framework");
          // skipRemoveHdfsResource since Upgraded Framework will overwrite them anyway or it will be
          // Cleanuped by GCLeftoverFrameworks if the Framework is Removed after LauncherService restart.
          removeFramework(frameworkName, true);
          addFramework(frameworkRequest);
        }
      }
    }

    // Remove Framework
    for (FrameworkStatus frameworkStatus : new ArrayList<>(frameworkStatuses.values())) {
      String frameworkName = frameworkStatus.getFrameworkName();
      Integer frameworkVersion = frameworkStatus.getFrameworkVersion();

      String logPrefix = String.format(
          "[%s][%s]: updateFrameworkRequests: ",
          frameworkName, frameworkVersion);

      if (!frameworkRequests.containsKey(frameworkName)) {
        LOGGER.logDebug(logPrefix + "Remove Framework permanently");
        removeFramework(frameworkName, false);
      }
    }
  }

  public synchronized void updateApplicationStatus(String frameworkName, ApplicationReport applicationReport) throws Exception {
    FrameworkStatus frameworkStatus = getFrameworkStatus(frameworkName);
    String applicationId = applicationReport.getApplicationId().toString();
    String logPrefix = String.format(
        "[%s][%s]: UpdateFrameworkStatus: ", frameworkName, frameworkStatus.getApplicationId());

    assert applicationId.equals(frameworkStatus.getApplicationId());

    boolean frameworkStatusChanged = false;
    if (frameworkStatus.getApplicationProgress() == null ||
        Math.abs(frameworkStatus.getApplicationProgress() - applicationReport.getProgress()) >= 0.1) {
      LOGGER.logInfo(
          logPrefix + "Update ApplicationProgress from [%s] to [%s]",
          frameworkStatus.getApplicationProgress(), applicationReport.getProgress());
      frameworkStatus.setApplicationProgress(applicationReport.getProgress());
      frameworkStatusChanged = true;
    }

    // Only update ApplicationTrackingUrl at the first time, since after Application
    // completed in RM, it will be redirect to non-proxy url.
    if (frameworkStatus.getApplicationTrackingUrl() == null ||
        frameworkStatus.getApplicationTrackingUrl().trim().isEmpty()) {
      LOGGER.logInfo(
          logPrefix + "Update ApplicationTrackingUrl from [%s] to [%s]",
          frameworkStatus.getApplicationTrackingUrl(), applicationReport.getTrackingUrl());
      frameworkStatus.setApplicationTrackingUrl(applicationReport.getTrackingUrl());
      frameworkStatusChanged = true;
    }

    if (frameworkStatusChanged) {
      zkStore.setFrameworkStatus(frameworkName, frameworkStatus);
    }
  }
}