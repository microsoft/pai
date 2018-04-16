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

public class SummarizedFrameworkInfo implements Serializable {
  // From Request
  private String frameworkName;
  private Integer frameworkVersion;
  private ExecutionType executionType;
  private String frameworkDescription;
  private String userName;
  private String queue;
  private Long firstRequestTimestamp;
  private Long lastRequestTimestamp;

  // From Status
  private FrameworkState frameworkState;
  private RetryPolicyState frameworkRetryPolicyState;
  private Long frameworkCompletedTimestamp;
  private Integer applicationExitCode;

  public static SummarizedFrameworkInfo newInstance(FrameworkRequest frameworkRequest, FrameworkStatus frameworkStatus) {
    SummarizedFrameworkInfo sFrameworkInfo = new SummarizedFrameworkInfo();

    FrameworkDescriptor frameworkDescriptor = frameworkRequest.getFrameworkDescriptor();
    sFrameworkInfo.setFrameworkName(frameworkRequest.getFrameworkName());
    sFrameworkInfo.setFrameworkVersion(frameworkDescriptor.getVersion());
    sFrameworkInfo.setExecutionType(frameworkDescriptor.getExecutionType());
    sFrameworkInfo.setFrameworkDescription(frameworkDescriptor.getDescription());
    sFrameworkInfo.setUserName(frameworkDescriptor.getUser().getName());
    sFrameworkInfo.setQueue(frameworkDescriptor.getPlatformSpecificParameters().getQueue());
    sFrameworkInfo.setFirstRequestTimestamp(frameworkRequest.getFirstRequestTimestamp());
    sFrameworkInfo.setLastRequestTimestamp(frameworkRequest.getLastRequestTimestamp());

    sFrameworkInfo.setFrameworkState(frameworkStatus.getFrameworkState());
    sFrameworkInfo.setFrameworkRetryPolicyState(frameworkStatus.getFrameworkRetryPolicyState());
    sFrameworkInfo.setFrameworkCompletedTimestamp(frameworkStatus.getFrameworkCompletedTimestamp());
    sFrameworkInfo.setApplicationExitCode(frameworkStatus.getApplicationExitCode());
    return sFrameworkInfo;
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

  public ExecutionType getExecutionType() {
    return executionType;
  }

  public void setExecutionType(ExecutionType executionType) {
    this.executionType = executionType;
  }

  public String getFrameworkDescription() {
    return frameworkDescription;
  }

  public void setFrameworkDescription(String frameworkDescription) {
    this.frameworkDescription = frameworkDescription;
  }

  public String getUserName() {
    return userName;
  }

  public void setUserName(String userName) {
    this.userName = userName;
  }

  public String getQueue() {
    return queue;
  }

  public void setQueue(String queue) {
    this.queue = queue;
  }

  public Long getFirstRequestTimestamp() {
    return firstRequestTimestamp;
  }

  public void setFirstRequestTimestamp(Long firstRequestTimestamp) {
    this.firstRequestTimestamp = firstRequestTimestamp;
  }

  public Long getLastRequestTimestamp() {
    return lastRequestTimestamp;
  }

  public void setLastRequestTimestamp(Long lastRequestTimestamp) {
    this.lastRequestTimestamp = lastRequestTimestamp;
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

  public Long getFrameworkCompletedTimestamp() {
    return frameworkCompletedTimestamp;
  }

  public void setFrameworkCompletedTimestamp(Long frameworkCompletedTimestamp) {
    this.frameworkCompletedTimestamp = frameworkCompletedTimestamp;
  }

  public Integer getApplicationExitCode() {
    return applicationExitCode;
  }

  public void setApplicationExitCode(Integer applicationExitCode) {
    this.applicationExitCode = applicationExitCode;
  }
}
