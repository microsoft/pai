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

import com.microsoft.frameworklauncher.common.GlobalConstants;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.ExitType;
import org.apache.hadoop.yarn.api.records.ApplicationReport;
import org.apache.hadoop.yarn.client.api.YarnClient;
import org.apache.hadoop.yarn.util.ConverterUtils;

import java.util.Collections;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ExitDiagnostics {
  private static final DefaultLogger LOGGER = new DefaultLogger(ExitDiagnostics.class);

  // Make sure EXIT_STATUS_KEY_PREFIX does not contain \n,
  // since we need to use \n to local the end of EXIT_STATUS_KEY_PREFIX
  private static final String EXIT_STATUS_KEY_PREFIX = "[ExitStatus]: ";
  private static final String EXIT_CODE_PREFIX = "[ExitCode]: ";
  private static final String EXIT_DIAGNOSTICS_PREFIX = "[ExitDiagnostics]:\n";
  private static final String EXIT_TYPE_PREFIX = "[ExitType]: ";
  private static final String EXIT_CUSTOMIZED_DIAGNOSTICS_PREFIX = "[ExitCustomizedDiagnostics]:\n";
  private static final String RAW_PREFIX = "<Raw>";
  private static final String LANDMARK = "|";

  private static final Map<ExitStatusKey, ExitStatusValue> EXIT_STATUS_DEFINITION;

  static {
    final Map<ExitStatusKey, ExitStatusValue> DEF = new TreeMap<>(Collections.reverseOrder());

    /// <summary>
    /// Common ExitStatus
    /// </summary>
    ///
    DEF.put(ExitStatusKey.SUCCEEDED, new ExitStatusValue(
        ExitStatusKey.SUCCEEDED.toInt(),
        "Succeeded", ExitType.SUCCEEDED));

    /// <summary>
    /// Launcher ExitStatus
    /// </summary>
    ///
    DEF.put(ExitStatusKey.LAUNCHER_INTERNAL_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_INTERNAL_TRANSIENT_ERROR.toInt(),
        "Launcher internal transient error", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.LAUNCHER_INTERNAL_NON_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_INTERNAL_NON_TRANSIENT_ERROR.toInt(),
        "Launcher internal non-transient error", ExitType.NON_TRANSIENT));
    DEF.put(ExitStatusKey.LAUNCHER_INTERNAL_UNKNOWN_ERROR, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_INTERNAL_UNKNOWN_ERROR.toInt(),
        "Launcher internal unknown error", ExitType.UNKNOWN));
    // Launcher External Error is defined to be TransientError
    DEF.put(ExitStatusKey.LAUNCHER_REPORT_UNRETRIEVABLE, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_REPORT_UNRETRIEVABLE.toInt(),
        "ReportUnretrievable, maybe RM ZKStore cleaned", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.LAUNCHER_DIAGNOSTICS_UNRETRIEVABLE, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_DIAGNOSTICS_UNRETRIEVABLE.toInt(),
        "DiagnosticsUnretrievable, maybe RM ZKStore cleaned", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.LAUNCHER_DIAGNOSTICS_PARSE_ERROR, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_DIAGNOSTICS_PARSE_ERROR.toInt(),
        "DiagnosticsParseError, maybe network issues", ExitType.TRANSIENT_NORMAL));
    // ExitStatus undefined in Launcher is defined to be UNKNOWN
    DEF.put(ExitStatusKey.LAUNCHER_EXIT_STATUS_UNDEFINED, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_EXIT_STATUS_UNDEFINED.toInt(),
        "ExitStatus undefined in Launcher, maybe UserApplication itself failed.", ExitType.UNKNOWN));
    // ExitStatus not found in diagnostics is defined to be UNKNOWN
    DEF.put(ExitStatusKey.LAUNCHER_EXIT_STATUS_NOT_FOUND, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_EXIT_STATUS_NOT_FOUND.toInt(),
        "ExitStatus not found in diagnostics, maybe AM failed to unregister itself, such as AM Internal Exception", ExitType.UNKNOWN));
    DEF.put(ExitStatusKey.LAUNCHER_SUBMIT_APP_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_SUBMIT_APP_TRANSIENT_ERROR.toInt(),
        "Failed to submit UserApplication due to transient error, maybe YARN RM is down.", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.LAUNCHER_SUBMIT_APP_UNKNOWN_ERROR, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_SUBMIT_APP_UNKNOWN_ERROR.toInt(),
        "Failed to submit UserApplication due to unknown error.", ExitType.UNKNOWN));
    DEF.put(ExitStatusKey.LAUNCHER_SUBMIT_APP_NON_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_SUBMIT_APP_NON_TRANSIENT_ERROR.toInt(),
        "Failed to submit UserApplication due to non-transient error, maybe application is non-compliant.", ExitType.NON_TRANSIENT));
    DEF.put(ExitStatusKey.LAUNCHER_STOP_FRAMEWORK_REQUESTED, new ExitStatusValue(
        ExitStatusKey.LAUNCHER_STOP_FRAMEWORK_REQUESTED.toInt(),
        "UserApplication killed due to StopFrameworkRequest", ExitType.NON_TRANSIENT));

    /// <summary>
    /// AM ExitStatus
    /// </summary>
    ///
    // AM External Error is defined to be TransientError
    //      Note that AM External Error is already handled in RM, the AM container's retry policy in RM
    //      is the same as task container here, except for AM_KILLED_BY_USER
    DEF.put(ExitStatusKey.AM_KILLED_BY_USER, new ExitStatusValue(
        ExitStatusKey.AM_KILLED_BY_USER.toInt(),
        "AM Killed by User", ExitType.TRANSIENT_NORMAL));
    // AM Internal TransientError: hdfs error, env error...
    DEF.put(ExitStatusKey.AM_INTERNAL_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.AM_INTERNAL_TRANSIENT_ERROR.toInt(),
        "AM internal transient error", ExitType.TRANSIENT_NORMAL));
    // AM Internal NonTransientError: requested resource exceeded cluster max resource...
    DEF.put(ExitStatusKey.AM_INTERNAL_NON_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.AM_INTERNAL_NON_TRANSIENT_ERROR.toInt(),
        "AM internal non-transient error", ExitType.NON_TRANSIENT));
    DEF.put(ExitStatusKey.AM_INTERNAL_UNKNOWN_ERROR, new ExitStatusValue(
        ExitStatusKey.AM_INTERNAL_UNKNOWN_ERROR.toInt(),
        "AM internal unknown error", ExitType.UNKNOWN));
    DEF.put(ExitStatusKey.AM_RM_RESYNC_LOST, new ExitStatusValue(
        ExitStatusKey.AM_RM_RESYNC_LOST.toInt(),
        "AM lost after RMResynced", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.AM_RM_RESYNC_EXCEED, new ExitStatusValue(
        ExitStatusKey.AM_RM_RESYNC_EXCEED.toInt(),
        "AM exceed after RMResynced", ExitType.NON_TRANSIENT));
    // AM Internal Exception is defined to be UNKNOWN, handled by LAUNCHER_EXIT_STATUS_NOT_FOUND


    /// <summary>
    /// Container ExitStatus
    /// </summary>
    ///
    // Container External TransientError
    DEF.put(ExitStatusKey.CONTAINER_INVALID_EXIT_STATUS, new ExitStatusValue(
        -1000,
        "Container exited with invalid/default exit status, maybe container initialization failed", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_NOT_AVAILABLE_EXIT_STATUS, new ExitStatusValue(
        -2517,
        "Container exited with not available exit status, maybe container process creation failed", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_ABORTED, new ExitStatusValue(
        -100,
        "Container aborted by the system, such as AM released, node lost, application completed, RM unreserved, etc.", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_EXPIRED, new ExitStatusValue(
        -100,
        mustContain("Container expired since it was unused") + " , maybe not enough containers can be allocated in time", ExitType.TRANSIENT_CONFLICT));
    DEF.put(ExitStatusKey.CONTAINER_NODE_DISKS_FAILED, new ExitStatusValue(
        -101,
        "Container early discarded by NodeManager due to local bad disk, maybe no capacity left on the disk", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_PREEMPTED, new ExitStatusValue(
        -102,
        mustContain("Container preempted by scheduler"), ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_KILLED_BY_RM, new ExitStatusValue(
        -106,
        mustContain("Container Killed by ResourceManager"), ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_KILLED_BY_AM, new ExitStatusValue(
        -105,
        mustContain("Container killed by the ApplicationMaster"), ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_KILLED_AFTER_COMPLETED, new ExitStatusValue(
        -107,
        mustContain("Container killed on application-finish event"), ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_START_FAILED, new ExitStatusValue(
        ExitStatusKey.CONTAINER_START_FAILED.toInt(),
        "Container failed to start", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_RM_RESYNC_LOST, new ExitStatusValue(
        ExitStatusKey.CONTAINER_RM_RESYNC_LOST.toInt(),
        "Container lost after RMResynced", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_RM_RESYNC_EXCEED, new ExitStatusValue(
        ExitStatusKey.CONTAINER_RM_RESYNC_EXCEED.toInt(),
        "Container exceed after RMResynced", ExitType.NON_TRANSIENT));
    DEF.put(ExitStatusKey.CONTAINER_MIGRATE_TASK_REQUESTED, new ExitStatusValue(
        ExitStatusKey.CONTAINER_MIGRATE_TASK_REQUESTED.toInt(),
        "Container killed due to MigrateTaskRequest", ExitType.TRANSIENT_NORMAL));
    // Container External NonTransientError
    DEF.put(ExitStatusKey.CONTAINER_PHYSICAL_MEMORY_EXCEEDED, new ExitStatusValue(
        -104,
        "Container Killed since it exceeded the request physical memory", ExitType.NON_TRANSIENT));
    DEF.put(ExitStatusKey.CONTAINER_VIRTUAL_MEMORY_EXCEEDED, new ExitStatusValue(
        -103,
        "Container Killed since it exceeded the request virtual memory", ExitType.NON_TRANSIENT));
    DEF.put(ExitStatusKey.CONTAINER_EXTERNAL_UTILIZATION_SPIKED, new ExitStatusValue(
        -200,
        "Container Killed since the external (primary tenant) utilization spiked, and it has to yield its resource", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_PORT_CONFLICT, new ExitStatusValue(
        -210,
        "Container early discarded by NodeManager due to the request ports conflict", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.CONTAINER_AGENT_EXPIRY, new ExitStatusValue(
        ExitStatusKey.CONTAINER_AGENT_EXPIRY.toInt(),
        "Container Killed since no heartbeat is received before the hearbeat expiry timestamp", ExitType.TRANSIENT_NORMAL));
    // Container Internal Error is handled by LAUNCHER_EXIT_STATUS_UNDEFINED and UserApp_XXXError


    /// <summary>
    /// UserApplication Related ExitStatus / Launcher Return Code Convention with UserApp
    /// </summary>
    ///
    // UserApplication failed, and it can ensure that it will success within a finite retry times:
    //      Note that UserApplication should do some retries on the local machine first, return USER_APP_TRANSIENT_ERROR only if local retries does not work.
    DEF.put(ExitStatusKey.USER_APP_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.USER_APP_TRANSIENT_ERROR.toInt(),
        "UserApplication transient error: maybe hdfs error, env error, machine error, connection error...", ExitType.TRANSIENT_NORMAL));
    // UserApplication failed, and it can ensure that it will fail in every retry times:
    DEF.put(ExitStatusKey.USER_APP_NON_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.USER_APP_NON_TRANSIENT_ERROR.toInt(),
        "UserApplication non-transient error: maybe incorrect usage, input data corruption...", ExitType.NON_TRANSIENT));
    // UserApplication Reserved Exitcodes
    DEF.put(ExitStatusKey.USER_APP_FORCE_KILLED, new ExitStatusValue(
        137,
        "UserApplication's process force killed by others, maybe machine rebooted", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.USER_APP_TERMINATED, new ExitStatusValue(
        143,
        "UserApplication's process terminated by others, maybe machine rebooted", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.USER_APP_LOST, new ExitStatusValue(
        154,
        "UserApplication's process exited without exitcode, maybe machine unexpected shutdown", ExitType.TRANSIENT_NORMAL));

    /// <summary>
    /// Agent ExitStatus
    /// </summary>
    ///
    DEF.put(ExitStatusKey.AGENT_INTERNAL_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.AGENT_INTERNAL_TRANSIENT_ERROR.toInt(),
        "Agent internal transient error", ExitType.TRANSIENT_NORMAL));
    DEF.put(ExitStatusKey.AGENT_INTERNAL_NON_TRANSIENT_ERROR, new ExitStatusValue(
        ExitStatusKey.AGENT_INTERNAL_NON_TRANSIENT_ERROR.toInt(),
        "Agent internal non-transient error", ExitType.NON_TRANSIENT));
    DEF.put(ExitStatusKey.AGENT_INTERNAL_UNKNOWN_ERROR, new ExitStatusValue(
        ExitStatusKey.AGENT_INTERNAL_UNKNOWN_ERROR.toInt(),
        "Agent internal unknown error", ExitType.UNKNOWN));

    EXIT_STATUS_DEFINITION = Collections.unmodifiableMap(DEF);
  }

  public static ExitType lookupExitType(int exitCode) {
    return lookupExitType(exitCode, "");
  }

  public static ExitType lookupExitType(int exitCode, String diagnostics) {
    ExitStatusValue partialValue = new ExitStatusValue(exitCode, diagnostics, null);
    return lookupExitType(lookupExitStatusKey(partialValue));
  }

  public static ExitType lookupExitType(ExitStatusKey key) {
    return EXIT_STATUS_DEFINITION.get(key).exitType;
  }

  public static int lookupExitCode(ExitStatusKey key) {
    return EXIT_STATUS_DEFINITION.get(key).exitCode;
  }

  private static String surroundLandmark(String rawStr) {
    return LANDMARK + rawStr + LANDMARK;
  }

  private static String mustContain(String rawStr) {
    return surroundLandmark(rawStr);
  }

  private static String stripLandmark(String landmarkedStr) {
    int rawStr_StartIndex = landmarkedStr.indexOf(LANDMARK) + LANDMARK.length();
    int rawStr_EndIndex = landmarkedStr.lastIndexOf(LANDMARK);

    String rawStr;
    try {
      rawStr = landmarkedStr.substring(rawStr_StartIndex, rawStr_EndIndex);
    } catch (Exception e) {
      rawStr = "";
    }

    return rawStr;
  }

  private static ExitStatusKey lookupExitStatusKey(ExitStatusValue partialValue) {
    // Prefer to pick later declared ExitStatusKey if multiple ExitStatusKey matches.
    // See static.DEF for details.
    for (Map.Entry<ExitStatusKey, ExitStatusValue> definedExitStatus : EXIT_STATUS_DEFINITION.entrySet()) {
      ExitStatusKey definedExitStatusKey = definedExitStatus.getKey();
      ExitStatusValue definedExitStatusValue = definedExitStatus.getValue();
      if (partialValue.exitCode != definedExitStatusValue.exitCode) continue;

      String exitDiagnostics =
          partialValue.exitDiagnostics == null ? "" :
              partialValue.exitDiagnostics.toLowerCase();
      String definedExitDiagnostics =
          definedExitStatusValue.exitDiagnostics == null ? "" :
              definedExitStatusValue.exitDiagnostics.toLowerCase();

      // String in exitDiagnostics surround by _landmark is extracted to lookup matched ExitStatusKey
      // This is used to distinguish same exitCode with different exitDiagnostics
      String definedStripedExitDiagnostics = stripLandmark(definedExitDiagnostics);
      if (exitDiagnostics.contains(definedStripedExitDiagnostics)) {
        return definedExitStatusKey;
      }
    }

    ExitStatusKey undefinedKey = ExitStatusKey.LAUNCHER_EXIT_STATUS_UNDEFINED;
    ExitStatusValue undefinedValue = EXIT_STATUS_DEFINITION.get(undefinedKey);
    LOGGER.logDebug(
        "Cannot find a defined ExitStatusKey for partialValue %s. So assign [%s: %s]",
        partialValue, undefinedKey, undefinedValue);

    return undefinedKey;
  }

  public static String generateDiagnostics(ExitStatusValue partialValue) {
    return generateDiagnostics(partialValue, "");
  }

  public static String generateDiagnostics(ExitStatusValue partialValue, String customizedDiagnostics) {
    ExitStatusKey key = lookupExitStatusKey(partialValue);
    customizedDiagnostics =
        RAW_PREFIX + EXIT_CODE_PREFIX + partialValue.exitCode + "\n" +
            RAW_PREFIX + EXIT_DIAGNOSTICS_PREFIX + partialValue.exitDiagnostics + "\n" + GlobalConstants.LINE + "\n" +
            RAW_PREFIX + EXIT_CUSTOMIZED_DIAGNOSTICS_PREFIX + "\n" + customizedDiagnostics;
    return generateDiagnostics(key, customizedDiagnostics);
  }

  public static String generateDiagnostics(ExitStatusKey key) {
    return generateDiagnostics(key, "");
  }

  public static String generateDiagnostics(ExitStatusKey key, String customizedDiagnostics) {
    ExitStatusValue value = EXIT_STATUS_DEFINITION.get(key);
    String diagnostics =
        EXIT_STATUS_KEY_PREFIX + key + "\n" +
            EXIT_CODE_PREFIX + value.exitCode + "\n" +
            EXIT_DIAGNOSTICS_PREFIX + value.exitDiagnostics + "\n" +
            EXIT_TYPE_PREFIX + value.exitType + "\n" + GlobalConstants.LINE + "\n" +
            EXIT_CUSTOMIZED_DIAGNOSTICS_PREFIX + customizedDiagnostics + "\n";
    return diagnostics;
  }

  private static ExitStatusKey extractExitStatusKeyFromRawDiagnostics(String diagnostics) {
    ExitStatusKey notFoundKey = ExitStatusKey.LAUNCHER_EXIT_STATUS_NOT_FOUND;
    ExitStatusValue notFoundValue = EXIT_STATUS_DEFINITION.get(notFoundKey);
    ExitStatusKey parseErrorKey = ExitStatusKey.LAUNCHER_DIAGNOSTICS_PARSE_ERROR;
    ExitStatusValue parseErrorValue = EXIT_STATUS_DEFINITION.get(parseErrorKey);

    // Raw diagnostics generated from RMAppAttemptImpl.getAMContainerCrashedDiagnostics in this format:
    Pattern amContainerExitCodePattern = Pattern.compile("AM.*?Container.*?exit\\s*?Code.*?((\\+|-)?\\d+)", Pattern.CASE_INSENSITIVE);
    Matcher match = amContainerExitCodePattern.matcher(diagnostics);

    String exitCodeStr;
    if (match.matches()) {
      exitCodeStr = match.group(1).trim();
    } else {
      LOGGER.logDebug(
          "ExitDiagnostics does not contain AM container exit code. So assign [%s: %s]",
          notFoundKey, notFoundValue);
      return notFoundKey;
    }

    int exitCode;
    try {
      exitCode = Integer.parseInt(exitCodeStr);
    } catch (Exception e) {
      LOGGER.logDebug(e,
          "Failed to parse AM container exit code from String to Int: %s. So assign [%s: %s]",
          exitCodeStr, parseErrorKey, parseErrorValue);
      return parseErrorKey;
    }

    ExitStatusValue partialValue = new ExitStatusValue(exitCode, diagnostics, null);
    ExitStatusKey key = lookupExitStatusKey(partialValue);

    LOGGER.logDebug(
        "Succeeded to extractExitStatusKeyFromRawDiagnostics. So assign [%s: %s]",
        key, EXIT_STATUS_DEFINITION.get(key));

    return key;
  }

  public static ExitStatusKey extractExitStatusKey(String diagnostics) {
    ExitStatusKey notFoundKey = ExitStatusKey.LAUNCHER_EXIT_STATUS_NOT_FOUND;
    ExitStatusValue notFoundValue = EXIT_STATUS_DEFINITION.get(notFoundKey);
    ExitStatusKey parseErrorKey = ExitStatusKey.LAUNCHER_DIAGNOSTICS_PARSE_ERROR;
    ExitStatusValue parseErrorValue = EXIT_STATUS_DEFINITION.get(parseErrorKey);

    if (diagnostics == null || diagnostics.trim().isEmpty()) {
      LOGGER.logDebug(
          "ExitDiagnostics is null or empty. So assign [%s: %s]",
          notFoundKey, notFoundValue);
      return notFoundKey;
    }

    int prefixStr_StartIndex = diagnostics.indexOf(EXIT_STATUS_KEY_PREFIX);
    if (prefixStr_StartIndex == -1) {
      LOGGER.logDebug(
          "ExitDiagnostics does not contain prefix String for ExitStatus, may be AM container completed before AM start to run. " +
              "Fallback to extractExitStatusKeyFromRawDiagnostics",
          notFoundKey, notFoundValue);
      return extractExitStatusKeyFromRawDiagnostics(diagnostics);
    }

    int keyStr_StartIndex = prefixStr_StartIndex + EXIT_STATUS_KEY_PREFIX.length();
    int keyStr_EndIndex = diagnostics.indexOf("\n", keyStr_StartIndex);
    if (keyStr_EndIndex == -1) {
      LOGGER.logDebug(
          "ExitDiagnostics is incomplete to parse out ExitStatus. So assign [%s: %s]",
          parseErrorKey, parseErrorValue);
      return parseErrorKey;
    }

    String keyStr = diagnostics.substring(keyStr_StartIndex, keyStr_EndIndex).trim();
    if (keyStr.isEmpty()) {
      LOGGER.logDebug(
          "Empty ExitStatus found in ExitDiagnostics. So assign [%s: %s]",
          parseErrorKey, parseErrorValue);
      return parseErrorKey;
    }

    try {
      ExitStatusKey key = ExitStatusKey.valueOf(keyStr);
      LOGGER.logDebug(
          "Succeeded to extractExitStatusKey. So assign [%s: %s]",
          key, EXIT_STATUS_DEFINITION.get(key));
      return key;
    } catch (Exception e) {
      LOGGER.logDebug(e,
          "%s is not a member of ExitStatusKey. So assign [%s: %s]",
          keyStr, parseErrorKey, parseErrorValue);
      return parseErrorKey;
    }
  }

  public static String retrieveDiagnostics(YarnClient yarnClient, String applicationId) throws Exception {
    ApplicationReport report = yarnClient.getApplicationReport(ConverterUtils.toApplicationId(applicationId));
    String diagnostics = report.getDiagnostics();
    if (isDiagnosticsEmpty(diagnostics)) {
      throw new Exception("Retrieved Empty ExitDiagnostics for " + applicationId);
    }
    return diagnostics;
  }

  public static Boolean isDiagnosticsEmpty(String diagnostics) {
    return (diagnostics == null ||
        diagnostics.trim().isEmpty() ||
        diagnostics.trim().toLowerCase().equals("null"));
  }
}
