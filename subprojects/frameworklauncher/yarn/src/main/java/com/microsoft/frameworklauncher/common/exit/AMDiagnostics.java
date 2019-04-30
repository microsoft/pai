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

import com.microsoft.frameworklauncher.common.exceptions.NotFoundException;
import com.microsoft.frameworklauncher.common.log.DefaultLogger;
import com.microsoft.frameworklauncher.common.model.ExitType;
import com.microsoft.frameworklauncher.common.utils.CommonUtils;
import com.microsoft.frameworklauncher.common.web.WebCommon;
import org.apache.hadoop.yarn.api.records.ApplicationId;
import org.apache.hadoop.yarn.client.api.YarnClient;

import java.io.Serializable;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class AMDiagnostics implements Serializable {
  private static final DefaultLogger LOGGER = new DefaultLogger(AMDiagnostics.class);

  private static final String LANDMARK_START = "<LAUNCHER_AM_DIAGNOSTICS_START>";
  private static final String LANDMARK_END = "<LAUNCHER_AM_DIAGNOSTICS_END>";
  private static final String LANDMARK_REGEX_STR = LANDMARK_START + "(.*)" + LANDMARK_END;
  private static final Pattern LANDMARK_REGEX = Pattern.compile(LANDMARK_REGEX_STR, Pattern.DOTALL);
  private static Integer serializationMaxBytes;

  private Integer applicationExitCode;
  // Static App ExitInfo
  private String applicationExitDescription;
  // Dynamic App ExitInfo
  private String applicationExitDiagnostics;
  private ExitType applicationExitType;
  // App CompletionPolicy TriggerInfo
  private String applicationExitTriggerMessage;
  private String applicationExitTriggerTaskRoleName;
  private Integer applicationExitTriggerTaskIndex;

  public Integer getApplicationExitCode() {
    return applicationExitCode;
  }

  public void setApplicationExitCode(Integer applicationExitCode) {
    this.applicationExitCode = applicationExitCode;
  }

  public String getApplicationExitDescription() {
    return applicationExitDescription;
  }

  public void setApplicationExitDescription(String applicationExitDescription) {
    this.applicationExitDescription = applicationExitDescription;
  }

  public String getApplicationExitDiagnostics() {
    return applicationExitDiagnostics;
  }

  public void setApplicationExitDiagnostics(String applicationExitDiagnostics) {
    this.applicationExitDiagnostics = applicationExitDiagnostics;
  }

  public ExitType getApplicationExitType() {
    return applicationExitType;
  }

  public void setApplicationExitType(ExitType applicationExitType) {
    this.applicationExitType = applicationExitType;
  }

  public String getApplicationExitTriggerMessage() {
    return applicationExitTriggerMessage;
  }

  public void setApplicationExitTriggerMessage(String applicationExitTriggerMessage) {
    this.applicationExitTriggerMessage = applicationExitTriggerMessage;
  }

  public String getApplicationExitTriggerTaskRoleName() {
    return applicationExitTriggerTaskRoleName;
  }

  public void setApplicationExitTriggerTaskRoleName(String applicationExitTriggerTaskRoleName) {
    this.applicationExitTriggerTaskRoleName = applicationExitTriggerTaskRoleName;
  }

  public Integer getApplicationExitTriggerTaskIndex() {
    return applicationExitTriggerTaskIndex;
  }

  public void setApplicationExitTriggerTaskIndex(Integer applicationExitTriggerTaskIndex) {
    this.applicationExitTriggerTaskIndex = applicationExitTriggerTaskIndex;
  }

  public static void limitSerializationMaxBytes(Integer serializationMaxBytes) {
    AMDiagnostics.serializationMaxBytes = serializationMaxBytes;
  }

  public static String generateAndSerialize(
      int applicationExitCode,
      String applicationExitDiagnostics,
      String applicationExitTriggerMessage,
      String applicationExitTriggerTaskRoleName,
      Integer applicationExitTriggerTaskIndex) {
    String serializedObj = LANDMARK_START + WebCommon.toJson(generate(
        applicationExitCode,
        applicationExitDiagnostics,
        applicationExitTriggerMessage,
        applicationExitTriggerTaskRoleName,
        applicationExitTriggerTaskIndex)) + LANDMARK_END;

    if (serializationMaxBytes != null &&
        serializationMaxBytes < serializedObj.length()) {
      // Best Effort to truncate
      LOGGER.logWarning(
          "Raw AMDiagnostics bytes %s is large than max bytes %s, " +
              "applicationExitDiagnostics will be truncated",
          serializedObj.length(), serializationMaxBytes);

      Integer exceededBytes = serializedObj.length() - serializationMaxBytes;
      Integer retainBytes = applicationExitDiagnostics.length() - exceededBytes;
      if (retainBytes >= 0) {
        // Truncate applicationExitDiagnostics is enough
        applicationExitDiagnostics = applicationExitDiagnostics.substring(0, retainBytes);
      } else {
        applicationExitDiagnostics = "";
        LOGGER.logWarning(
            "Truncated AMDiagnostics bytes %s is still large than max bytes %s, " +
                "applicationExitTriggerMessage will be truncated",
            serializationMaxBytes - retainBytes, serializationMaxBytes);

        retainBytes = applicationExitTriggerMessage.length() + retainBytes;
        if (retainBytes >= 0) {
          // Truncate applicationExitDiagnostics and applicationExitTriggerMessage is enough
          applicationExitTriggerMessage = applicationExitTriggerMessage.substring(0, retainBytes);
        } else {
          applicationExitTriggerMessage = "";

          LOGGER.logError(
              "Truncated AMDiagnostics bytes %s is still large than max bytes %s, " +
                  "nothing can be truncated anymore. So the final serialized " +
                  "AMDiagnostics may be truncated by RM again and thus may not be " +
                  "properly deserialized back",
              serializationMaxBytes - retainBytes, serializationMaxBytes);
        }
      }

      // Serialize again after the truncation
      serializedObj = LANDMARK_START + WebCommon.toJson(generate(
          applicationExitCode,
          applicationExitDiagnostics,
          applicationExitTriggerMessage,
          applicationExitTriggerTaskRoleName,
          applicationExitTriggerTaskIndex)) + LANDMARK_END;
    }

    return serializedObj;
  }

  public static AMDiagnostics generate(
      int applicationExitCode,
      String applicationExitDiagnostics,
      String applicationExitTriggerMessage,
      String applicationExitTriggerTaskRoleName,
      Integer applicationExitTriggerTaskIndex) {
    FrameworkExitInfo applicationExitInfo = FrameworkExitSpec.getExitInfo(applicationExitCode);
    AMDiagnostics amDiagnostics = new AMDiagnostics();

    amDiagnostics.setApplicationExitCode(applicationExitCode);
    amDiagnostics.setApplicationExitDescription(applicationExitInfo.getDescription());
    amDiagnostics.setApplicationExitDiagnostics(applicationExitDiagnostics);
    amDiagnostics.setApplicationExitType(applicationExitInfo.getType());
    amDiagnostics.setApplicationExitTriggerMessage(applicationExitTriggerMessage);
    amDiagnostics.setApplicationExitTriggerTaskRoleName(applicationExitTriggerTaskRoleName);
    amDiagnostics.setApplicationExitTriggerTaskIndex(applicationExitTriggerTaskIndex);

    return amDiagnostics;
  }

  // The retrieved AMDiagnostics string may be prepended or appended other string by YARN,
  // so using landmark to locate the original AMDiagnostics string.
  public static AMDiagnostics deserialize(String amDiagnostics) throws Exception {
    Matcher matcher = LANDMARK_REGEX.matcher(amDiagnostics);
    if (!matcher.find()) {
      throw new NotFoundException(String.format(
          "Cannot find exit info inside AMDiagnostics by landmark regex [%s]",
          LANDMARK_REGEX_STR));
    }

    return WebCommon.toObject(matcher.group(1), AMDiagnostics.class);
  }

  public static String retrieve(YarnClient yarnClient, String applicationId) throws Exception {
    String amDiagnostics = CommonUtils.trim(yarnClient
        .getApplicationReport(ApplicationId.fromString(applicationId))
        .getDiagnostics());
    if (equalEmpty(amDiagnostics)) {
      throw new Exception("Retrieved empty AMDiagnostics for " + applicationId);
    }
    return amDiagnostics;
  }

  public static Boolean equalEmpty(String amDiagnostics) {
    return (amDiagnostics == null ||
        amDiagnostics.trim().isEmpty() ||
        amDiagnostics.trim().toLowerCase().equals("null"));
  }
}
