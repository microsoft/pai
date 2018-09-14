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

package com.microsoft.frameworklauncher.common.model;

import java.io.Serializable;

public class FrameworkStatus implements Serializable {
  // Framework static status from FrameworkRequest
  // Note other status can be retrieved from FrameworkRequest
  private String frameworkName;
  private Integer frameworkVersion;

  // Framework dynamic status
  private FrameworkState frameworkState;
  private RetryPolicyState frameworkRetryPolicyState;
  private Long frameworkCreatedTimestamp;
  private Long frameworkCompletedTimestamp;

  // Framework's current associated Application status
  // Note other status can be retrieved from RM
  private String applicationId;
  private Float applicationProgress;
  private String applicationTrackingUrl;
  private Long applicationLaunchedTimestamp;
  private Long applicationCompletedTimestamp;
  private Integer applicationExitCode;
  private String applicationExitDiagnostics;
  private ExitType applicationExitType;

  public static FrameworkStatus newInstance(FrameworkRequest frameworkRequest) {
    FrameworkStatus frameworkStatus = new FrameworkStatus();
    frameworkStatus.setFrameworkName(frameworkRequest.getFrameworkName());
    frameworkStatus.setFrameworkVersion(frameworkRequest.getFrameworkDescriptor().getVersion());
    frameworkStatus.setFrameworkState(FrameworkState.FRAMEWORK_WAITING);
    frameworkStatus.setFrameworkRetryPolicyState(new RetryPolicyState());
    frameworkStatus.setFrameworkCreatedTimestamp(frameworkRequest.getFirstRequestTimestamp());
    return frameworkStatus;
  }

  public String getFrameworkName() {
    return frameworkName;
  }

  public void setFrameworkName(String frameworkName) {
    this.frameworkName = frameworkName;
  }

  public Integer getFrameworkVersion() {
    return frameworkVersion;
  }

  public void setFrameworkVersion(Integer frameworkVersion) {
    this.frameworkVersion = frameworkVersion;
  }

  public FrameworkState getFrameworkState() {
    return frameworkState;
  }

  public void setFrameworkState(FrameworkState frameworkState) {
    this.frameworkState = frameworkState;
  }

  public RetryPolicyState getFrameworkRetryPolicyState() {
    return frameworkRetryPolicyState;
  }

  public void setFrameworkRetryPolicyState(RetryPolicyState frameworkRetryPolicyState) {
    this.frameworkRetryPolicyState = frameworkRetryPolicyState;
  }

  public Long getFrameworkCreatedTimestamp() {
    return frameworkCreatedTimestamp;
  }

  public void setFrameworkCreatedTimestamp(Long frameworkCreatedTimestamp) {
    this.frameworkCreatedTimestamp = frameworkCreatedTimestamp;
  }

  public Long getFrameworkCompletedTimestamp() {
    return frameworkCompletedTimestamp;
  }

  public void setFrameworkCompletedTimestamp(Long frameworkCompletedTimestamp) {
    this.frameworkCompletedTimestamp = frameworkCompletedTimestamp;
  }

  public String getApplicationId() {
    return applicationId;
  }

  public void setApplicationId(String applicationId) {
    this.applicationId = applicationId;
  }

  public Float getApplicationProgress() {
    return applicationProgress;
  }

  public void setApplicationProgress(Float applicationProgress) {
    this.applicationProgress = applicationProgress;
  }

  public String getApplicationTrackingUrl() {
    return applicationTrackingUrl;
  }

  public void setApplicationTrackingUrl(String applicationTrackingUrl) {
    this.applicationTrackingUrl = applicationTrackingUrl;
  }

  public Long getApplicationLaunchedTimestamp() {
    return applicationLaunchedTimestamp;
  }

  public void setApplicationLaunchedTimestamp(Long applicationLaunchedTimestamp) {
    this.applicationLaunchedTimestamp = applicationLaunchedTimestamp;
  }

  public Long getApplicationCompletedTimestamp() {
    return applicationCompletedTimestamp;
  }

  public void setApplicationCompletedTimestamp(Long applicationCompletedTimestamp) {
    this.applicationCompletedTimestamp = applicationCompletedTimestamp;
  }

  public Integer getApplicationExitCode() {
    return applicationExitCode;
  }

  public void setApplicationExitCode(Integer applicationExitCode) {
    this.applicationExitCode = applicationExitCode;
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
}
