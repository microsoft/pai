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

package com.microsoft.frameworklauncher.common.exit;

import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.ExitType;
import com.microsoft.frameworklauncher.common.model.UserContainerExitInfo;
import com.microsoft.frameworklauncher.common.model.UserContainerExitSpec;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.TreeMap;

public class FrameworkExitSpec {
  private static final DefaultLogger LOGGER = new DefaultLogger(FrameworkExitSpec.class);

  private static final Map<Integer, FrameworkExitInfo> spec = new TreeMap<>();

  static {
    // Success ExitCode which is issued from User Container
    spec.put(FrameworkExitCode.SUCCEEDED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.SUCCEEDED.toInt(),
        null,
        ExitType.SUCCEEDED,
        "Succeeded"));


    // Failure ExitCode which is issued from Launcher AM to User Container
    /// Container External Error
    //// Container Init Failed by YARN
    spec.put(FrameworkExitCode.CONTAINER_INVALID_EXIT_STATUS.toInt(), new FrameworkExitInfo(
        -1000,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container exited with invalid exit status, maybe container initialization failed"));
    spec.put(FrameworkExitCode.CONTAINER_NOT_AVAILABLE_EXIT_STATUS.toInt(), new FrameworkExitInfo(
        -2517,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container exited with not available exit status, maybe container process creation failed"));
    spec.put(FrameworkExitCode.CONTAINER_NODE_DISKS_FAILED.toInt(), new FrameworkExitInfo(
        -101,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container early discarded by NM due to local bad disk, maybe no capacity left on the disk"));
    spec.put(FrameworkExitCode.CONTAINER_PORT_CONFLICT.toInt(), new FrameworkExitInfo(
        -210,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container early discarded by NM due to the request ports conflict"));
    //// Container Aborted by YARN
    spec.put(FrameworkExitCode.CONTAINER_ABORTED.toInt(), new FrameworkExitInfo(
        -100,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container aborted by YARN"));
    spec.put(FrameworkExitCode.CONTAINER_NODE_LOST.toInt(), new FrameworkExitInfo(
        -100,
        "Container released on a *lost* node",
        ExitType.TRANSIENT_NORMAL,
        "Container lost due to node lost, maybe its NM is down for a long time"));
    spec.put(FrameworkExitCode.CONTAINER_EXPIRED.toInt(), new FrameworkExitInfo(
        -100,
        "Container expired since it was unused",
        ExitType.TRANSIENT_CONFLICT,
        "Container expired due to it is not launched on NM in time, maybe other containers cannot be allocated in time"));
    spec.put(FrameworkExitCode.CONTAINER_ABORTED_ON_AM_RESTART.toInt(), new FrameworkExitInfo(
        -100,
        "Container of a completed application",
        ExitType.TRANSIENT_CONFLICT,
        "Container previously allocated is aborted by RM during AM restart, maybe other containers cannot be allocated in time"));
    //// Container Other Failed by YARN
    spec.put(FrameworkExitCode.CONTAINER_PREEMPTED.toInt(), new FrameworkExitInfo(
        -102,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container preempted by RM, maybe its queue overused capacity was reclaimed"));
    spec.put(FrameworkExitCode.CONTAINER_VIRTUAL_MEMORY_EXCEEDED.toInt(), new FrameworkExitInfo(
        -103,
        null,
        ExitType.NON_TRANSIENT,
        "Container killed due to it exceeded the request virtual memory"));
    spec.put(FrameworkExitCode.CONTAINER_PHYSICAL_MEMORY_EXCEEDED.toInt(), new FrameworkExitInfo(
        -104,
        null,
        ExitType.NON_TRANSIENT,
        "Container killed due to it exceeded the request physical memory"));
    spec.put(FrameworkExitCode.CONTAINER_KILLED_BY_AM.toInt(), new FrameworkExitInfo(
        -105,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container killed by AM"));
    spec.put(FrameworkExitCode.CONTAINER_KILLED_BY_RM.toInt(), new FrameworkExitInfo(
        -106,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container killed by RM"));
    spec.put(FrameworkExitCode.CONTAINER_KILLED_ON_APP_COMPLETION.toInt(), new FrameworkExitInfo(
        -107,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container killed due to App completed"));
    spec.put(FrameworkExitCode.CONTAINER_EXTERNAL_UTILIZATION_SPIKED.toInt(), new FrameworkExitInfo(
        -200,
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container killed due to external utilization spiked"));
    //// Container Failed by Launcher AM
    spec.put(FrameworkExitCode.CONTAINER_NM_LAUNCH_FAILED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.CONTAINER_NM_LAUNCH_FAILED.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container failed to launch on NM"));
    spec.put(FrameworkExitCode.CONTAINER_RM_RESYNC_LOST.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.CONTAINER_RM_RESYNC_LOST.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container lost after RMResynced"));
    spec.put(FrameworkExitCode.CONTAINER_RM_RESYNC_EXCEEDED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.CONTAINER_RM_RESYNC_EXCEEDED.toInt(),
        null,
        ExitType.NON_TRANSIENT,
        "Container exceeded after RMResynced"));
    spec.put(FrameworkExitCode.CONTAINER_MIGRATE_TASK_REQUESTED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.CONTAINER_MIGRATE_TASK_REQUESTED.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container killed due to MigrateTaskRequest"));
    spec.put(FrameworkExitCode.CONTAINER_AGENT_EXPIRED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.CONTAINER_AGENT_EXPIRED.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "Container killed due to no agent heartbeat is received in time"));
    /// Container Internal Error is handled by UserContainerExitSpec.


    // Failure ExitCode which is issued from Launcher AM to User App
    /// AM Internal Error
    //// App Failed by YARN
    spec.put(FrameworkExitCode.AM_RM_HEARTBEAT_YARN_EXCEPTION.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.AM_RM_HEARTBEAT_YARN_EXCEPTION.toInt(),
        null,
        ExitType.NON_TRANSIENT,
        "AM RM heartbeat failed due to YarnException, maybe App is non-compliant"));
    spec.put(FrameworkExitCode.AM_RM_HEARTBEAT_IO_EXCEPTION.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.AM_RM_HEARTBEAT_IO_EXCEPTION.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "AM RM heartbeat failed due to IOException, maybe RM is down"));
    spec.put(FrameworkExitCode.AM_RM_HEARTBEAT_UNKNOWN_EXCEPTION.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.AM_RM_HEARTBEAT_UNKNOWN_EXCEPTION.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "AM RM heartbeat failed due to unknown Exception"));
    spec.put(FrameworkExitCode.AM_RM_HEARTBEAT_SHUTDOWN_REQUESTED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.AM_RM_HEARTBEAT_SHUTDOWN_REQUESTED.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "AM RM heartbeat failed due to ShutdownRequest, maybe AM is not managed by RM anymore"));
    //// App Failed by Launcher AM
    spec.put(FrameworkExitCode.AM_UNKNOWN_EXCEPTION.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.AM_UNKNOWN_EXCEPTION.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "AM failed due to unknown Exception"));
    spec.put(FrameworkExitCode.AM_NON_TRANSIENT_EXCEPTION.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.AM_NON_TRANSIENT_EXCEPTION.toInt(),
        null,
        ExitType.NON_TRANSIENT,
        "AM failed due to NonTransientException"));
    spec.put(FrameworkExitCode.AM_GANG_ALLOCATION_TIMEOUT.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.AM_GANG_ALLOCATION_TIMEOUT.toInt(),
        null,
        ExitType.TRANSIENT_CONFLICT,
        "AM failed due to all the requested resource cannot be satisfied in time"));
    /// AM External Error is already handled by RM


    // Failure ExitCode which is issued from Launcher Service to User App
    /// Service Internal Error
    //// App Failed by YARN
    spec.put(FrameworkExitCode.APP_SUBMISSION_YARN_EXCEPTION.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_SUBMISSION_YARN_EXCEPTION.toInt(),
        null,
        ExitType.NON_TRANSIENT,
        "Failed to submit App to RM due to YarnException, maybe App is non-compliant"));
    spec.put(FrameworkExitCode.APP_SUBMISSION_IO_EXCEPTION.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_SUBMISSION_IO_EXCEPTION.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "Failed to submit App to RM due to IOException, maybe RM is down"));
    spec.put(FrameworkExitCode.APP_SUBMISSION_UNKNOWN_EXCEPTION.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_SUBMISSION_UNKNOWN_EXCEPTION.toInt(),
        null,
        ExitType.UNKNOWN,
        "Failed to submit App to RM due to unknown Exception"));
    spec.put(FrameworkExitCode.APP_KILLED_UNEXPECTEDLY.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_KILLED_UNEXPECTEDLY.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "App killed unexpectedly and directly through RM"));
    /// App Failed by Launcher Service
    spec.put(FrameworkExitCode.APP_RM_RESYNC_LOST.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_RM_RESYNC_LOST.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "App lost after RMResynced"));
    spec.put(FrameworkExitCode.APP_RM_RESYNC_EXCEEDED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_RM_RESYNC_EXCEEDED.toInt(),
        null,
        ExitType.NON_TRANSIENT,
        "App exceeded after RMResynced"));
    spec.put(FrameworkExitCode.APP_STOP_FRAMEWORK_REQUESTED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_STOP_FRAMEWORK_REQUESTED.toInt(),
        null,
        ExitType.NON_TRANSIENT,
        "App killed due to StopFrameworkRequest"));
    spec.put(FrameworkExitCode.APP_AM_DIAGNOSTICS_LOST.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_AM_DIAGNOSTICS_LOST.toInt(),
        null,
        ExitType.TRANSIENT_NORMAL,
        "Failed to retrieve AMDiagnostics from YARN, maybe the App is cleaned up in YARN"));
    spec.put(FrameworkExitCode.APP_AM_DIAGNOSTICS_DESERIALIZATION_FAILED.toInt(), new FrameworkExitInfo(
        FrameworkExitCode.APP_AM_DIAGNOSTICS_DESERIALIZATION_FAILED.toInt(),
        null,
        ExitType.UNKNOWN,
        "Failed to deserialize AMDiagnostics from YARN, maybe it is truncated due to it is too long"));
    /// Service External Error is already handled by host
  }

  private static UserContainerExitSpec normalize(UserContainerExitSpec userContainerExitSpec) {
    Map<Integer, UserContainerExitInfo> normalizedSpec = new HashMap<>();

    if (userContainerExitSpec != null && userContainerExitSpec.getSpec() != null) {
      for (UserContainerExitInfo exitInfo : userContainerExitSpec.getSpec()) {
        if (exitInfo.getCode() != null &&
            exitInfo.getCode() >= 1 &&
            exitInfo.getCode() <= 255 &&
            exitInfo.getType() != ExitType.SUCCEEDED) {
          normalizedSpec.put(exitInfo.getCode(), UserContainerExitInfo.newInstance(
              exitInfo.getCode(),
              exitInfo.getType() != null ? exitInfo.getType() : ExitType.UNKNOWN,
              exitInfo.getDescription()));
        }
      }
    }

    return UserContainerExitSpec.newInstance(new ArrayList<>(normalizedSpec.values()));
  }

  public static UserContainerExitSpec initialize(UserContainerExitSpec userContainerExitSpec) {
    LOGGER.logInfo("Initializing FrameworkExitSpec: Loading UserContainerExitSpec");

    UserContainerExitSpec effectiveUserContainerExitSpec = normalize(userContainerExitSpec);
    for (UserContainerExitInfo exitInfo : effectiveUserContainerExitSpec.getSpec()) {
      spec.put(exitInfo.getCode(), new FrameworkExitInfo(
          exitInfo.getCode(),
          null,
          exitInfo.getType(),
          exitInfo.getDescription()));
    }

    return effectiveUserContainerExitSpec;
  }

  public static int lookupExitCode(int rawCode, String rawDiagnostics) {
    if (rawDiagnostics == null) {
      rawDiagnostics = "";
    }

    // Prefer to pick smaller ExitCode if multiple ExitCodes are recognized.
    for (Map.Entry<Integer, FrameworkExitInfo> exitInfoKV : spec.entrySet()) {
      int code = exitInfoKV.getKey();
      FrameworkExitInfo info = exitInfoKV.getValue();

      // Match RawCodePattern
      if (rawCode != info.getRawCodePattern()) {
        continue;
      }

      // Match RawDiagnosticsPattern
      if (info.getRawDiagnosticsPattern() != null) {
        if (!rawDiagnostics.toLowerCase().contains(
            info.getRawDiagnosticsPattern().toLowerCase())) {
          continue;
        }
      }

      // Found Known ExitCode
      return code;
    }

    // Preserve Unknown RawExitCode as ExitCode
    return rawCode;
  }

  public static FrameworkExitInfo getExitInfo(int code) {
    FrameworkExitInfo info = spec.get(code);
    if (info != null) {
      return info;
    } else {
      // Unknown FrameworkExitInfo
      if (code >= 0) {
        return new FrameworkExitInfo(
            code,
            null,
            ExitType.UNKNOWN,
            "Container exited with unknown exitcode which is issued from itself");
      } else {
        return new FrameworkExitInfo(
            code,
            null,
            ExitType.UNKNOWN,
            "Container exited with unknown exitcode which is issued from YARN");
      }
    }
  }
}
